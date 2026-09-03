
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.validar_tipo_movimentacao() from anon, authenticated, public;
revoke all on function public.has_role(uuid, public.app_role) from anon, public;
revoke all on function public.is_superuser() from anon, public;
revoke all on function public.current_clinica() from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_superuser() to authenticated;
grant execute on function public.current_clinica() to authenticated;
