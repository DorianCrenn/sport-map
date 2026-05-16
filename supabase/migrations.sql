-- ══════════════════════════════════════════════════════════
-- SportLink — Migration production
-- À exécuter dans l'éditeur SQL Supabase (Dashboard > SQL Editor)
-- ══════════════════════════════════════════════════════════

-- ── 1. Pages de clubs (blocs + typographie) ──────────────

create table if not exists public.club_pages (
  id           uuid primary key default gen_random_uuid(),
  club_id      text not null unique,
  blocks       jsonb not null default '[]'::jsonb,
  typography   jsonb not null default '{"titleFont":"Oswald","bodyFont":"Inter"}'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.club_pages enable row level security;

drop policy if exists "club_pages_select" on public.club_pages;
drop policy if exists "club_pages_upsert" on public.club_pages;

create policy "club_pages_select" on public.club_pages
  for select using (true);

create policy "club_pages_upsert" on public.club_pages
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── 2. Gestionnaires de clubs ────────────────────────────

create table if not exists public.club_managers (
  id         uuid primary key default gen_random_uuid(),
  club_id    text not null,
  email      text not null,
  name       text not null default '',
  added_at   timestamptz not null default now(),
  unique (club_id, email)
);

alter table public.club_managers enable row level security;

drop policy if exists "club_managers_select" on public.club_managers;
drop policy if exists "club_managers_insert" on public.club_managers;
drop policy if exists "club_managers_delete" on public.club_managers;

create policy "club_managers_select" on public.club_managers
  for select using (true);

create policy "club_managers_insert" on public.club_managers
  for insert with check (auth.role() = 'authenticated');

create policy "club_managers_delete" on public.club_managers
  for delete using (auth.role() = 'authenticated');

-- ── 3. Entraînements par équipe ──────────────────────────

create table if not exists public.club_trainings (
  id          uuid primary key default gen_random_uuid(),
  club_id     text not null,
  team_id     text not null,
  sessions    jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  unique (club_id, team_id)
);

alter table public.club_trainings enable row level security;

drop policy if exists "club_trainings_select" on public.club_trainings;
drop policy if exists "club_trainings_upsert" on public.club_trainings;

create policy "club_trainings_select" on public.club_trainings
  for select using (true);

create policy "club_trainings_upsert" on public.club_trainings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
