-- Stage 12: portrait crop focus, image status, and retire women's American football.
-- Additive. Does not drop tables, disable RLS, or delete game history.

alter table public.items
  add column if not exists image_focus_x numeric,
  add column if not exists image_focus_y numeric,
  add column if not exists image_status text,
  add column if not exists image_kind text;

alter table public.items
  drop constraint if exists items_image_focus_x_range;

alter table public.items
  add constraint items_image_focus_x_range
  check (image_focus_x is null or (image_focus_x >= 0 and image_focus_x <= 1));

alter table public.items
  drop constraint if exists items_image_focus_y_range;

alter table public.items
  add constraint items_image_focus_y_range
  check (image_focus_y is null or (image_focus_y >= 0 and image_focus_y <= 1));

alter table public.items
  drop constraint if exists items_image_status_check;

alter table public.items
  add constraint items_image_status_check
  check (
    image_status is null
    or image_status in ('verified', 'needs_review', 'missing')
  );

alter table public.items
  drop constraint if exists items_image_kind_check;

alter table public.items
  add constraint items_image_kind_check
  check (
    image_kind is null
    or image_kind in ('photo', 'original')
  );

-- Default people crops toward the head if a host has not set a custom focus.
update public.items
set
  image_focus_x = coalesce(image_focus_x, 0.5),
  image_focus_y = coalesce(image_focus_y, 0.28)
where category_id in (
  select id from public.categories
  where slug in (
    'football-players-male',
    'football-players-female',
    'basketball-players-male',
    'basketball-players-female',
    'american-football-players-male',
    'general-athletes-male',
    'general-athletes-female',
    'tennis-players-male',
    'tennis-players-female',
    'golfers-male',
    'golfers-female',
    'rugby-players-male',
    'rugby-players-female',
    'hockey-players-male',
    'hockey-players-female',
    'celebrities-male',
    'celebrities-female',
    'actors-male',
    'actors-female',
    'musicians-male',
    'musicians-female'
  )
);

update public.items
set
  image_focus_x = coalesce(image_focus_x, 0.5),
  image_focus_y = coalesce(image_focus_y, 0.5)
where image_focus_x is null or image_focus_y is null;

-- Hide the retired women's American football category from new games.
-- Items stay in place (and in any existing game_items / collections) so
-- history is not orphaned; they are marked inactive so they cannot be re-picked.
update public.items
set is_active = false
where category_id in (
  select id from public.categories
  where slug = 'american-football-players-female'
     or lower(name) in (
       'american football players - female',
       'american football players — female'
     )
);

-- Public storage bucket for cached Commons/Wikipedia files. Creating the
-- bucket here is safe to re-run; object policies stay RLS-enabled.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_images_public_read'
  ) then
    create policy item_images_public_read
      on storage.objects
      for select
      using (bucket_id = 'item-images');
  end if;
end
$$;
