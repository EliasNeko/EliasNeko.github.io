-- 邀请回执：对方接受后，发起方也能自动进房
create or replace function public.invite_take(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
    inv record;
begin
    if not public.chat_auth(p_name, p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;

    select * into inv from public.chat_invites
     where from_name = p_name and status = 'accepted'
       and created > now() - interval '5 minutes'
     order by id desc limit 1;

    if not found then
        return json_build_object('ok', true, 'room', null);
    end if;

    update public.chat_invites set status = 'opened' where id = inv.id;
    return json_build_object('ok', true, 'room', inv.room, 'to', inv.to_name);
end; $$;

grant execute on function public.invite_take(text, text) to anon;