-- ============================================================
-- 个人资料：读取 / 修改（都要带自己的密码哈希才允许）
-- 用法：Supabase → SQL Editor → 粘贴 → Run
-- ============================================================

create or replace function public.get_profile(p_name text, p_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
    u record;
begin
    if not exists (select 1 from public.users where name = p_name and hash = p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;

    select p.name, p.contact, p.email, p.avatar, p.time
      into u
      from public.profiles p
     where p.name = p_name;

    return json_build_object(
        'ok', true,
        'name', p_name,
        'contact', coalesce(u.contact, ''),
        'email', coalesce(u.email, ''),
        'avatar', coalesce(u.avatar, ''),
        'time', coalesce(u.time, '')
    );
end; $$;

create or replace function public.update_profile(
    p_name text, p_hash text, p_contact text, p_email text, p_avatar text
) returns json language plpgsql security definer set search_path = public as $$
begin
    if not exists (select 1 from public.users where name = p_name and hash = p_hash) then
        return json_build_object('ok', false, 'error', 'auth');
    end if;
    if length(coalesce(p_avatar, '')) > 200000 then
        return json_build_object('ok', false, 'error', 'too-large');
    end if;

    update public.profiles
       set contact = coalesce(p_contact, contact),
           email   = coalesce(p_email, email),
           avatar  = case when coalesce(p_avatar, '') = '' then avatar else p_avatar end
     where name = p_name;

    return json_build_object('ok', true);
end; $$;

grant execute on function public.get_profile(text, text) to anon;
grant execute on function public.update_profile(text, text, text, text, text) to anon;