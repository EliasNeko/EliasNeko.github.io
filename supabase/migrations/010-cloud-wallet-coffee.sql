-- ============================================================
-- 云端余额 / 签到 / 转账 / 咖啡投稿与审核 / 云端头衔 / 封禁
-- 用法：Supabase → SQL Editor → 粘贴全部 → Run
-- 这份脚本可以重复运行：表用 if not exists，函数用 create or replace。
-- ============================================================

-- 0. 身份校验
create or replace function public.kv_auth(p_name text, p_hash text)
returns boolean language sql security definer set search_path = public as $$
    select exists (select 1 from public.users where name = p_name and hash = p_hash);
$$;

create or replace function public.is_owner(p_name text, p_hash text)
returns boolean language sql security definer set search_path = public as $$
    select p_name = '龙潜猫隐'
       and exists (select 1 from public.users where name = p_name and hash = p_hash);
$$;

-- 1. 钱包（永久余额，不按天重置）
create table if not exists public.wallets (
    name    text primary key references public.users(name) on delete cascade,
    balance numeric(12,2) not null default 500,
    updated timestamptz not null default now()
);
alter table public.wallets enable row level security;

create table if not exists public.wallet_logs (
    id     bigserial primary key,
    name   text not null,
    delta  numeric(12,2) not null,
    note   text,
    created timestamptz not null default now()
);
alter table public.wallet_logs enable row level security;

-- 2. 签到（每天 +50，不签到没有）
create table if not exists public.checkins (
    name text not null,
    day  date not null,
    amount numeric(12,2) not null default 50,
    created timestamptz not null default now(),
    primary key (name, day)
);
alter table public.checkins enable row level security;

-- 3. 转账记录
create table if not exists public.transfers (
    id     bigserial primary key,
    from_name text not null,
    to_name   text not null,
    amount    numeric(12,2) not null,
    created   timestamptz not null default now()
);
alter table public.transfers enable row level security;

-- 4. 咖啡商品（站长原有 + 用户投稿）
create table if not exists public.coffees (
    id       text primary key,
    name     text not null,
    story    text not null default '',
    price    numeric(12,2) not null check (price > 0),
    image    text default '',
    maker    text not null,
    status   text not null default 'pending' check (status in ('pending','approved','rejected')),
    review_note text default '',
    created  timestamptz not null default now(),
    approved_at timestamptz
);
alter table public.coffees enable row level security;

create table if not exists public.coffee_orders (
    id bigserial primary key,
    buyer text not null,
    coffee_id text not null,
    maker text not null,
    amount numeric(12,2) not null,
    created timestamptz not null default now()
);
alter table public.coffee_orders enable row level security;

-- 5. 站长亲封头衔 / 封禁
create table if not exists public.custom_titles (
    id text primary key,
    name text not null,
    tone text not null default 'purple',
    icon text default '✦',
    created timestamptz not null default now()
);
alter table public.custom_titles enable row level security;

create table if not exists public.user_titles (
    user_name text not null,
    title_id text not null references public.custom_titles(id) on delete cascade,
    granted_by text,
    created timestamptz not null default now(),
    primary key (user_name, title_id)
);
alter table public.user_titles enable row level security;

create table if not exists public.banned_users (
    name text primary key,
    reason text,
    created timestamptz not null default now()
);
alter table public.banned_users enable row level security;

-- 6. 初始商品（生椰拿铁的收益归时雨）
insert into public.coffees(id, name, story, price, maker, status, approved_at) values
('yejia', '手冲耶加雪啡', '柑橘与花香，入口干净。', 32, '龙潜猫隐', 'approved', now()),
('bingboke', '冰博克拿铁', '冰爽甘甜，无穷回味。', 28, '龙潜猫隐', 'approved', now()),
('dirty', '燕麦dirty', '健康温暖，温馨口腔。', 19, '龙潜猫隐', 'approved', now()),
('shengye', '生椰拿铁', '椰香先到，苦后回甘。', 26, '时雨', 'approved', now())
on conflict (id) do nothing;

-- 7. 钱包读写
create or replace function public.wallet_get(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
    v_bal numeric(12,2);
    v_checked boolean;
begin
    if not public.kv_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if public.is_owner(p_name, p_hash) then
        return json_build_object('ok', true, 'infinite', true, 'balance', 0,
            'checked_in', true, 'checkin_amount', 50);
    end if;

    insert into public.wallets(name, balance) values (p_name, 500)
        on conflict (name) do nothing;

    select balance into v_bal from public.wallets where name = p_name;
    select exists(select 1 from public.checkins
        where name = p_name and day = (now() at time zone 'Asia/Shanghai')::date) into v_checked;

    return json_build_object('ok', true, 'infinite', false, 'balance', v_bal,
        'checked_in', v_checked, 'checkin_amount', 50);
end; $$;

create or replace function public.wallet_checkin(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
    v_day date := (now() at time zone 'Asia/Shanghai')::date;
    v_bal numeric(12,2);
begin
    if not public.kv_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if public.is_owner(p_name, p_hash) then
        return json_build_object('ok', true, 'infinite', true, 'already', true, 'balance', 0);
    end if;

    insert into public.wallets(name, balance) values (p_name, 500)
        on conflict (name) do nothing;

    if exists(select 1 from public.checkins where name = p_name and day = v_day) then
        select balance into v_bal from public.wallets where name = p_name;
        return json_build_object('ok', true, 'infinite', false, 'already', true, 'balance', v_bal);
    end if;

    insert into public.checkins(name, day, amount) values (p_name, v_day, 50);
    update public.wallets set balance = balance + 50, updated = now() where name = p_name
        returning balance into v_bal;
    insert into public.wallet_logs(name, delta, note) values (p_name, 50, '每日签到');

    return json_build_object('ok', true, 'infinite', false, 'already', false, 'balance', v_bal);
end; $$;

-- 8. 转账（只能转给好友；站长无限）
create or replace function public.wallet_transfer(
    p_from text, p_hash text, p_to text, p_amount numeric
) returns json language plpgsql security definer set search_path = public as $$
declare
    v_from numeric(12,2);
    v_owner boolean;
begin
    if not public.kv_auth(p_from, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if p_from = p_to then
        return json_build_object('ok', false, 'error', 'self');
    end if;
    if p_amount is null or p_amount <= 0 then
        return json_build_object('ok', false, 'error', 'bad-amount');
    end if;
    if not exists(select 1 from public.users where name = p_to) then
        return json_build_object('ok', false, 'error', 'no-user');
    end if;
    if not exists(select 1 from public.friends
        where (a = p_from and b = p_to) or (a = p_to and b = p_from)) then
        return json_build_object('ok', false, 'error', 'not-friend');
    end if;

    v_owner := public.is_owner(p_from, p_hash);
    insert into public.wallets(name, balance) values (p_from, 500)
        on conflict (name) do nothing;
    insert into public.wallets(name, balance) values (p_to, 500)
        on conflict (name) do nothing;

    if not v_owner then
        select balance into v_from from public.wallets where name = p_from for update;
        if v_from < p_amount then
            return json_build_object('ok', false, 'error', 'no-money');
        end if;
        update public.wallets set balance = balance - p_amount, updated = now() where name = p_from;
        insert into public.wallet_logs(name, delta, note)
            values (p_from, -p_amount, '转给 ' || p_to);
    end if;

    update public.wallets set balance = balance + p_amount, updated = now() where name = p_to;
    insert into public.wallet_logs(name, delta, note)
        values (p_to, p_amount, '来自 ' || p_from);
    insert into public.transfers(from_name, to_name, amount) values (p_from, p_to, p_amount);

    return json_build_object('ok', true, 'infinite', v_owner, 'amount', p_amount);
end; $$;

-- 9. 直接余额消费（预留给其它购买）
create or replace function public.wallet_spend(
    p_name text, p_hash text, p_amount numeric, p_note text
) returns json language plpgsql security definer set search_path = public as $$
declare
    v_bal numeric(12,2);
begin
    if not public.kv_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if p_amount is null or p_amount <= 0 then
        return json_build_object('ok', false, 'error', 'bad-amount');
    end if;
    if public.is_owner(p_name, p_hash) then
        return json_build_object('ok', true, 'infinite', true);
    end if;

    insert into public.wallets(name, balance) values (p_name, 500)
        on conflict (name) do nothing;
    select balance into v_bal from public.wallets where name = p_name for update;
    if v_bal < p_amount then
        return json_build_object('ok', false, 'error', 'no-money');
    end if;
    update public.wallets set balance = balance - p_amount, updated = now() where name = p_name;
    insert into public.wallet_logs(name, delta, note)
        values (p_name, -p_amount, coalesce(p_note, '消费'));
    return json_build_object('ok', true, 'infinite', false);
end; $$;

-- 10. 咖啡列表 / 购买 / 投稿 / 审核
create or replace function public.coffee_list()
returns json language sql security definer set search_path = public as $$
    select coalesce(json_agg(json_build_object(
        'id', id, 'name', name, 'story', story, 'price', price,
        'image', image, 'maker', maker, 'created', created
    ) order by created), '[]'::json)
    from public.coffees where status = 'approved';
$$;

create or replace function public.coffee_buy(p_buyer text, p_hash text, p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare
    v_price numeric(12,2);
    v_maker text;
    v_bal numeric(12,2);
    v_owner boolean;
begin
    if not public.kv_auth(p_buyer, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    select price, maker into v_price, v_maker
        from public.coffees where id = p_id and status = 'approved';
    if v_price is null then
        return json_build_object('ok', false, 'error', 'not-found');
    end if;

    v_owner := public.is_owner(p_buyer, p_hash);
    insert into public.wallets(name, balance) values (p_buyer, 500)
        on conflict (name) do nothing;
    insert into public.wallets(name, balance) values (v_maker, 500)
        on conflict (name) do nothing;

    if not v_owner then
        select balance into v_bal from public.wallets where name = p_buyer for update;
        if v_bal < v_price then
            return json_build_object('ok', false, 'error', 'no-money');
        end if;
        update public.wallets set balance = balance - v_price, updated = now() where name = p_buyer;
        insert into public.wallet_logs(name, delta, note)
            values (p_buyer, -v_price, '购买 ' || p_id);
    end if;

    update public.wallets set balance = balance + v_price, updated = now() where name = v_maker;
    insert into public.wallet_logs(name, delta, note)
        values (v_maker, v_price, '咖啡售出 ' || p_id);
    insert into public.coffee_orders(buyer, coffee_id, maker, amount)
        values (p_buyer, p_id, v_maker, v_price);

    return json_build_object('ok', true, 'price', v_price, 'maker', v_maker, 'infinite', v_owner);
end; $$;

create or replace function public.coffee_submit(
    p_name text, p_hash text, p_coffee text, p_story text, p_price numeric, p_image text
) returns json language plpgsql security definer set search_path = public as $$
declare
    v_max numeric(12,2);
    v_id text;
begin
    if not public.kv_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if length(coalesce(p_coffee, '')) < 2 or length(p_coffee) > 20 then
        return json_build_object('ok', false, 'error', 'bad-name');
    end if;
    if length(coalesce(p_story, '')) < 10 or length(p_story) > 2000 then
        return json_build_object('ok', false, 'error', 'bad-story');
    end if;
    if p_price is null or p_price <= 0 then
        return json_build_object('ok', false, 'error', 'bad-price');
    end if;
    if length(coalesce(p_image, '')) > 250000 then
        return json_build_object('ok', false, 'error', 'image-too-large');
    end if;

    select coalesce(max(price), 32) into v_max
        from public.coffees where status = 'approved' and maker = '龙潜猫隐';
    if p_price > v_max then
        return json_build_object('ok', false, 'error', 'too-expensive', 'max', v_max);
    end if;

    v_id := 'c-' || md5(random()::text || clock_timestamp()::text);
    insert into public.coffees(id, name, story, price, image, maker, status)
        values (v_id, p_coffee, p_story, p_price, coalesce(p_image, ''), p_name, 'pending');
    return json_build_object('ok', true, 'id', v_id, 'max', v_max);
end; $$;

create or replace function public.coffee_pending(p_admin text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.is_owner(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    return json_build_object('ok', true, 'items', (
        select coalesce(json_agg(json_build_object(
            'id', id, 'name', name, 'story', story, 'price', price,
            'image', image, 'maker', maker, 'created', created
        ) order by created), '[]'::json)
        from public.coffees where status = 'pending'
    ));
end; $$;

create or replace function public.coffee_review(
    p_admin text, p_hash text, p_id text, p_ok boolean, p_note text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.is_owner(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    update public.coffees
       set status = case when p_ok then 'approved' else 'rejected' end,
           review_note = coalesce(p_note, ''),
           approved_at = case when p_ok then now() else approved_at end
     where id = p_id and status = 'pending';
    return json_build_object('ok', true);
end; $$;

-- 11. 云端头衔 / 封禁
create or replace function public.admin_check(p_admin text, p_hash text)
returns boolean language sql security definer set search_path = public as $$
    select p_admin = '龙潜猫隐'
       and exists (select 1 from public.users where name = p_admin and hash = p_hash);
$$;

create or replace function public.titles_all()
returns json language sql security definer set search_path = public as $$
    select coalesce(json_agg(json_build_object(
        'user', ut.user_name, 'id', ct.id, 'name', ct.name, 'tone', ct.tone, 'icon', ct.icon
    )), '[]'::json)
    from public.user_titles ut join public.custom_titles ct on ct.id = ut.title_id;
$$;

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

create or replace function public.bans_all()
returns json language sql security definer set search_path = public as $$
    select coalesce(json_agg(name), '[]'::json) from public.banned_users;
$$;

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

-- 12. 权限
grant execute on function public.wallet_get(text, text) to anon;
grant execute on function public.wallet_checkin(text, text) to anon;
grant execute on function public.wallet_transfer(text, text, text, numeric) to anon;
grant execute on function public.wallet_spend(text, text, numeric, text) to anon;
grant execute on function public.coffee_list() to anon;
grant execute on function public.coffee_buy(text, text, text) to anon;
grant execute on function public.coffee_submit(text, text, text, text, numeric, text) to anon;
grant execute on function public.coffee_pending(text, text) to anon;
grant execute on function public.coffee_review(text, text, text, boolean, text) to anon;
grant execute on function public.titles_all() to anon;
grant execute on function public.admin_grant_title(text, text, text, text, text) to anon;
grant execute on function public.admin_revoke_title(text, text, text, text) to anon;
grant execute on function public.bans_all() to anon;
grant execute on function public.admin_ban_user(text, text, text, text) to anon;
grant execute on function public.admin_unban_user(text, text, text) to anon;
