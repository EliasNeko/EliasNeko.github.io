-- 013 · 每个用户最后上线时间
-- 在 Supabase → SQL Editor 里整段跑一次即可（可重复跑，不会报错）

alter table public.users add column if not exists last_seen timestamptz;

-- 登录 / 进站时打一次点
create or replace function public.touch_last_seen(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set last_seen = now() where name = p_name;
end;
$$;

grant execute on function public.touch_last_seen(text) to anon, authenticated;

-- 站长工具用：一份带最后上线时间的名单
create or replace function public.admin_user_list()
returns table (
  name text,
  created_at timestamptz,
  last_seen timestamptz,
  contact text,
  email text
)
language sql
security definer
set search_path = public
as $$
  select u.name, u.created_at, u.last_seen, p.contact, p.email
  from public.users u
  left join public.profiles p on p.name = u.name
  order by coalesce(u.last_seen, u.created_at) desc nulls last;
$$;

grant execute on function public.admin_user_list() to anon, authenticated;
