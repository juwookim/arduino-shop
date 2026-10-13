-- GitHub Pages(정적 호스팅) 전환: 결제 승인은 Edge Function(service_role)만 DB에 반영한다.
-- 서버 시크릿 비교 방식 대신 실행 권한 자체를 service_role로 제한한다.

create or replace function public.confirm_order_payment(
  p_order_number text,
  p_payment_key text,
  p_amount int,
  p_method text
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
  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception '주문을 찾을 수 없습니다.';
  end if;
  if v_order.status <> 'pending' then
    -- 새로고침 등으로 다시 들어온 경우 같은 결제키면 성공으로 간주
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

revoke execute on function public.confirm_order_payment(text, text, int, text) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(text, text, int, text) to service_role;

-- 이전 버전(시크릿 인자 5개)은 API에서 호출할 수 없게 막는다.
-- 더 이상 쓰지 않으므로 SQL 편집기에서 아래를 실행해 지워도 된다:
--   drop function public.confirm_order_payment(text, text, int, text, text);
--   drop table private.app_config; drop schema private;
revoke execute on function public.confirm_order_payment(text, text, int, text, text) from public, anon, authenticated;
