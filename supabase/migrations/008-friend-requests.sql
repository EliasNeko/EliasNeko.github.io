-- 好友申请：发送 → 对方同意/拒绝 → 发送方收到结果
create table if not exists public.friend_requests (
    id        bigserial primary key,
    from_name text not null,
    to_name   text not null,
    status    text not null default 'pending',
    created   timestamptz not null default now()
);
alter table public.friend_requests enable row level security;

create or replace function public.friend_request_send(p_name text, p_hash text, p_to text)
returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    if p_name = p_to then return json_build_object('ok', false, 'error', 'self'); end if;
    if exists (select 1 from public.friends where a = p_name and b = p_to) then
        return json_build_object('ok', false, 'error', 'already');
    end if;
    if exists (select 1 from public.friend_requests where from_name = p_name and status = 'pending' and created > now() - interval '30 seconds') then
        return json_build_object('ok', false, 'error', 'cooldown');
    end if;
    if exists (select 1 from public.friend_requests where from_name = p_name and to_name = p_to and status = 'pending') then
        return json_build_object('ok', false, 'error', 'waiting');
    end if;
    delete from public.friend_requests where created < now() - interval '5 minutes';
    insert into public.friend_requests(from_name, to_name) values (p_name, p_to);
    return json_build_object('ok', true);
end; $$;

create or replace function public.friend_request_pending(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare r record;
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    select * into r from public.friend_requests
     where to_name = p_name and status = 'pending'
     order by id desc limit 1;
    if not found then return json_build_object('ok', true, 'request', null); end if;
    return json_build_object('ok', true, 'request', json_build_object('id', r.id, 'from', r.from_name));
end; $$;

create or replace function public.friend_request_answer(p_name text, p_hash text, p_id bigint, p_accept boolean)
returns json language plpgsql security definer set search_path = public as $$
declare r record;
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    select * into r from public.friend_requests where id = p_id and to_name = p_name;
    if not found then return json_build_object('ok', false, 'error', 'no-request'); end if;
    if r.status <> 'pending' then return json_build_object('ok', false, 'error', 'answered'); end if;
    update public.friend_requests set status = case when p_accept then 'accepted' else 'rejected' end where id = p_id;
    if p_accept then
        insert into public.friends(a, b) values (r.from_name, r.to_name) on conflict do nothing;
        insert into public.friends(a, b) values (r.to_name, r.from_name) on conflict do nothing;
    end if;
    return json_build_object('ok', true);
end; $$;

create or replace function public.friend_request_result(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare r record;
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    select * into r from public.friend_requests
     where from_name = p_name and status in ('accepted', 'rejected') and created > now() - interval '5 minutes'
     order by id desc limit 1;
    if not found then return json_build_object('ok', true, 'result', null); end if;
    update public.friend_requests set status = 'seen' where id = r.id;
    return json_build_object('ok', true, 'result', json_build_object('to', r.to_name, 'accepted', r.status = 'accepted'));
end; $$;

-- 邀请回执：把「拒绝」也带回来，让发起方在聊天室里看到
create or replace function public.invite_take(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare inv record;
begin
    if not public.chat_auth(p_name, p_hash) then return json_build_object('ok', false, 'error', 'auth'); end if;
    select * into inv from public.chat_invites
     where from_name = p_name and status in ('accepted', 'rejected')
       and created > now() - interval '5 minutes'
     order by id desc limit 1;
    if not found then return json_build_object('ok', true, 'room', null, 'status', null); end if;
    update public.chat_invites set status = 'opened' where id = inv.id;
    return json_build_object('ok', true, 'room', inv.room, 'status', inv.status, 'invitee', inv.to_name);
end; $$;

grant execute on function public.friend_request_send(text, text, text) to anon;
grant execute on function public.friend_request_pending(text, text) to anon;
grant execute on function public.friend_request_answer(text, text, bigint, boolean) to anon;
grant execute on function public.friend_request_result(text, text) to anon;