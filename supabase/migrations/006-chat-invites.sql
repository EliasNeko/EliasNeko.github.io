-- 聊天邀请：被邀请的人会收到弹窗（30 秒内有效，双方都有 30 秒冷却）
create table if not exists public.chat_invites (
    id        bigserial primary key,
    from_name text not null,
    to_name   text not null,
    room      text not null,
    status    text not null default 'pending',
    created   timestamptz not null default now()
);
alter table public.chat_invites enable row level security;

create or replace function public.invite_send(
    p_name text, p_hash text, p_to text, p_room text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if p_name = p_to then
        return json_build_object('ok', false, 'error', 'self');
    end if;
    if exists (select 1 from public.chat_invites where from_name = p_name and created > now() - interval '30 seconds') then
        return json_build_object('ok', false, 'error', 'cooldown');
    end if;
    delete from public.chat_invites where created < now() - interval '5 minutes';
    insert into public.chat_invites(from_name, to_name, room) values (p_name, p_to, p_room);
    return json_build_object('ok', true);
end; $$;

create or replace function public.invite_pending(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
    inv record;
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    delete from public.chat_invites where status = 'pending' and created < now() - interval '30 seconds';
    select * into inv from public.chat_invites
     where to_name = p_name and status = 'pending'
     order by id desc limit 1;
    if not found then
        return json_build_object('ok', true, 'invite', null);
    end if;
    return json_build_object('ok', true, 'invite', json_build_object('id', inv.id, 'from', inv.from_name, 'room', inv.room));
end; $$;

create or replace function public.invite_answer(p_name text, p_hash text, p_id bigint, p_accept boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
    inv record;
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    select * into inv from public.chat_invites where id = p_id and to_name = p_name;
    if not found then
        return json_build_object('ok', false, 'error', 'no-invite');
    end if;
    if inv.status <> 'pending' then
        return json_build_object('ok', false, 'error', 'answered');
    end if;
    update public.chat_invites set status = case when p_accept then 'accepted' else 'rejected' end where id = p_id;
    return json_build_object('ok', true, 'room', inv.room, 'from', inv.from_name);
end; $$;

grant execute on function public.invite_send(text, text, text, text) to anon;
grant execute on function public.invite_pending(text, text) to anon;
grant execute on function public.invite_answer(text, text, bigint, boolean) to anon;