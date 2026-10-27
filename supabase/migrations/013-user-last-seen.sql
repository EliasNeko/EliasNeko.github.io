-- 013 · 每个用户最后上线时间（修正版：users 的注册时间列叫 created，不是 created_at）
-- Supabase → SQL Editor 整段跑一次，可以重复跑

alter table public.users add column if not exists last_seen timestamptz;

-- 进站 / 登录时打一次点
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

-- 只给已登录（站长在 SQL Editor / 后台）用，不给匿名导出名单
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
  select u.name, u.created as created_at, u.last_seen, p.contact, p.email
  from public.users u
  left join public.profiles p on p.name = u.name
  order by coalesce(u.last_seen, u.created) desc nulls last;
$$;

revoke all on function public.admin_user_list() from anon, authenticated;
grant execute on function public.touch_last_seen(text) to anon, authenticated;

-- 跑完之后在 SQL Editor 里查名单：
--   select * from public.admin_user_list();
