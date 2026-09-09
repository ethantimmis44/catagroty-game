-- Stage 10: per-game item pool.
-- The host chooses which catalogue items may appear in their game. The catalogue
-- in public.items stays shared and is never duplicated; this table only records
-- which existing items were selected for one game.
-- Safe to re-run. Does not disable RLS and does not drop any existing table.

-- No "used" column on purpose: whether an item has been auctioned is already
-- derived from public.bids and public.collections, and a second copy of that
-- state could drift out of sync with the authoritative auction tables.
create table if not exists public.game_items (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One row per item per game: the same item can never be auctioned twice.
create unique index if not exists game_items_game_id_item_id_key
  on public.game_items (game_id, item_id);

create index if not exists game_items_game_id_idx
  on public.game_items (game_id);

do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'game_items' and c.relrowsecurity
  ) then
    raise notice 'game_items has RLS enabled; add policies matching your games/items policies.';
  end if;
end
$$;
