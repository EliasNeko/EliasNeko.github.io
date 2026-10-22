-- ============================================================
-- 咖啡店会员系统 · Supabase 建库脚本
-- 用法：Supabase 后台 → SQL Editor → New query → 粘贴全部 → Run
-- ============================================================

-- 1. 账号表：登录只需要 名字 / 盐 / 哈希
create table if not exists public.users (
    name    text primary key,
    salt    text not null,
    hash    text not null,
    created timestamptz not null default now()
);

-- 2. 私密表：QQ / 微信 / 邮箱，只有站长能看到（网页读不到）
create table if not exists public.profiles (
    name    text primary key references public.users(name) on delete cascade,
    contact text,
    email   text,
    device  text,
    time    text,
    created timestamptz not null default now()
);

-- 3. 打开行级权限
alter table public.users    enable row level security;
alter table public.profiles enable row level security;

-- 4. 允许匿名读 users（登录要拿盐，和公开的 users.json 一个道理）
drop policy if exists "anyone can read users" on public.users;
create policy "anyone can read users"
    on public.users for select
    using (true);

-- profiles 不加任何策略 = 匿名读不到，只有站长在后台能看

-- 5. 注册函数：一次写两张表，绕开 RLS
create or replace function public.register_user(
    p_name text, p_salt text, p_hash text,
    p_contact text, p_email text, p_device text, p_time text
) returns json
language plpgsql
security definer
set search_path = public
as $$
begin
    if length(p_name) < 2 or length(p_name) > 12 then
        return json_build_object('ok', false, 'error', 'bad-name');
    end if;

    if exists (select 1 from public.users where name = p_name) then
        return json_build_object('ok', false, 'error', 'duplicate');
    end if;

    insert into public.users(name, salt, hash) values (p_name, p_salt, p_hash);
    insert into public.profiles(name, contact, email, device, time)
        values (p_name, p_contact, p_email, p_device, p_time);

    return json_build_object('ok', true);
end;
$$;

-- 6. 登录校验函数：只回 true / false，不泄露任何资料
create or replace function public.check_login(p_name text, p_hash text)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.users
        where name = p_name and hash = p_hash
    );
$$;

-- 7. 只把这几个入口开给匿名访客
grant execute on function public.register_user(text, text, text, text, text, text, text) to anon;
grant execute on function public.check_login(text, text) to anon;
grant select on public.users to anon;

-- ============================================================
-- 完事后，在 Project Settings → API 里复制两样东西：
--   Project URL      （形如 https://xxxx.supabase.co）
--   anon public key  （很长的一串）
-- 把这两个发我，我接进网页。
-- ============================================================
