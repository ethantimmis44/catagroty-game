-- Stage 8: authoritative auction turn RPC.
-- Locks the game row, validates against latest state, writes the bid/pass,
-- updates current_bid / current_bidder_id, and advances or awards the lot.
-- Enforces the opening-bid rule: a lot with no high bidder cannot be passed,
-- and an expired opening turn places the £1 opening bid instead of skipping.
-- Only auctions items in the game's game_items pool when the host chose one.
-- Additive. Safe to re-run. Does not drop tables, disable RLS, or remove constraints.
--
-- Run 20260825120000_stage10_game_items.sql BEFORE re-running this file: the
-- item queries below reference public.game_items.

create or replace function public.submit_auction_action(
  p_room_code text,
  p_player_id uuid,
  p_action text,
  p_amount integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.games%rowtype;
  v_action text;
  v_actor uuid;
  v_player public.game_players%rowtype;
  v_ids uuid[];
  v_n integer;
  v_list_size integer;
  v_collected integer;
  v_passed uuid[] := '{}';
  v_pid uuid;
  v_budget integer;
  v_count integer;
  v_highest uuid;
  v_current_bid integer;
  v_next uuid;
  v_active_count integer;
  v_active_only uuid;
  v_is_active boolean;
  v_can_afford boolean;
  v_full boolean;
  v_already_passed boolean;
  v_price integer;
  v_remaining integer;
  v_item uuid;
  v_start integer;
  v_idx integer;
  v_order uuid[];
  v_from integer;
  v_step integer;
  v_deadline timestamptz;
  v_started timestamptz;
  v_error text;
  v_code text;
begin
  v_action := lower(trim(coalesce(p_action, '')));
  if v_action not in ('bid', 'pass', 'expire') then
    return jsonb_build_object(
      'ok', false,
      'error', 'Unknown auction action.',
      'code', 'bad_action',
      'operation', 'submit_auction_action'
    );
  end if;

  select *
  into g
  from public.games
  where room_code = upper(trim(p_room_code))
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'Game not found.',
      'code', 'not_found',
      'operation', 'submit_auction_action'
    );
  end if;

  if g.status in ('finished', 'complete') or g.auction_status = 'complete' then
    return jsonb_build_object(
      'ok', false,
      'error', 'The auction has ended.',
      'code', 'ended',
      'game_id', g.id
    );
  end if;

  if g.status is distinct from 'active' or g.auction_status is distinct from 'live' or g.current_item_id is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'The auction is not live.',
      'code', 'not_live',
      'game_id', g.id,
      'current_item_id', g.current_item_id
    );
  end if;

  select coalesce(array_agg(id order by joined_at, id), '{}')
  into v_ids
  from public.game_players
  where game_id = g.id;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n = 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'This game has no players.',
      'code', 'no_players',
      'game_id', g.id
    );
  end if;

  v_list_size := coalesce(g.list_size, case
    when v_n <= 2 then 5
    when v_n <= 4 then 4
    else 3
  end);

  select coalesce(array_agg(distinct player_id), '{}')
  into v_passed
  from public.bids
  where game_id = g.id
    and item_id = g.current_item_id
    and auction_round = g.auction_round
    and is_pass = true;

  v_current_bid := coalesce(g.current_bid, 0);
  v_highest := g.current_bid_player_id;

  if v_action = 'expire' then
    if g.bid_deadline is null or clock_timestamp() < g.bid_deadline then
      return jsonb_build_object(
        'ok', true,
        'skipped', true,
        'code', 'deadline_not_reached',
        'operation', 'expire',
        'game_id', g.id,
        'current_bidder_id', g.current_bidder_id,
        'current_bid', v_current_bid,
        'bid_deadline', g.bid_deadline
      );
    end if;
    v_actor := g.current_bidder_id;
    if v_actor is null then
      return jsonb_build_object(
        'ok', true,
        'skipped', true,
        'code', 'no_current_bidder',
        'operation', 'expire',
        'game_id', g.id
      );
    end if;
  else
    v_actor := p_player_id;
  end if;

  if v_actor is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'Could not identify the player.',
      'code', 'no_player',
      'operation', v_action,
      'game_id', g.id
    );
  end if;

  select *
  into v_player
  from public.game_players
  where id = v_actor
    and game_id = g.id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'You are not in this game.',
      'code', 'not_in_game',
      'operation', v_action,
      'game_id', g.id,
      'submitted_player_id', v_actor
    );
  end if;

  if v_action <> 'expire' and g.current_bidder_id is distinct from v_actor then
    v_error := format(
      'Bid rejected: it is not your turn. Current bidder is %s, submitted bidder is %s.',
      coalesce(g.current_bidder_id::text, 'none'),
      v_actor::text
    );
    if v_action = 'pass' then
      v_error := format(
        'Pass rejected: it is not your turn. Current bidder is %s, submitted bidder is %s.',
        coalesce(g.current_bidder_id::text, 'none'),
        v_actor::text
      );
    end if;
    return jsonb_build_object(
      'ok', false,
      'error', v_error,
      'code', 'not_your_turn',
      'operation', v_action,
      'game_id', g.id,
      'current_item_id', g.current_item_id,
      'current_bidder_id', g.current_bidder_id,
      'submitted_player_id', v_actor,
      'current_bid', v_current_bid,
      'submitted_amount', p_amount,
      'remaining_budget', v_player.budget_remaining,
      'bid_deadline', g.bid_deadline
    );
  end if;

  if v_action <> 'expire' and g.bid_deadline is not null and clock_timestamp() >= g.bid_deadline then
    return jsonb_build_object(
      'ok', false,
      'error', 'Bid rejected: the turn deadline has expired.',
      'code', 'deadline',
      'operation', v_action,
      'game_id', g.id,
      'current_bidder_id', g.current_bidder_id,
      'submitted_player_id', v_actor,
      'bid_deadline', g.bid_deadline
    );
  end if;

  select count(*)
  into v_collected
  from public.collections
  where game_id = g.id
    and player_id = v_actor;

  if v_collected >= v_list_size then
    return jsonb_build_object(
      'ok', false,
      'error', 'Bid rejected: your list is already full.',
      'code', 'full_list',
      'operation', v_action,
      'game_id', g.id,
      'submitted_player_id', v_actor
    );
  end if;

  if v_actor = any (v_passed) then
    if v_action = 'expire' then
      -- Already passed; still try to advance in case the lot was stuck.
    else
      return jsonb_build_object(
        'ok', false,
        'error', 'You have already passed this item.',
        'code', 'already_passed',
        'operation', v_action,
        'game_id', g.id,
        'submitted_player_id', v_actor
      );
    end if;
  end if;

  -- Opening bid rule: a lot has no high bidder until somebody bids, and the
  -- player who opens it must bid. Passing the opening bid is not allowed.
  if v_action = 'pass' and v_highest is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'The opening bid cannot be passed. Bid at least £1 to start this item.',
      'code', 'opening_bid_required',
      'operation', v_action,
      'game_id', g.id,
      'current_item_id', g.current_item_id,
      'current_bidder_id', g.current_bidder_id,
      'submitted_player_id', v_actor,
      'current_bid', v_current_bid,
      'remaining_budget', v_player.budget_remaining
    );
  end if;

  if v_action = 'bid' then
    if p_amount is null or p_amount <> trunc(p_amount) then
      return jsonb_build_object(
        'ok', false,
        'error', 'Bid must be a whole number.',
        'code', 'bad_amount',
        'operation', 'bid',
        'submitted_amount', p_amount
      );
    end if;
    if p_amount <= v_current_bid then
      return jsonb_build_object(
        'ok', false,
        'error', format('Bid rejected: current bid is £%s.', v_current_bid),
        'code', 'too_low',
        'operation', 'bid',
        'game_id', g.id,
        'current_bidder_id', g.current_bidder_id,
        'submitted_player_id', v_actor,
        'current_bid', v_current_bid,
        'submitted_amount', p_amount,
        'remaining_budget', v_player.budget_remaining
      );
    end if;
    if p_amount < 1 or p_amount > 100 then
      return jsonb_build_object(
        'ok', false,
        'error', 'Bid rejected: bids must be whole pounds from £1 to £100.',
        'code', 'amount_range',
        'operation', 'bid',
        'submitted_amount', p_amount
      );
    end if;
    if p_amount > v_player.budget_remaining then
      return jsonb_build_object(
        'ok', false,
        'error', format('Bid rejected: you only have £%s remaining.', v_player.budget_remaining),
        'code', 'budget',
        'operation', 'bid',
        'game_id', g.id,
        'submitted_player_id', v_actor,
        'submitted_amount', p_amount,
        'remaining_budget', v_player.budget_remaining
      );
    end if;

    insert into public.bids (
      game_id, player_id, item_id, amount, auction_round, is_pass
    ) values (
      g.id, v_actor, g.current_item_id, p_amount, g.auction_round, false
    );

    v_current_bid := p_amount;
    v_highest := v_actor;

    update public.games
    set
      current_bid = v_current_bid,
      current_bid_player_id = v_highest
    where id = g.id;
  elsif v_action = 'expire'
    and v_highest is null
    and v_actor <> all (v_passed)
    and coalesce(v_player.budget_remaining, 0) >= 1
  then
    -- The opening bidder may not pass, so a timeout places the £1 opening bid
    -- for them rather than skipping the lot.
    insert into public.bids (
      game_id, player_id, item_id, amount, auction_round, is_pass
    ) values (
      g.id, v_actor, g.current_item_id, 1, g.auction_round, false
    );

    v_current_bid := 1;
    v_highest := v_actor;

    update public.games
    set
      current_bid = v_current_bid,
      current_bid_player_id = v_highest
    where id = g.id;
  elsif v_action in ('pass', 'expire') and v_actor <> all (v_passed) then
    insert into public.bids (
      game_id, player_id, item_id, amount, auction_round, is_pass
    ) values (
      g.id, v_actor, g.current_item_id, 0, g.auction_round, true
    );
    v_passed := array_append(v_passed, v_actor);
  end if;

  -- Auto-pass anyone who cannot afford the next bid and is not the high bidder.
  for v_idx in 1..v_n loop
    v_pid := v_ids[v_idx];
    if v_pid = any (v_passed) then
      continue;
    end if;
    select count(*) into v_collected
    from public.collections
    where game_id = g.id and player_id = v_pid;
    if v_collected >= v_list_size then
      continue;
    end if;
    if v_pid is not distinct from v_highest then
      continue;
    end if;
    select budget_remaining into v_budget
    from public.game_players
    where id = v_pid;
    if coalesce(v_budget, 0) >= greatest(1, v_current_bid + 1) then
      continue;
    end if;
    insert into public.bids (
      game_id, player_id, item_id, amount, auction_round, is_pass
    ) values (
      g.id, v_pid, g.current_item_id, 0, g.auction_round, true
    );
    v_passed := array_append(v_passed, v_pid);
  end loop;

  -- Count active bidders and find the next clockwise eligible player.
  v_start := ((coalesce(g.starting_bidder_index, 0) % v_n) + v_n) % v_n;
  v_order := '{}';
  for v_idx in 1..v_n loop
    v_order := array_append(v_order, v_ids[1 + ((v_start + v_idx - 1) % v_n)]);
  end loop;

  v_active_count := 0;
  v_active_only := null;
  v_from := 0;
  for v_idx in 1..v_n loop
    if v_order[v_idx] = g.current_bidder_id then
      v_from := v_idx;
    end if;
  end loop;

  v_next := null;
  for v_step in 1..v_n loop
    if g.current_bidder_id is null then
      v_pid := v_order[v_step];
    else
      v_pid := v_order[1 + ((v_from - 1 + v_step) % v_n)];
    end if;

    select count(*) into v_collected
    from public.collections
    where game_id = g.id and player_id = v_pid;
    v_full := v_collected >= v_list_size;
    v_already_passed := v_pid = any (v_passed);
    select budget_remaining into v_budget
    from public.game_players
    where id = v_pid;
    v_can_afford := coalesce(v_budget, 0) >= greatest(1, v_current_bid + 1);
    v_is_active := (not v_full)
      and (not v_already_passed)
      and (v_pid is not distinct from v_highest or v_can_afford);

    if v_is_active then
      v_active_count := v_active_count + 1;
      v_active_only := v_pid;
      if v_next is null then
        if g.current_bidder_id is null or v_pid is distinct from g.current_bidder_id or v_action in ('pass', 'expire') then
          v_next := v_pid;
        end if;
      end if;
    end if;
  end loop;

  -- If we started from a current bidder, the first active found walking forward
  -- is the next player. If that walk skipped the current player because they
  -- remain active after a bid, v_next is already the following active player.
  -- After a bid, current remains active; the loop above sets v_next to the first
  -- active that is not the current bidder, or the current bidder if they are the
  -- only one (handled by sell below).

  if v_action = 'bid' then
    v_next := null;
    for v_step in 1..v_n loop
      v_pid := v_order[1 + ((v_from - 1 + v_step) % v_n)];
      select count(*) into v_collected
      from public.collections
      where game_id = g.id and player_id = v_pid;
      v_full := v_collected >= v_list_size;
      v_already_passed := v_pid = any (v_passed);
      select budget_remaining into v_budget
      from public.game_players
      where id = v_pid;
      v_can_afford := coalesce(v_budget, 0) >= greatest(1, v_current_bid + 1);
      v_is_active := (not v_full)
        and (not v_already_passed)
        and (v_pid is not distinct from v_highest or v_can_afford);
      if v_is_active then
        v_next := v_pid;
        exit;
      end if;
    end loop;
  end if;

  -- Sell when exactly one active bidder remains and they hold the high bid.
  if v_active_count = 1 and v_highest is not null and v_active_only = v_highest then
    v_price := v_current_bid;
    if v_price is null or v_price < 1 then
      return jsonb_build_object(
        'ok', false,
        'error', 'The winning bid was missing, so the item could not be collected.',
        'code', 'missing_price',
        'operation', v_action,
        'game_id', g.id
      );
    end if;

    select budget_remaining into v_budget
    from public.game_players
    where id = v_highest
    for update;

    if v_price > v_budget then
      return jsonb_build_object(
        'ok', false,
        'error', 'The winning bid is higher than the player''s remaining budget.',
        'code', 'winner_budget',
        'operation', v_action,
        'game_id', g.id,
        'submitted_player_id', v_highest,
        'current_bid', v_price,
        'remaining_budget', v_budget
      );
    end if;

    insert into public.collections (
      game_id, player_id, item_id, price, price_paid, auction_round
    )
    values (
      g.id, v_highest, g.current_item_id, v_price, v_price, g.auction_round
    )
    on conflict (game_id, item_id) do nothing;

    if found then
      v_remaining := v_budget - v_price;
      update public.game_players
      set budget_remaining = v_remaining
      where id = v_highest
        and budget_remaining >= v_price;
    end if;

    -- Rotate starting bidder, skipping completed lists.
    v_idx := coalesce(g.starting_bidder_index, 0);
    for v_step in 1..v_n loop
      v_idx := (v_idx + 1) % v_n;
      select count(*) into v_collected
      from public.collections
      where game_id = g.id and player_id = v_ids[v_idx + 1];
      if v_collected < v_list_size then
        exit;
      end if;
    end loop;

    -- Complete the game if every list is full.
    v_count := 0;
    for v_step in 1..v_n loop
      select count(*) into v_collected
      from public.collections
      where game_id = g.id and player_id = v_ids[v_step];
      if v_collected >= v_list_size then
        v_count := v_count + 1;
      end if;
    end loop;

    if v_count = v_n then
      update public.games
      set
        status = 'finished',
        auction_status = 'complete',
        current_item_id = null,
        current_bidder_id = null,
        current_bid_player_id = null,
        current_bid = 0,
        bid_deadline = null,
        bid_turn_started_at = null,
        starting_bidder_index = v_idx,
        completed_at = clock_timestamp()
      where id = g.id;

      return jsonb_build_object(
        'ok', true,
        'operation', v_action,
        'code', 'game_complete',
        'game_id', g.id,
        'submitted_player_id', v_actor,
        'current_bid', v_price,
        'next_bidder_id', null
      );
    end if;

    select i.id
    into v_item
    from public.items i
    where coalesce(i.is_active, true) = true
      and (
        i.category_id = g.category_id
        or exists (
          select 1
          from public.item_categories ic
          where ic.item_id = i.id
            and ic.category_id = g.category_id
        )
      )
      -- Restrict to the host's chosen pool. Games created before pools existed
      -- have no game_items rows and still use the whole category.
      and (
        not exists (
          select 1 from public.game_items gi where gi.game_id = g.id
        )
        or exists (
          select 1 from public.game_items gi
          where gi.game_id = g.id and gi.item_id = i.id
        )
      )
      and i.id is distinct from g.current_item_id
      and not exists (
        select 1 from public.collections c
        where c.game_id = g.id and c.item_id = i.id
      )
      and not exists (
        select 1 from public.bids b
        where b.game_id = g.id and b.item_id = i.id
      )
    order by random()
    limit 1;

    if v_item is null then
      return jsonb_build_object(
        'ok', false,
        'error', 'There are not enough unused items left in this game''s pool to continue the auction.',
        'code', 'no_items',
        'operation', v_action,
        'game_id', g.id
      );
    end if;

    v_order := '{}';
    v_start := ((v_idx % v_n) + v_n) % v_n;
    for v_step in 1..v_n loop
      v_order := array_append(v_order, v_ids[1 + ((v_start + v_step - 1) % v_n)]);
    end loop;

    v_next := null;
    for v_step in 1..v_n loop
      v_pid := v_order[v_step];
      select count(*) into v_collected
      from public.collections
      where game_id = g.id and player_id = v_pid;
      if v_collected < v_list_size then
        v_next := v_pid;
        exit;
      end if;
    end loop;

    if v_next is null then
      update public.games
      set
        status = 'finished',
        auction_status = 'complete',
        current_item_id = null,
        current_bidder_id = null,
        current_bid_player_id = null,
        current_bid = 0,
        bid_deadline = null,
        bid_turn_started_at = null,
        starting_bidder_index = v_idx,
        completed_at = clock_timestamp()
      where id = g.id;

      return jsonb_build_object(
        'ok', true,
        'operation', v_action,
        'code', 'game_complete',
        'game_id', g.id
      );
    end if;

    v_started := clock_timestamp();
    v_deadline := v_started + interval '15 seconds';

    update public.games
    set
      status = 'active',
      auction_status = 'live',
      current_item_id = v_item,
      current_bidder_id = v_next,
      current_bid_player_id = null,
      current_bid = 0,
      starting_bidder_index = v_idx,
      auction_round = coalesce(g.auction_round, 0) + 1,
      list_size = v_list_size,
      bid_turn_started_at = v_started,
      bid_deadline = v_deadline
    where id = g.id;

    return jsonb_build_object(
      'ok', true,
      'operation', v_action,
      'code', 'lot_sold',
      'game_id', g.id,
      'current_item_id', v_item,
      'current_bidder_id', v_next,
      'submitted_player_id', v_actor,
      'current_bid', 0,
      'next_bidder_id', v_next,
      'highest_bidder_id', null,
      'bid_deadline', v_deadline
    );
  end if;

  -- Skip the lot when nobody remains active.
  if v_active_count = 0 or v_next is null then
    v_idx := coalesce(g.starting_bidder_index, 0);
    for v_step in 1..v_n loop
      v_idx := (v_idx + 1) % v_n;
      select count(*) into v_collected
      from public.collections
      where game_id = g.id and player_id = v_ids[v_idx + 1];
      if v_collected < v_list_size then
        exit;
      end if;
    end loop;

    select i.id
    into v_item
    from public.items i
    where coalesce(i.is_active, true) = true
      and (
        i.category_id = g.category_id
        or exists (
          select 1
          from public.item_categories ic
          where ic.item_id = i.id
            and ic.category_id = g.category_id
        )
      )
      -- Restrict to the host's chosen pool. Games created before pools existed
      -- have no game_items rows and still use the whole category.
      and (
        not exists (
          select 1 from public.game_items gi where gi.game_id = g.id
        )
        or exists (
          select 1 from public.game_items gi
          where gi.game_id = g.id and gi.item_id = i.id
        )
      )
      and i.id is distinct from g.current_item_id
      and not exists (
        select 1 from public.collections c
        where c.game_id = g.id and c.item_id = i.id
      )
      and not exists (
        select 1 from public.bids b
        where b.game_id = g.id and b.item_id = i.id
      )
    order by random()
    limit 1;

    if v_item is null then
      update public.games
      set
        status = 'finished',
        auction_status = 'complete',
        current_item_id = null,
        current_bidder_id = null,
        bid_deadline = null,
        completed_at = clock_timestamp()
      where id = g.id;

      return jsonb_build_object(
        'ok', true,
        'operation', v_action,
        'code', 'game_complete',
        'game_id', g.id
      );
    end if;

    v_order := '{}';
    v_start := ((v_idx % v_n) + v_n) % v_n;
    for v_step in 1..v_n loop
      v_order := array_append(v_order, v_ids[1 + ((v_start + v_step - 1) % v_n)]);
    end loop;
    v_next := null;
    for v_step in 1..v_n loop
      v_pid := v_order[v_step];
      select count(*) into v_collected
      from public.collections
      where game_id = g.id and player_id = v_pid;
      if v_collected < v_list_size then
        v_next := v_pid;
        exit;
      end if;
    end loop;

    v_started := clock_timestamp();
    v_deadline := v_started + interval '15 seconds';

    update public.games
    set
      current_item_id = v_item,
      current_bidder_id = v_next,
      current_bid_player_id = null,
      current_bid = 0,
      starting_bidder_index = v_idx,
      auction_round = coalesce(g.auction_round, 0) + 1,
      bid_turn_started_at = v_started,
      bid_deadline = v_deadline
    where id = g.id;

    return jsonb_build_object(
      'ok', true,
      'operation', v_action,
      'code', 'lot_skipped',
      'game_id', g.id,
      'current_item_id', v_item,
      'current_bidder_id', v_next,
      'submitted_player_id', v_actor,
      'current_bid', 0,
      'next_bidder_id', v_next,
      'bid_deadline', v_deadline
    );
  end if;

  v_started := clock_timestamp();
  v_deadline := v_started + interval '15 seconds';

  update public.games
  set
    current_bidder_id = v_next,
    current_bid = v_current_bid,
    current_bid_player_id = v_highest,
    bid_turn_started_at = v_started,
    bid_deadline = v_deadline
  where id = g.id;

  return jsonb_build_object(
    'ok', true,
    'operation', v_action,
    'code', 'turn_advanced',
    'game_id', g.id,
    'current_item_id', g.current_item_id,
    'current_bidder_id', v_next,
    'submitted_player_id', v_actor,
    'current_bid', v_current_bid,
    'submitted_amount', p_amount,
    'remaining_budget', v_player.budget_remaining,
    'bid_deadline', v_deadline,
    'next_bidder_id', v_next,
    'highest_bidder_id', v_highest
  );
exception
  when others then
    v_code := sqlstate;
    v_error := sqlerrm;
    if v_error ~* 'price_paid|price_paid' then
      v_error := 'Could not save the winning bid. Run supabase/migrations/20260824200000_stage6_collection_price_paid.sql in the Supabase SQL editor, then try again. Original: ' || v_error;
    elsif v_error ~* 'bids_amount_check' then
      v_error := 'That bid is not allowed. Real bids must be whole pounds from £1 to £100. Passes are recorded separately. Original: ' || v_error;
    elsif v_error ~* 'collections_game_id_item_id' then
      v_error := 'This item has already been won in this game. Original: ' || v_error;
    end if;
    return jsonb_build_object(
      'ok', false,
      'error', format('Supabase error: %s', v_error),
      'code', v_code,
      'operation', coalesce(v_action, 'submit_auction_action'),
      'game_id', g.id,
      'current_item_id', g.current_item_id,
      'current_bidder_id', g.current_bidder_id,
      'submitted_player_id', p_player_id,
      'current_bid', g.current_bid,
      'submitted_amount', p_amount
    );
end;
$$;

create or replace function public.submit_bid(
  p_room_code text,
  p_player_id uuid,
  p_amount integer
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.submit_auction_action(p_room_code, p_player_id, 'bid', p_amount);
$$;

create or replace function public.submit_pass(
  p_room_code text,
  p_player_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.submit_auction_action(p_room_code, p_player_id, 'pass', null);
$$;

create or replace function public.expire_auction_turn(p_room_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.submit_auction_action(p_room_code, null, 'expire', null);
$$;

revoke all on function public.submit_auction_action(text, uuid, text, integer) from public;
revoke all on function public.submit_bid(text, uuid, integer) from public;
revoke all on function public.submit_pass(text, uuid) from public;
revoke all on function public.expire_auction_turn(text) from public;

grant execute on function public.submit_auction_action(text, uuid, text, integer) to anon, authenticated, service_role;
grant execute on function public.submit_bid(text, uuid, integer) to anon, authenticated, service_role;
grant execute on function public.submit_pass(text, uuid) to anon, authenticated, service_role;
grant execute on function public.expire_auction_turn(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
