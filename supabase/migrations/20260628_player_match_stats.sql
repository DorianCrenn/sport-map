-- ─────────────────────────────────────────────────────────────────────────────
-- player_match_stats  : buts, passes, cartons, présences par joueur/match
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists player_match_stats (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  player_id   uuid not null references club_players(id) on delete cascade,
  club_id     uuid not null references clubs(id) on delete cascade,
  -- Présences (align with existing match_player_attendance status values)
  status      text not null default 'present'
              check (status in ('present','absent','unsure','not_called')),
  -- Stats offensives/défensives
  goals       int  not null default 0 check (goals       >= 0),
  assists     int  not null default 0 check (assists     >= 0),
  yellow_cards int not null default 0 check (yellow_cards >= 0),
  red_cards   int  not null default 0 check (red_cards   >= 0),
  -- Minutes jouées (optionnel)
  minutes_played int check (minutes_played is null or (minutes_played >= 0 and minutes_played <= 120)),
  -- Metadata
  entered_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, player_id)
);

-- Index utiles
create index if not exists player_match_stats_event_id  on player_match_stats (event_id);
create index if not exists player_match_stats_player_id on player_match_stats (player_id);
create index if not exists player_match_stats_club_id   on player_match_stats (club_id);

-- Trigger updated_at
create or replace function update_player_match_stats_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_player_match_stats_updated_at on player_match_stats;
create trigger trg_player_match_stats_updated_at
  before update on player_match_stats
  for each row execute function update_player_match_stats_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table player_match_stats enable row level security;

-- Lecture : tout membre du club (managers + players) OU admin
create policy "player_stats_select"
  on player_match_stats for select
  using (
    auth.uid() in (
      select user_id from clubs where id = player_match_stats.club_id
      union
      select user_id from club_managers where club_id = player_match_stats.club_id and user_id is not null
      union
      select user_id from club_players where club_id = player_match_stats.club_id and user_id is not null and is_active = true
    )
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- Écriture : managers et owners seulement
create policy "player_stats_insert"
  on player_match_stats for insert
  with check (
    auth.uid() in (
      select user_id from clubs where id = player_match_stats.club_id
      union
      select user_id from club_managers where club_id = player_match_stats.club_id and user_id is not null
    )
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

create policy "player_stats_update"
  on player_match_stats for update
  using (
    auth.uid() in (
      select user_id from clubs where id = player_match_stats.club_id
      union
      select user_id from club_managers where club_id = player_match_stats.club_id and user_id is not null
    )
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

create policy "player_stats_delete"
  on player_match_stats for delete
  using (
    auth.uid() in (
      select user_id from clubs where id = player_match_stats.club_id
      union
      select user_id from club_managers where club_id = player_match_stats.club_id and user_id is not null
    )
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- View : agrégats de saison par joueur
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view player_season_stats as
select
  pms.player_id,
  pms.club_id,
  cp.name                as player_name,
  cp.number              as jersey_number,
  cp.position            as position,
  count(*)               as matches_total,
  count(*) filter (where pms.status = 'present') as matches_played,
  sum(pms.goals)         as total_goals,
  sum(pms.assists)       as total_assists,
  sum(pms.yellow_cards)  as total_yellow,
  sum(pms.red_cards)     as total_red
from player_match_stats pms
join club_players cp on cp.id = pms.player_id
group by pms.player_id, pms.club_id, cp.name, cp.number, cp.position;

comment on view player_season_stats is 'Agrégats de saison par joueur, calculés depuis player_match_stats';
