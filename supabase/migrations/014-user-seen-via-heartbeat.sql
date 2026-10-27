-- 014 · 最后上线（走 heartbeat 这条已被代理放行的路）
-- Supabase → SQL Editor 整段跑一次。可重复跑。

create table if not exists public.user_seen (
    name      text primary key,
    last_seen timestamptz not null default now()
);
alter table public.user_seen enable row level security;

-- 老的单参数版本先删掉，否则和新版本会重载冲突
drop function if exists public.heartbeat(text);

create or replace function public.heartbeat(p_device text, p_name text default null)
returns json language plpgsql security definer set search_path = public as $$
begin
    insert into public.online(device, last_seen) values (p_device, now())
        on conflict (device) do update set last_seen = now();

    if p_name is not null and length(p_name) > 0 then
        insert into public.user_seen(name, last_seen) values (p_name, now())
            on conflict (name) do update set last_seen = now();
    end if;

    delete from public.online where last_seen < now() - interval '1 day';

    return json_build_object(
        'online', (select count(*) from public.online where last_seen > now() - interval '90 seconds'),
        'users',  (select count(*) from public.users)
    );
end; $$;

grant execute on function public.heartbeat(text, text) to anon, authenticated;

-- 名单：最后上线优先看 user_seen
create or replace function public.admin_user_list()
returns table (name text, created_at timestamptz, last_seen timestamptz, contact text, email text)
language sql security definer set search_path = public as $$
  select u.name, u.created as created_at, coalesce(s.last_seen, u.last_seen) as last_seen, p.contact, p.email
  from public.users u
  left join public.user_seen s on s.name = u.name
  left join public.profiles p on p.name = u.name
  order by coalesce(s.last_seen, u.last_seen, u.created) desc nulls last;
$$;
