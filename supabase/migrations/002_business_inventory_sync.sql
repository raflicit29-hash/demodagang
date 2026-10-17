-- MR ALL IN Business -> MR ALL IN Store public inventory bridge.
-- Safe to run repeatedly. No service_role key is used in browser code.
create table if not exists public.mrall_store_inventory (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_key text not null,
  match_key text not null default '',
  name text not null check (length(trim(name)) > 0),
  price bigint not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null default 'Hardware',
  image_url text,
  product_status text not null default 'ready'
    check (product_status in ('ready', 'ordered', 'processing', 'shipped', 'sold')),
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (owner_id, source_key)
);
alter table public.mrall_store_inventory enable row level security;
revoke all on public.mrall_store_inventory from anon;
revoke all on public.mrall_store_inventory from authenticated;
grant select on public.mrall_store_inventory to anon, authenticated;
grant insert, update, delete on public.mrall_store_inventory to authenticated;
drop policy if exists "public can read published store inventory" on public.mrall_store_inventory;
drop policy if exists "store admin can read own inventory sync" on public.mrall_store_inventory;
drop policy if exists "store admin can insert inventory sync" on public.mrall_store_inventory;
drop policy if exists "store admin can update inventory sync" on public.mrall_store_inventory;
drop policy if exists "store admin can delete inventory sync" on public.mrall_store_inventory;
create policy "public can read published store inventory"
  on public.mrall_store_inventory for select to anon, authenticated
  using (published = true);
create policy "store admin can read own inventory sync"
  on public.mrall_store_inventory for select to authenticated
  using (auth.uid() = owner_id and lower(coalesce(auth.jwt() ->> 'email', '')) = 'raflicit29@gmail.com');
create policy "store admin can insert inventory sync"
  on public.mrall_store_inventory for insert to authenticated
  with check (auth.uid() = owner_id and lower(coalesce(auth.jwt() ->> 'email', '')) = 'raflicit29@gmail.com');
create policy "store admin can update inventory sync"
  on public.mrall_store_inventory for update to authenticated
  using (auth.uid() = owner_id and lower(coalesce(auth.jwt() ->> 'email', '')) = 'raflicit29@gmail.com')
  with check (auth.uid() = owner_id and lower(coalesce(auth.jwt() ->> 'email', '')) = 'raflicit29@gmail.com');
create policy "store admin can delete inventory sync"
  on public.mrall_store_inventory for delete to authenticated
  using (auth.uid() = owner_id and lower(coalesce(auth.jwt() ->> 'email', '')) = 'raflicit29@gmail.com');
create index if not exists mrall_store_inventory_published_updated_idx on public.mrall_store_inventory (published, updated_at desc);
create index if not exists mrall_store_inventory_match_key_idx on public.mrall_store_inventory (match_key);
