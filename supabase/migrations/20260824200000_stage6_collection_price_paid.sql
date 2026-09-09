-- Stage 6: collection price_paid and one-win-per-item-per-game.
-- Additive / constraint only. Does not delete catalogue rows.

alter table public.collections
  add column if not exists price_paid integer;

update public.collections
set price_paid = price
where price_paid is null
  and price is not null;

update public.collections
set price = price_paid
where price is null
  and price_paid is not null;

-- Existing nulls cannot remain once the column is required.
update public.collections
set price_paid = 0
where price_paid is null;

alter table public.collections
  alter column price_paid set not null;

alter table public.collections
  drop constraint if exists collections_price_paid_check;

alter table public.collections
  add constraint collections_price_paid_check
  check (price_paid >= 0);

-- One collection row per catalogue item in a game.
create unique index if not exists collections_game_id_item_id_key
  on public.collections (game_id, item_id);
