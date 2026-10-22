-- ============================================================
-- 聊天室：房间 / 消息 / 在线 / 好友
-- 消息只留 10 分钟（每次读写都会顺手清理），不会长期占空间。
-- 用法：Supabase → SQL Editor → 粘贴 → Run
-- ============================================================

create table if not exists public.chat_messages (
    id      bigserial primary key,
    room    text not null,
    name    text not null,
    body    text,
    image   text,
    created timestamptz not null default now()
);
create index if not exists chat_messages_room_idx on public.chat_messages (room, id);
alter table public.chat_messages enable row level security;

create table if not exists public.chat_rooms (
    id       text primary key,
    kind     text not null default 'private',
    owner    text,
    password text,
    created  timestamptz not null default now()
);
alter table public.chat_rooms enable row level security;

create table if not exists public.chat_presence (
    name      text primary key,
    last_seen timestamptz not null default now()
);
alter table public.chat_presence enable row level security;

create table if not exists public.friends (
    a       text not null,
    b       text not null,
    created timestamptz not null default now(),
    primary key (a, b)
);
alter table public.friends enable row level security;

-- 工具：校验身份
create or replace function public.chat_auth(p_name text, p_hash text)
returns boolean language sql security definer set search_path = public as $$
    select exists (select 1 from public.users where name = p_name and hash = p_hash);
$$;

-- 清理过期消息（10 分钟）
create or replace function public.chat_purge()
returns void language sql security definer set search_path = public as $$
    delete from public.chat_messages where created < now() - interval '10 minutes';
$$;

-- 心跳 + 在线名单
create or replace function public.chat_ping(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    perform public.chat_purge();
    insert into public.chat_presence(name, last_seen) values (p_name, now())
        on conflict (name) do update set last_seen = now();
    delete from public.chat_presence where last_seen < now() - interval '1 day';
    return json_build_object('ok', true,
        'online', (select count(*) from public.chat_presence where last_seen > now() - interval '90 seconds'),
        'public_count', (select count(*) from public.chat_messages where room = 'public' and created > now() - interval '10 minutes'));
end; $$;

-- 发消息
create or replace function public.chat_send(
    p_name text, p_hash text, p_room text, p_body text, p_image text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if length(coalesce(p_image, '')) > 120000 then
        return json_build_object('ok', false, 'error', 'too-large');
    end if;
    perform public.chat_purge();
    insert into public.chat_messages(room, name, body, image)
        values (p_room, p_name, left(coalesce(p_body, ''), 600), nullif(p_image, ''));
    return json_build_object('ok', true);
end; $$;

-- 拉消息
create or replace function public.chat_fetch(p_room text, p_after bigint)
returns json language plpgsql security definer set search_path = public as $$
declare
    rows json;
begin
    perform public.chat_purge();
    select coalesce(json_agg(t order by t.id), '[]'::json) into rows from (
        select id, name, body, image, created
          from public.chat_messages
         where room = p_room and id > coalesce(p_after, 0)
         order by id
         limit 60
    ) t;
    return json_build_object('ok', true, 'messages', rows);
end; $$;

-- 建房间（6 位数字）
create or replace function public.chat_create_room(
    p_name text, p_hash text, p_room text, p_password text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if p_room !~ '^[0-9]{6}$' then
        return json_build_object('ok', false, 'error', 'bad-room');
    end if;
    if exists (select 1 from public.chat_rooms where id = p_room) then
        return json_build_object('ok', false, 'error', 'exists');
    end if;
    insert into public.chat_rooms(id, kind, owner, password)
        values (p_room, 'private', p_name, nullif(p_password, ''));
    return json_build_object('ok', true);
end; $$;

-- 进房间
create or replace function public.chat_join_room(
    p_name text, p_hash text, p_room text, p_password text
) returns json language plpgsql security definer set search_path = public as $$
declare
    r record;
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    select * into r from public.chat_rooms where id = p_room;
    if not found then
        return json_build_object('ok', false, 'error', 'no-room');
    end if;
    if coalesce(r.password, '') <> coalesce(p_password, '') then
        return json_build_object('ok', false, 'error', 'bad-password');
    end if;
    return json_build_object('ok', true);
end; $$;

-- 在线用户（含头像）
create or replace function public.chat_online(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    return json_build_object('ok', true, 'users', (
        select coalesce(json_agg(json_build_object('name', p.name, 'avatar', coalesce(pr.avatar, ''))), '[]'::json)
          from public.chat_presence p
          left join public.profiles pr on pr.name = p.name
         where p.last_seen > now() - interval '90 seconds'
    ));
end; $$;

-- 好友
create or replace function public.friend_add(p_name text, p_hash text, p_friend text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    if p_name = p_friend then return json_build_object('ok', false, 'error', 'self'); end if;
    insert into public.friends(a, b) values (p_name, p_friend) on conflict do nothing;
    return json_build_object('ok', true);
end; $$;

create or replace function public.friend_remove(p_name text, p_hash text, p_friend text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    delete from public.friends where a = p_name and b = p_friend;
    return json_build_object('ok', true);
end; $$;

create or replace function public.friend_list(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    return json_build_object('ok', true, 'friends', (
        select coalesce(json_agg(json_build_object('name', f.b, 'avatar', coalesce(pr.avatar, ''))), '[]'::json)
          from public.friends f left join public.profiles pr on pr.name = f.b
         where f.a = p_name
    ));
end; $$;

grant execute on function public.chat_ping(text, text) to anon;
grant execute on function public.chat_send(text, text, text, text, text) to anon;
grant execute on function public.chat_fetch(text, bigint) to anon;
grant execute on function public.chat_create_room(text, text, text, text) to anon;
grant execute on function public.chat_join_room(text, text, text, text) to anon;
grant execute on function public.chat_online(text, text) to anon;
grant execute on function public.friend_add(text, text, text) to anon;
grant execute on function public.friend_remove(text, text, text) to anon;
grant execute on function public.friend_list(text, text) to anon;