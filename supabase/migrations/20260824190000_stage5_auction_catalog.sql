-- Stage 5: bid rules, budget range, and catalogue metadata.
-- Additive / constraint replacement only. Does not drop tables or delete rows.

-- 1. Bids: passes are amount 0; real bids are whole pounds 1–100.
alter table public.bids
  drop constraint if exists bids_amount_check;

alter table public.bids
  add constraint bids_amount_check check (
    (
      coalesce(is_pass, false) = true
      and amount = 0
    )
    or (
      coalesce(is_pass, false) = false
      and amount >= 1
      and amount <= 100
      and amount = trunc(amount)
    )
  );

-- 2. Game budget: £20–£100. Cap any out-of-range existing rows first.
update public.games
set budget = 20
where budget < 20;

update public.games
set budget = 100
where budget > 100;

alter table public.games
  drop constraint if exists games_budget_check;

alter table public.games
  drop constraint if exists games_budget_range;

alter table public.games
  add constraint games_budget_range check (budget >= 20 and budget <= 100);

-- 3. Player remaining budget cannot go negative.
alter table public.game_players
  drop constraint if exists game_players_budget_remaining_check;

alter table public.game_players
  add constraint game_players_budget_remaining_check
  check (budget_remaining >= 0);

-- 4. Image attribution and flexible metadata on items.
alter table public.items
  add column if not exists image_source text,
  add column if not exists image_credit text,
  add column if not exists image_license text,
  add column if not exists image_path text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 5. Category slug for stable catalogue keys.
alter table public.categories
  add column if not exists slug text,
  add column if not exists icon text;

update public.categories
set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null or slug = '';

create unique index if not exists categories_slug_key
  on public.categories (slug);

-- 6. Many-to-many category membership (e.g. a player in two sports lists).
create table if not exists public.item_categories (
  item_id uuid not null references public.items(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (item_id, category_id)
);

create index if not exists item_categories_category_id_idx
  on public.item_categories (category_id);

-- 7. Optional explicit turn start timestamp (deadline remains authoritative).
alter table public.games
  add column if not exists bid_turn_started_at timestamptz;

-- 8. List size is derived from player count: 2→5, 3–4→4, 5–6→3.
alter table public.games
  drop constraint if exists games_list_size_check;

alter table public.games
  add constraint games_list_size_check
  check (list_size is null or list_size in (3, 4, 5));
