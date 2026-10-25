-- ============================================================
-- 「我的咖啡」：制作者查看已上架 / 待审核 / 收益
-- 用法：Supabase → SQL Editor → 粘贴全部 → Run
-- ============================================================

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
                'id', id, 'name', name, 'story', story, 'price', price,
                'image', image, 'maker', maker, 'created', created,
                'review_note', review_note
            ) order by created desc), '[]'::json)
            from public.coffees where maker = p_name and status = 'approved'
        ),
        'pending', (
            select coalesce(json_agg(json_build_object(
                'id', id, 'name', name, 'story', story, 'price', price,
                'image', image, 'maker', maker, 'created', created,
                'review_note', review_note
            ) order by created desc), '[]'::json)
            from public.coffees where maker = p_name and status = 'pending'
        ),
        'rejected', (
            select coalesce(json_agg(json_build_object(
                'id', id, 'name', name, 'story', story, 'price', price,
                'image', image, 'maker', maker, 'created', created,
                'review_note', review_note
            ) order by created desc), '[]'::json)
            from public.coffees where maker = p_name and status = 'rejected'
        )
    );
end; $$;

grant execute on function public.coffee_mine(text, text) to anon;
