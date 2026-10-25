-- ============================================================
-- 站长管理：注销账号 / 下架咖啡 / 咖啡简介 / 自定义头衔图标
-- 用法：Supabase → SQL Editor → 粘贴全部 → Run
-- 可重复运行。
-- ============================================================

-- 1. 咖啡简介
alter table public.coffees add column if not exists intro text default '';

update public.coffees
   set intro = left(coalesce(story, ''), 30)
 where coalesce(intro, '') = '' and coalesce(story, '') <> '';

update public.coffees set intro = '柑橘与花香，入口干净' where id = 'yejia' and coalesce(intro,'') = '';
update public.coffees set intro = '冰爽甘甜，无穷回味' where id = 'bingboke' and coalesce(intro,'') = '';
update public.coffees set intro = '健康温暖，温馨口腔' where id = 'dirty' and coalesce(intro,'') = '';
update public.coffees set intro = '椰香先到，苦后回甘' where id = 'shengye' and coalesce(intro,'') = '';

-- 2. 咖啡列表（带简介）
create or replace function public.coffee_list()
returns json language sql security definer set search_path = public as $$
    select coalesce(json_agg(json_build_object(
        'id', id, 'name', name, 'intro', coalesce(intro, ''), 'story', story,
        'price', price, 'image', image, 'maker', maker, 'created', created
    ) order by created), '[]'::json)
    from public.coffees where status = 'approved';
$$;

-- 3. 咖啡投稿（新增简介，7 个参数）
create or replace function public.coffee_submit(
    p_name text, p_hash text, p_coffee text, p_intro text, p_story text, p_price numeric, p_image text
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
    if length(coalesce(p_intro, '')) < 2 or length(p_intro) > 60 then
        return json_build_object('ok', false, 'error', 'bad-intro');
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
    insert into public.coffees(id, name, intro, story, price, image, maker, status)
        values (v_id, p_coffee, p_intro, p_story, p_price, coalesce(p_image, ''), p_name, 'pending');
    return json_build_object('ok', true, 'id', v_id, 'max', v_max);
end; $$;

grant execute on function public.coffee_submit(text, text, text, text, text, numeric, text) to anon;

-- 4. 我的咖啡（带简介）
create or replace function public.coffee_mine(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
    v_earn numeric(12,2);
    v_cups bigint;
begin
    if not public.kv_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;

    select coalesce(sum(amount), 0), count(*)
      into v_earn, v_cups
      from public.coffee_orders
     where maker = p_name;

    return json_build_object(
        'ok', true,
        'earnings', v_earn,
        'cups', v_cups,
        'approved', (
            select coalesce(json_agg(json_build_object(
                'id', id, 'name', name, 'intro', coalesce(intro, ''), 'story', story,
                'price', price, 'image', image, 'maker', maker, 'created', created,
                'review_note', review_note
            ) order by created desc), '[]'::json)
            from public.coffees where maker = p_name and status = 'approved'
        ),
        'pending', (
            select coalesce(json_agg(json_build_object(
                'id', id, 'name', name, 'intro', coalesce(intro, ''), 'story', story,
                'price', price, 'image', image, 'maker', maker, 'created', created,
                'review_note', review_note
            ) order by created desc), '[]'::json)
            from public.coffees where maker = p_name and status = 'pending'
        ),
        'rejected', (
            select coalesce(json_agg(json_build_object(
                'id', id, 'name', name, 'intro', coalesce(intro, ''), 'story', story,
                'price', price, 'image', image, 'maker', maker, 'created', created,
                'review_note', review_note
            ) order by created desc), '[]'::json)
            from public.coffees where maker = p_name and status = 'rejected'
        )
    );
end; $$;

grant execute on function public.coffee_mine(text, text) to anon;

-- 5. 待审核列表（带简介）
create or replace function public.coffee_pending(p_admin text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.is_owner(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    return json_build_object('ok', true, 'items', (
        select coalesce(json_agg(json_build_object(
            'id', id, 'name', name, 'intro', coalesce(intro, ''), 'story', story,
            'price', price, 'image', image, 'maker', maker, 'created', created
        ) order by created), '[]'::json)
        from public.coffees where status = 'pending'
    ));
end; $$;

-- 6. 授权头衔（带图标；6 个参数）
create or replace function public.admin_grant_title(
    p_admin text, p_hash text, p_user text, p_title text, p_tone text, p_icon text
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
        values (v_id, p_title, coalesce(nullif(p_tone, ''), 'purple'), coalesce(nullif(p_icon, ''), '✦'));
    insert into public.user_titles(user_name, title_id, granted_by)
        values (p_user, v_id, p_admin);
    return json_build_object('ok', true, 'id', v_id);
end; $$;

grant execute on function public.admin_grant_title(text, text, text, text, text, text) to anon;

-- 7. 下架单杯咖啡
create or replace function public.admin_unpublish_coffee(
    p_admin text, p_hash text, p_id text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    update public.coffees
       set status = 'rejected', review_note = '站长下架'
     where id = p_id and status = 'approved';
    return json_build_object('ok', true);
end; $$;

-- 8. 一键下架所有已上架咖啡
create or replace function public.admin_unpublish_all_coffees(
    p_admin text, p_hash text
) returns json language plpgsql security definer set search_path = public as $$
declare
    v_count integer;
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    update public.coffees
       set status = 'rejected', review_note = '站长一键下架'
     where status = 'approved';
    get diagnostics v_count = row_count;
    return json_build_object('ok', true, 'count', v_count);
end; $$;

grant execute on function public.admin_unpublish_coffee(text, text, text) to anon;
grant execute on function public.admin_unpublish_all_coffees(text, text) to anon;

-- 9. 注销账号（删用户 + 关联数据）
create or replace function public.admin_delete_user(
    p_admin text, p_hash text, p_user text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.admin_check(p_admin, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if p_user = '龙潜猫隐' then
        return json_build_object('ok', false, 'error', 'self');
    end if;
    if not exists (select 1 from public.users where name = p_user) then
        return json_build_object('ok', false, 'error', 'no-user');
    end if;

    delete from public.custom_titles
     where id in (select title_id from public.user_titles where user_name = p_user);
    delete from public.user_titles where user_name = p_user;
    delete from public.wallet_logs where name = p_user;
    delete from public.checkins where name = p_user;
    delete from public.banned_users where name = p_user;
    delete from public.friends where a = p_user or b = p_user;
    delete from public.chat_messages where name = p_user;
    delete from public.chat_presence where name = p_user;
    delete from public.chat_rooms where owner = p_user;
    delete from public.transfers where from_name = p_user or to_name = p_user;
    delete from public.coffee_orders where buyer = p_user or maker = p_user;
    delete from public.coffees where maker = p_user;
    delete from public.wallets where name = p_user;
    delete from public.profiles where name = p_user;
    delete from public.users where name = p_user;

    return json_build_object('ok', true);
end; $$;

grant execute on function public.admin_delete_user(text, text, text) to anon;
