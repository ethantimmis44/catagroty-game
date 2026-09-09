-- Stage 4: authoritative 5-second bid deadline.
-- Additive only. Safe to re-run.

alter table public.games
  add column if not exists bid_deadline timestamptz;
