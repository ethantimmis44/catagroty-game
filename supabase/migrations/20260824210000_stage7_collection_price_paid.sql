-- Stage 7: live collections.price_paid (some databases used this name).
-- Additive / backfill only. Does not delete catalogue or game rows.

alter table public.collections
  add column if not exists price_paid integer;

alter table public.collections
  add column if not exists price_paid integer;

alter table public.collections
  add column if not exists price integer;

update public.collections
set price_paid = coalesce(price_paid, price_paid, price)
where price_paid is null;

update public.collections
set price_paid = coalesce(price_paid, price_paid, price)
where price_paid is null;

update public.collections
set price = coalesce(price, price_paid, price_paid)
where price is null;

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

create unique index if not exists collections_game_id_item_id_key
  on public.collections (game_id, item_id);
