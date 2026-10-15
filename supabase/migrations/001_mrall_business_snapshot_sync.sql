-- MR ALL IN Business V2 — manual snapshot sync
-- Run in Supabase SQL Editor. Never place service_role/secret keys in the frontend.
create table if not exists public.mrall_business_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.mrall_business_snapshots enable row level security;

revoke all on table public.mrall_business_snapshots from anon;
grant select, insert, update, delete on table public.mrall_business_snapshots to authenticated;

drop policy if exists "owner can read own business snapshot" on public.mrall_business_snapshots;
drop policy if exists "owner can insert own business snapshot" on public.mrall_business_snapshots;
drop policy if exists "owner can update own business snapshot" on public.mrall_business_snapshots;
drop policy if exists "owner can delete own business snapshot" on public.mrall_business_snapshots;

create policy "owner can read own business snapshot"
  on public.mrall_business_snapshots for select to authenticated
  using (auth.uid() = user_id);
create policy "owner can insert own business snapshot"
  on public.mrall_business_snapshots for insert to authenticated
  with check (auth.uid() = user_id);
create policy "owner can update own business snapshot"
  on public.mrall_business_snapshots for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner can delete own business snapshot"
  on public.mrall_business_snapshots for delete to authenticated
  using (auth.uid() = user_id);
