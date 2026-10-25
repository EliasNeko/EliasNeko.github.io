-- 在线统计升级：心跳同时返回「正式用户数」，用来算游客
create or replace function public.heartbeat(p_device text)
returns json language plpgsql security definer set search_path = public as $$
begin
    insert into public.online(device, last_seen) values (p_device, now())
        on conflict (device) do update set last_seen = now();

    delete from public.online where last_seen < now() - interval '1 day';

    return json_build_object(
        'online',  (select count(*) from public.online where last_seen > now() - interval '90 seconds'),
        'members', (select count(*) from public.chat_presence where last_seen > now() - interval '90 seconds'),
        'users',   (select count(*) from public.users)
    );
end; $$;

grant execute on function public.heartbeat(text) to anon;