-- Run once in the Supabase dashboard → SQL Editor → New query → Run.
-- Creates one table for the tracker and locks it to the signed-in user.

create table if not exists public.tracker_rows (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  collection text        not null check (collection in ('schools','rentals','tasks')),
  doc_id     text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, doc_id)
);

alter table public.tracker_rows enable row level security;

-- One policy, both directions: you may read and write your own rows and
-- nobody else's. `using` filters what you can see, `with check` constrains
-- what you may write, so a client cannot insert a row under another user id.
drop policy if exists "tracker_rows_own" on public.tracker_rows;
create policy "tracker_rows_own" on public.tracker_rows
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Default the owner column so a client never has to assert who it is.
alter table public.tracker_rows
  alter column user_id set default auth.uid();

-- Live updates between your phone and laptop.
alter publication supabase_realtime add table public.tracker_rows;
