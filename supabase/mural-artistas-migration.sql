create table if not exists public.mural_artistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  depoimento text not null,
  segmento_artistico text,
  imagem_url text not null,
  imagem_alt text not null,
  ordem integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  publicado_em timestamptz
);

create index if not exists mural_artistas_public_idx
on public.mural_artistas (ordem asc, publicado_em desc)
where status = 'published' and ativo = true;

create or replace function public.set_mural_artistas_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  if new.status = 'published' and old.status is distinct from 'published' and new.publicado_em is null then
    new.publicado_em = now();
  end if;
  if new.status <> 'published' then
    new.publicado_em = null;
  end if;
  return new;
end;
$$;

drop trigger if exists mural_artistas_set_atualizado_em on public.mural_artistas;
create trigger mural_artistas_set_atualizado_em
before update on public.mural_artistas
for each row
execute function public.set_mural_artistas_atualizado_em();

alter table public.mural_artistas enable row level security;

drop policy if exists "Public can read published mural artists" on public.mural_artistas;
create policy "Public can read published mural artists"
on public.mural_artistas
for select
using (status = 'published' and ativo = true);

drop policy if exists "Authenticated editors can manage mural artists" on public.mural_artistas;
create policy "Authenticated editors can manage mural artists"
on public.mural_artistas
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('mural', 'mural', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read mural artist images" on storage.objects;
create policy "Public can read mural artist images"
on storage.objects
for select
using (bucket_id = 'mural');

drop policy if exists "Authenticated editors can manage mural artist images" on storage.objects;
create policy "Authenticated editors can manage mural artist images"
on storage.objects
for all
to authenticated
using (bucket_id = 'mural')
with check (bucket_id = 'mural');
