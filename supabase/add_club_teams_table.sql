-- Migration: relational club_teams table
-- Replaces the JSONB categories/teams stored in clubs.description
-- Each team belongs to a club, has an optional category label, level, and sport override.

create table if not exists public.club_teams (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  name        text not null,           -- e.g. "Seniors A", "U13 B"
  category    text,                    -- e.g. "Seniors", "U13"
  level       text,                    -- e.g. "D1", "R2"
  sport       text,                    -- override club sport (mixed clubs)
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- Index for fast lookup by club
create index if not exists club_teams_club_id_idx on public.club_teams (club_id);

-- RLS
alter table public.club_teams enable row level security;

-- Anyone can read teams
create policy "club_teams_select_all" on public.club_teams
  for select using (true);

-- Only the club owner / admins can insert/update/delete
create policy "club_teams_insert_club_admin" on public.club_teams
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (role = 'admin' or club_id = club_teams.club_id)
    )
  );

create policy "club_teams_update_club_admin" on public.club_teams
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (role = 'admin' or club_id = club_teams.club_id)
    )
  );

create policy "club_teams_delete_club_admin" on public.club_teams
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (role = 'admin' or club_id = club_teams.club_id)
    )
  );
