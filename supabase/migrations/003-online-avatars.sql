-- ============================================================
-- 会员系统升级：在线人数 + 头像
-- 用法：Supabase → SQL Editor → 粘贴全部 → Run
-- ============================================================

-- 1. 在线心跳表（一台设备一行，90 秒没动静就算离线）
create table if not exists public.online (
    device    text primary key,
    last_seen timestamptz not null default now()
);
alter table public.online enable row level security;

-- 2. 心跳 + 统计（在线数、注册数一起返回）
create or replace function public.heartbeat(p_device text)
returns json language plpgsql security definer set search_path = public as $$
begin
    insert into public.online(device, last_seen) values (p_device, now())
        on conflict (device) do update set last_seen = now();

    delete from public.online where last_seen < now() - interval '1 day';

    return json_build_object(
        'online', (select count(*) from public.online where last_seen > now() - interval '90 seconds'),
        'users',  (select count(*) from public.users)
    );
end; $$;

-- 3. 头像列（存压缩后的 data URL，几十 KB 以内）
alter table public.profiles add column if not exists avatar text;

-- 4. 上传头像：必须带上自己的名字 + 密码哈希，防止别人改你的头像
create or replace function public.set_avatar(p_name text, p_hash text, p_data text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not exists (select 1 from public.users where name = p_name and hash = p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if length(p_data) > 200000 then
        return json_build_object('ok', false, 'error', 'too-large');
    end if;
    update public.profiles set avatar = p_data where name = p_name;
    return json_build_object('ok', true);
end; $$;

-- 5. 取头像（公开，小图无所谓）
create or replace function public.get_avatar(p_name text)
returns text language sql security definer set search_path = public as $$
    select avatar from public.profiles where name = p_name;
$$;

grant execute on function public.heartbeat(text) to anon;
grant execute on function public.set_avatar(text, text, text) to anon;
grant execute on function public.get_avatar(text) to anon;

-- ============================================================
-- 跑完即可，网页会自动开始显示「在线 / 注册」。
-- ============================================================