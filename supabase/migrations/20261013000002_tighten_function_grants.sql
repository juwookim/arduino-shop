-- 트리거 함수는 API로 호출될 필요가 없다
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- 결제 승인은 로그인한 사용자 세션 + 서버 시크릿으로만 호출된다
revoke execute on function public.confirm_order_payment(text, text, int, text, text) from anon;
