-- push_subscriptions : stockage des souscriptions Web Push par utilisateur
create table if not exists push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- L'utilisateur ne peut gérer que ses propres souscriptions
drop policy if exists "push_subscriptions_self" on push_subscriptions;
create policy "push_subscriptions_self"
  on push_subscriptions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index pour récupérer rapidement toutes les souscriptions d'un user (envoi push)
create index if not exists push_subscriptions_user_id_idx
  on push_subscriptions (user_id);
