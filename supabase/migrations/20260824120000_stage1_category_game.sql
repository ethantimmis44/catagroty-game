-- Stage 1: additive Category Game schema.
-- Safe to re-run. Does not drop tables or delete existing rows.

-- Categories: keep existing rows; add fields for later catalog growth.
alter table public.categories
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

update public.categories
set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

create unique index if not exists categories_slug_key
  on public.categories (slug);

-- Items: image_url already exists. Add metadata/tags for later filtering.
alter table public.items
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.items
set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

create unique index if not exists items_category_id_slug_key
  on public.items (category_id, slug);

-- Games: category_id, current_item_id, budget, and max_players already exist.
alter table public.games
  add column if not exists challenge text,
  add column if not exists list_size integer,
  add column if not exists current_bidder_id uuid,
  add column if not exists current_bid_player_id uuid,
  add column if not exists starting_bidder_index integer not null default 0,
  add column if not exists auction_round integer not null default 0,
  add column if not exists auction_status text,
  add column if not exists current_bid integer,
  add column if not exists completed_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'games_current_bidder_id_fkey'
  ) then
    alter table public.games
      add constraint games_current_bidder_id_fkey
      foreign key (current_bidder_id) references public.game_players(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'games_current_bid_player_id_fkey'
  ) then
    alter table public.games
      add constraint games_current_bid_player_id_fkey
      foreign key (current_bid_player_id) references public.game_players(id)
      on delete set null;
  end if;
end
$$;

-- Bids / collections: keep existing rows; add round and price for later auction stages.
alter table public.bids
  add column if not exists auction_round integer,
  add column if not exists is_pass boolean not null default false;

alter table public.collections
  add column if not exists price integer,
  add column if not exists auction_round integer;

-- Stub tables for later voting and publishing. Empty for now.
create table if not exists public.game_votes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  voter_id uuid not null references public.game_players(id) on delete cascade,
  nominee_id uuid not null references public.game_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, voter_id)
);

create table if not exists public.published_games (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references public.games(id) on delete cascade,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
