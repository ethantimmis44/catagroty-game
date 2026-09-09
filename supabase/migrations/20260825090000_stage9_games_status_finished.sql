-- Stage 9: games.status uses waiting / active / finished.
-- Inspects games_status_check, then replaces it with those three values.
-- Does not drop tables, disable RLS, or remove other constraints.
-- Any leftover invalid status 'complete' is mapped to 'finished'.

do $$
declare
  definition text;
begin
  select pg_get_constraintdef(c.oid) into definition
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'games'
    and c.conname = 'games_status_check';

  raise notice 'games_status_check before Stage 9: %', coalesce(definition, '(missing)');

  alter table public.games drop constraint if exists games_status_check;

  update public.games
  set status = 'finished'
  where status in ('complete', 'completed');

  alter table public.games
    add constraint games_status_check
    check (status in ('waiting', 'active', 'finished'));

  raise notice 'games_status_check after Stage 9: CHECK (status IN (waiting, active, finished))';
end
$$;
