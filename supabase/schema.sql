create extension if not exists pgcrypto;

create table if not exists public.editions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  number text not null,
  published_at timestamptz not null,
  pdf_path text not null,
  pdf_original_name text not null,
  pdf_size bigint not null,
  page_count integer not null default 0,
  cover_page_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  image_path text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.editions enable row level security;
alter table public.sponsors enable row level security;

drop policy if exists "Public can read editions" on public.editions;
create policy "Public can read editions"
on public.editions
for select
using (true);

drop policy if exists "Authenticated editors can manage editions" on public.editions;
create policy "Authenticated editors can manage editions"
on public.editions
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read sponsors" on public.sponsors;
create policy "Public can read sponsors"
on public.sponsors
for select
using (true);

drop policy if exists "Authenticated editors can manage sponsors" on public.sponsors;
create policy "Authenticated editors can manage sponsors"
on public.sponsors
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values
  ('editions', 'editions', true),
  ('sponsors', 'sponsors', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read edition PDFs" on storage.objects;
create policy "Public can read edition PDFs"
on storage.objects
for select
using (bucket_id = 'editions');

drop policy if exists "Authenticated editors can manage edition PDFs" on storage.objects;
create policy "Authenticated editors can manage edition PDFs"
on storage.objects
for all
to authenticated
using (bucket_id = 'editions')
with check (bucket_id = 'editions');

drop policy if exists "Public can read sponsor images" on storage.objects;
create policy "Public can read sponsor images"
on storage.objects
for select
using (bucket_id = 'sponsors');

drop policy if exists "Authenticated editors can manage sponsor images" on storage.objects;
create policy "Authenticated editors can manage sponsor images"
on storage.objects
for all
to authenticated
using (bucket_id = 'sponsors')
with check (bucket_id = 'sponsors');
