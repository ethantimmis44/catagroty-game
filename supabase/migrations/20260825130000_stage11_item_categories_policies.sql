-- Stage 11: allow the catalogue seeder to write item_categories.
--
-- item_categories records that a catalogue item also belongs to a second
-- category (for example Denzel Washington is primarily "Actors - Male" and is
-- also a "Celebrities - Male"). RLS is enabled on the table but no policy
-- allowed inserts, so every cross-category membership was silently dropped and
-- those categories only ever showed their primary items.
--
-- This adds read and write policies for the same public catalogue data the
-- items and categories tables already expose. It does NOT disable RLS and does
-- not touch any policy on games, game_players, bids or collections.
-- Safe to re-run.

alter table public.item_categories enable row level security;

drop policy if exists item_categories_read on public.item_categories;
create policy item_categories_read
  on public.item_categories
  for select
  using (true);

drop policy if exists item_categories_insert on public.item_categories;
create policy item_categories_insert
  on public.item_categories
  for insert
  with check (true);

drop policy if exists item_categories_update on public.item_categories;
create policy item_categories_update
  on public.item_categories
  for update
  using (true)
  with check (true);

do $$
begin
  raise notice 'item_categories policies installed. Re-run: npm run seed:catalog';
end
$$;
