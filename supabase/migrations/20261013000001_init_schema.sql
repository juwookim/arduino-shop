-- 아두이노 쇼핑몰 초기 스키마

-- ───────────── 테이블 ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0
);

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text,
  brand text,
  price int not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  summary text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  source_url text,
  created_at timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),
  order_name text not null,
  items_amount int not null,
  shipping_fee int not null,
  total_amount int not null,
  recipient text not null,
  phone text not null,
  zipcode text,
  address1 text not null,
  address2 text,
  memo text,
  payment_key text,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  unit_price int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- 서버 전용 설정 (결제 승인 시크릿). API로 노출되지 않는 스키마.
create schema if not exists private;
create table private.app_config (
  key text primary key,
  value text not null
);
revoke all on schema private from anon, authenticated;

-- ───────────── 헬퍼 / 트리거 ─────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: 본인만 조회/수정, 관리자는 전체 조회. role 컬럼은 사용자가 수정 불가.
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated, anon;
grant update (name, phone) on public.profiles to authenticated;

-- categories / products: 누구나 조회, 관리자만 쓰기
create policy "categories_select_all" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products_select_active_or_admin" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products_admin_insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products_admin_update" on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products_admin_delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- orders: 본인 주문 조회, 관리자는 전체 조회 + 상태 변경. 생성/결제는 함수로만.
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders_admin_update" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke insert, update, delete on public.orders from authenticated, anon;
grant update (status) on public.orders to authenticated;

create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );
revoke insert, update, delete on public.order_items from authenticated, anon;

-- ───────────── 주문 함수 ─────────────
-- 주문 생성: 가격은 클라이언트가 아닌 DB 기준으로 계산한다.
create or replace function public.create_order(
  p_items jsonb,            -- [{"product_id": 1, "quantity": 2}, ...]
  p_recipient text,
  p_phone text,
  p_zipcode text,
  p_address1 text,
  p_address2 text,
  p_memo text
)
returns table (order_id uuid, order_number text, order_name text, total_amount int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_items_amount int := 0;
  v_shipping int;
  v_first_name text;
  v_count int := 0;
  v_order_name text;
  r record;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception '주문할 상품이 없습니다.';
  end if;
  if coalesce(trim(p_recipient), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address1), '') = '' then
    raise exception '배송 정보를 입력해 주세요.';
  end if;

  for r in
    select p.id, p.name, p.price, p.stock, p.is_active, i.quantity
    from jsonb_to_recordset(p_items) as i (product_id bigint, quantity int)
    join public.products p on p.id = i.product_id
  loop
    if not r.is_active then
      raise exception '판매 중지된 상품입니다: %', r.name;
    end if;
    if r.quantity is null or r.quantity < 1 or r.quantity > 999 then
      raise exception '수량이 올바르지 않습니다: %', r.name;
    end if;
    if r.stock < r.quantity then
      raise exception '재고가 부족합니다: % (남은 수량 %개)', r.name, r.stock;
    end if;
    v_items_amount := v_items_amount + r.price * r.quantity;
    v_count := v_count + 1;
    if v_first_name is null then v_first_name := r.name; end if;
  end loop;

  if v_count <> jsonb_array_length(p_items) then
    raise exception '존재하지 않는 상품이 포함되어 있습니다.';
  end if;

  v_shipping := case when v_items_amount >= 50000 then 0 else 3000 end;
  v_order_name := case when v_count > 1 then v_first_name || ' 외 ' || (v_count - 1) || '건' else v_first_name end;
  v_order_number := 'AS' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into public.orders (order_number, user_id, order_name, items_amount, shipping_fee, total_amount,
                             recipient, phone, zipcode, address1, address2, memo)
  values (v_order_number, v_uid, left(v_order_name, 100), v_items_amount, v_shipping, v_items_amount + v_shipping,
          trim(p_recipient), trim(p_phone), p_zipcode, trim(p_address1), p_address2, p_memo)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order_id, p.id, p.name, p.price, i.quantity
  from jsonb_to_recordset(p_items) as i (product_id bigint, quantity int)
  join public.products p on p.id = i.product_id;

  return query select v_order_id, v_order_number, left(v_order_name, 100), v_items_amount + v_shipping;
end;
$$;

revoke execute on function public.create_order(jsonb, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text) to authenticated;

-- 결제 승인 반영: 서버(Next.js API)만 아는 시크릿으로 보호. 재고 차감 + 결제완료 처리.
create or replace function public.confirm_order_payment(
  p_order_number text,
  p_payment_key text,
  p_amount int,
  p_method text,
  p_secret text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  r record;
begin
  if p_secret is null or p_secret <> (select value from private.app_config where key = 'order_confirm_secret') then
    raise exception 'unauthorized';
  end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception '주문을 찾을 수 없습니다.';
  end if;
  if v_order.status <> 'pending' then
    -- 이미 처리된 주문(새로고침 등)은 같은 결제키면 성공으로 간주
    return v_order.payment_key = p_payment_key;
  end if;
  if v_order.total_amount <> p_amount then
    raise exception '결제 금액이 일치하지 않습니다.';
  end if;

  for r in select product_id, quantity, product_name from public.order_items where order_id = v_order.id loop
    update public.products set stock = stock - r.quantity
    where id = r.product_id and stock >= r.quantity;
    if not found then
      raise exception '재고가 부족합니다: %', r.product_name;
    end if;
  end loop;

  update public.orders
  set status = 'paid', payment_key = p_payment_key, payment_method = p_method, paid_at = now()
  where id = v_order.id;
  return true;
end;
$$;

revoke execute on function public.confirm_order_payment(text, text, int, text, text) from public;
grant execute on function public.confirm_order_payment(text, text, int, text, text) to anon, authenticated;

-- ───────────── 스토리지 (관리자 상품 이미지 업로드) ─────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
