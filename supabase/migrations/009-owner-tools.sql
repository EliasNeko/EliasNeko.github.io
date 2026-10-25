-- ============================================================
-- 站长工具 · 云端版（可选）
-- 现在前端的授予 / 封禁先做「站长本机管理台」，运行这份 SQL 后
-- 才具备跨设备、全站生效的云端能力。
-- 用法：Supabase → SQL Editor → 粘贴 → Run
-- ============================================================

-- 1. 站长授予的头衔
create table if not exists public.custom_titles (
    id       text primary key,
    name     text not null,
    tone     text not null default 'purple',
    icon     text default '✦',
    created  timestamptz not null default now()
);

-- 2. 谁拥有哪个头衔
create table if not exists public.user_titles (
    user_name  text not null,
    title_id   text not null references public.custom_titles(id) on delete cascade,
    granted_by text,
    created    timestamptz not null default now(),
    primary key (user_name, title_id)
);

-- 3. 封禁名单
create table if not exists public.banned_users (
    name    text primary key,
    reason  text,
    created timestamptz not null default now()
);

alter table public.custom_titles enable row level security;
alter table public.user_titles enable row level security;
alter table public.banned_users enable row level security;

-- 4. 站长校验：只有用户名 + 哈希都对得上「龙潜猫隐」才放行
create or replace function public.admin_check(p_admin text, p_hash text)
returns boolean language sql security definer set search_path = public as $$
    select p_admin = '龙潜猫隐'
       and exists (select 1 from public.users where name = p_admin and hash = p_hash);
$$;

-- 5. 授予头衔
create or replace function public.admin_grant_title(
    p_admin text, p_hash text, p_user text, p_title text, p_tone text
) returns json language plpgsql security definer set search_path = public as $$
declare
    v_id text;
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if not exists (select 1 from public.users where name = p_user) then
        return json_build_object('ok', false, 'error', 'no-user');
    end if;
    if length(coalesce(p_title, '')) < 1 or length(p_title) > 20 then
        return json_build_object('ok', false, 'error', 'bad-title');
    end if;

    v_id := 'grant-' || md5(random()::text || clock_timestamp()::text);
    insert into public.custom_titles(id, name, tone, icon)
        values (v_id, p_title, coalesce(nullif(p_tone, ''), 'purple'), '✦');
    insert into public.user_titles(user_name, title_id, granted_by)
        values (p_user, v_id, p_admin);
    return json_build_object('ok', true, 'id', v_id);
end; $$;

-- 6. 撤销头衔
create or replace function public.admin_revoke_title(
    p_admin text, p_hash text, p_user text, p_id text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    delete from public.user_titles where user_name = p_user and title_id = p_id;
    delete from public.custom_titles where id = p_id;
    return json_build_object('ok', true);
end; $$;

-- 7. 封禁 / 解封
create or replace function public.admin_ban_user(
    p_admin text, p_hash text, p_user text, p_reason text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if p_user = '龙潜猫隐' then
        return json_build_object('ok', false, 'error', 'self');
    end if;
    insert into public.banned_users(name, reason) values (p_user, coalesce(p_reason, ''))
        on conflict (name) do update set reason = excluded.reason;
    return json_build_object('ok', true);
end; $$;

create or replace function public.admin_unban_user(
    p_admin text, p_hash text, p_user text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    delete from public.banned_users where name = p_user;
    return json_build_object('ok', true);
end; $$;

-- 8. 公开读取：所有人的亲封头衔 + 封禁名单（不需要登录）
create or replace function public.titles_all()
returns json language sql security definer set search_path = public as $$
    select coalesce(json_agg(json_build_object(
        'user', ut.user_name, 'id', ct.id, 'name', ct.name, 'tone', ct.tone, 'icon', ct.icon
    )), '[]'::json)
    from public.user_titles ut join public.custom_titles ct on ct.id = ut.title_id;
$$;

create or replace function public.bans_all()
returns json language sql security definer set search_path = public as $$
    select coalesce(json_agg(name), '[]'::json) from public.banned_users;
$$;

grant execute on function public.admin_grant_title(text, text, text, text, text) to anon;
grant execute on function public.admin_revoke_title(text, text, text, text) to anon;
grant execute on function public.admin_ban_user(text, text, text, text) to anon;
grant execute on function public.admin_unban_user(text, text, text) to anon;
grant execute on function public.titles_all() to anon;
grant execute on function public.bans_all() to anon;
