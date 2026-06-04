-- ============================================================
-- SportLink — Seed de recette (complémentaire à seed.sql)
-- Objectif : environnement réaliste pour tester tous les parcours
-- Prérequis : seed.sql + toutes les migrations appliquées
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 0. UUIDs constants pour les utilisateurs de test ──────────────────────────
-- Ces UUIDs sont fixes pour la reproductibilité des tests.
-- Créer ces utilisateurs via Supabase Auth > Users > New User avant d'exécuter.
-- Emails :
--   admin@sportlink.test          → admin, mot de passe : SportLink2026!
--   president.football@test.fr    → club_admin (FC Plougastel), MDP : Test1234!
--   president.handball@test.fr    → club_admin (HB Landerneau), MDP : Test1234!
--   president.basket@test.fr      → club_admin (CB Quimper, plan pro), MDP : Test1234!
--   president.plouvorn@test.fr    → club_admin (FC Plouvorn, pending), MDP : Test1234!
--   user.lambda@test.fr           → utilisateur standard, MDP : Test1234!

-- ── 1. Mettre à jour les clubs seed existants → status verified ───────────────

UPDATE public.clubs
SET
  status      = 'verified',
  verified_at = created_at
WHERE source = 'seed'
  AND (status IS NULL OR status = 'pending_verification');

-- ── 2. Clubs supplémentaires pour la recette ──────────────────────────────────
-- Ces clubs couvrent différents sports, niveaux et statuts de vérification.

INSERT INTO public.clubs
  (static_id, name, sport, city, description, email, phone,
   status, founding_year, member_count, level, primary_color,
   manager_name, manager_function, manager_phone,
   venue, address, postal_code, region,
   facebook, instagram, website,
   categories, source)
VALUES

-- Football — Plan PRO — vérifié
('rec-fc-plougastel',
 'FC Plougastel-Daoulas', 'Football', 'Plougastel-Daoulas',
 'Club de football fondé en 1935, implanté au cœur du Finistère. Nous accueillons toutes les catégories de l''U7 aux Seniors.',
 'contact@fcplougastel.bzh', '02 98 40 12 34',
 'verified', 1935, 280, 'Division Honneur Bretagne', '#003087',
 'Jean-Pierre Morvan', 'Président', '06 12 34 56 78',
 'Stade de Kermaria', '15 rue du Stade', '29470', 'Bretagne',
 'facebook.com/fcplougastel', '@fc_plougastel', 'www.fcplougastel.bzh',
 '[{"id":"seniors-fcp","name":"Seniors","teams":[{"id":"fcp-s1","name":"Seniors 1"},{"id":"fcp-s2","name":"Seniors 2"}]},{"id":"jeunes-fcp","name":"Jeunes","teams":[{"id":"fcp-u17","name":"U17"},{"id":"fcp-u15","name":"U15"},{"id":"fcp-u13","name":"U13"}]}]'::jsonb,
 'seed_recette'),

-- Handball — Plan STARTER — vérifié
('rec-hb-landerneau',
 'HB Landerneau', 'Handball', 'Landerneau',
 'Club de handball dynamique avec 12 équipes du baby au championnat de France de Pro D2 Féminin.',
 'contact@hblanderneau.fr', '02 98 21 45 67',
 'verified', 1962, 320, 'Pro D2 Féminin', '#E30613',
 'Marie Kerguénou', 'Présidente', '06 78 90 12 34',
 'Palais des Sports J. Hénaff', '1 av. du Moulin', '29800', 'Bretagne',
 'facebook.com/hblanderneau', '@handball_landerneau', 'www.hblanderneau.fr',
 '[{"id":"seniors-hbl","name":"Seniors","teams":[{"id":"hbl-f1","name":"Féminines 1"},{"id":"hbl-m1","name":"Masculins 1"}]}]'::jsonb,
 'seed_recette'),

-- Basketball — Plan PRO — vérifié
('rec-cb-quimper',
 'CB Quimper', 'Basketball', 'Quimper',
 'Club de basket cornu depuis 1952. Nos équipes évoluent en Nationale 2 Masculine et Pro B Féminine.',
 'contact@cbquimper.fr', '02 98 55 23 45',
 'verified', 1952, 410, 'Nationale 2', '#FFB800',
 'Thomas Le Gall', 'Directeur Sportif', '06 34 56 78 90',
 'Palais des Sports Orry', '12 bd de Keranguen', '29000', 'Bretagne',
 'facebook.com/cbquimper', '@cb_quimper', 'www.cbquimper.fr',
 '[{"id":"seniors-cbq","name":"Seniors","teams":[{"id":"cbq-m1","name":"Seniors Masculins"},{"id":"cbq-f1","name":"Seniors Féminines"}]}]'::jsonb,
 'seed_recette'),

-- Football — FREE — PENDING_VERIFICATION (club test FC Plouvorn)
('rec-fc-plouvorn',
 'FC Plouvorn', 'Football', 'Plouvorn',
 'Club de football du canton de Landivisiau. Fondé en 1952, nous accueillons 85 licenciés de l''U7 aux Seniors.',
 'president@fcplouvorn.fr', '06 99 88 77 66',
 'pending_verification', 1952, 85, 'Départemental 1', '#1E3A5F',
 'Hervé Tanguy', 'Président', '06 99 88 77 66',
 'Stade Municipal de Plouvorn', '1 route du Stade', '29420', 'Bretagne',
 NULL, NULL, NULL,
 '[{"id":"seniors-fcp2","name":"Seniors","teams":[{"id":"fcp2-s1","name":"Seniors 1"}]},{"id":"jeunes-fcp2","name":"Jeunes","teams":[{"id":"fcp2-u13","name":"U13"},{"id":"fcp2-u11","name":"U11"}]}]'::jsonb,
 'seed_recette'),

-- Rugby — Plan ELITE — vérifié
('rec-rc-brest',
 'Rugby Club de Brest', 'Rugby', 'Brest',
 'Le RCB est le club phare du rugby finistérien. Fondé en 1907, il est le seul club de la région à évoluer en Fédérale 1.',
 'contact@rcbrest.fr', '02 98 80 34 56',
 'verified', 1907, 350, 'Fédérale 1', '#003082',
 'Patrick Guivarch', 'Président', '06 45 67 89 01',
 'Stade Lavalot', '21 rue Lavalot', '29200', 'Bretagne',
 'facebook.com/rugbyclubbrestois', '@rcbrest', 'www.rcbrest.fr',
 NULL, 'seed_recette'),

-- Natation — Plan FREE — vérifié
('rec-brest-natation',
 'Brest Natation', 'Natation', 'Brest',
 'Club de natation compétition et loisir. 600 adhérents, des groupes pour tous les âges de 5 ans à l''élite.',
 'contact@brestnatation.fr', '02 98 46 12 89',
 'verified', 1948, 600, 'National', '#00A0C6',
 'Sophie Marzin', 'Présidente', '06 22 33 44 55',
 'Piscine du Moulin Blanc', '3 allée du Moulin Blanc', '29200', 'Bretagne',
 NULL, '@brest_natation', 'www.brestnatation.fr',
 NULL, 'seed_recette'),

-- Tennis — Plan SUSPENDED — pour tester l'interface admin
('rec-tc-morlaix',
 'Tennis Club de Morlaix', 'Tennis', 'Morlaix',
 'Club de tennis avec 8 courts couverts et 4 extérieurs.',
 'contact@tcmorlaix.fr', '02 98 88 99 00',
 'suspended', 1972, 145, 'Régional', '#28A745',
 'Guy Pengam', 'Président', '06 11 22 33 44',
 'Courts du Launay', '45 rue du Launay', '29600', 'Bretagne',
 NULL, NULL, NULL,
 NULL, 'seed_recette'),

-- Judo — Plan FREE — REJECTED — pour tester l'interface admin
('rec-judo-quimper',
 'Judo Club Quimpérois', 'Judo', 'Quimper',
 'Club de judo actif depuis 1968.',
 'judo.quimper@gmail.com', '02 98 64 00 00',
 'rejected', 1968, 90, 'Régional', '#8B0000',
 'Alain Bossard', 'Président', '06 55 66 77 88',
 'Dojo municipal', '8 rue du Judo', '29000', 'Bretagne',
 NULL, NULL, NULL,
 NULL, 'seed_recette')

ON CONFLICT (static_id) DO NOTHING;

-- ── 3. Abonnements clubs ──────────────────────────────────────────────────────

INSERT INTO public.club_subscriptions
  (club_id, plan, status, current_period_start, current_period_end)
SELECT
  c.id::text,
  p.plan,
  'active',
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '345 days'
FROM (VALUES
  ('rec-fc-plougastel',  'pro'),
  ('rec-hb-landerneau',  'starter'),
  ('rec-cb-quimper',     'pro'),
  ('rec-rc-brest',       'elite'),
  ('rec-brest-natation', 'free'),
  ('rec-fc-plouvorn',    'free'),
  ('rec-tc-morlaix',     'starter'),
  ('rec-judo-quimper',   'free'),
  ('1',                  'pro'),
  ('usc-29',             'elite'),
  ('6',                  'starter'),
  ('9',                  'pro')
) AS p(static_id, plan)
JOIN public.clubs c ON c.static_id = p.static_id
ON CONFLICT (club_id) DO UPDATE SET plan = EXCLUDED.plan;

-- ── 4. Événements de recette (matchs récents + à venir) ───────────────────────

INSERT INTO public.events
  (static_id, title, sport, date, city, venue, lat, lng,
   event_type, team_name, category, level,
   club_id, source)
SELECT
  e.static_id, e.title, e.sport,
  NOW() + (e.days_offset || ' days')::interval,
  e.city, e.venue, e.lat, e.lng,
  e.event_type, e.team_name, e.category, e.level,
  c.id, 'seed_recette'
FROM (VALUES
  -- FC Plougastel — matchs à venir
  ('rec-ev-1', 'FC Plougastel vs Brest Armoricaine', 'Football', 7,
   'Plougastel-Daoulas', 'Stade de Kermaria', 48.3740, -4.3703,
   'championship', 'Seniors 1', 'Seniors', 'Division Honneur Bretagne',
   'rec-fc-plougastel'),
  ('rec-ev-2', 'FC Plougastel vs Gouesnou FC', 'Football', 14,
   'Plougastel-Daoulas', 'Stade de Kermaria', 48.3740, -4.3703,
   'championship', 'Seniors 1', 'Seniors', 'Division Honneur Bretagne',
   'rec-fc-plougastel'),
  ('rec-ev-3', 'FC Plougastel U15 vs Crozon', 'Football', 3,
   'Plougastel-Daoulas', 'Stade de Kermaria', 48.3740, -4.3703,
   'championship', 'U15', 'U15', 'U15 Régional', 'rec-fc-plougastel'),

  -- FC Plouvorn — matchs (pending club, pour tester que ça fonctionne)
  ('rec-ev-plouvorn-1', 'FC Plouvorn vs Lesneven', 'Football', 5,
   'Plouvorn', 'Stade Municipal', 48.5540, -4.0880,
   'championship', 'Seniors 1', 'Seniors', 'Départemental 1',
   'rec-fc-plouvorn'),

  -- HB Landerneau — matchs handball
  ('rec-ev-4', 'HB Landerneau F vs Brest Bretagne HB', 'Handball', 6,
   'Landerneau', 'Palais des Sports J. Hénaff', 48.4491, -4.2518,
   'championship', 'Féminines 1', 'Seniors Féminines', 'Pro D2 Féminin',
   'rec-hb-landerneau'),
  ('rec-ev-5', 'HB Landerneau F vs Metz Handball', 'Handball', 13,
   'Landerneau', 'Palais des Sports J. Hénaff', 48.4491, -4.2518,
   'championship', 'Féminines 1', 'Seniors Féminines', 'Pro D2 Féminin',
   'rec-hb-landerneau'),

  -- RCB — rugby
  ('rec-ev-6', 'Rugby Club Brest vs Blagnac', 'Rugby', 9,
   'Brest', 'Stade Lavalot', 48.3780, -4.4850,
   'championship', 'Seniors 1', 'Seniors', 'Fédérale 1', 'rec-rc-brest'),

  -- US Brest Football — matchs passés avec scores
  ('rec-ev-usb-past', 'US Brest vs Pont-l''Abbé AF', 'Football', -7,
   'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'championship', 'Seniors 1', 'Seniors', 'Division Honneur Bretagne', '1'),

  -- Tournoi (test type tournament)
  ('rec-ev-tournoi', 'Tournoi International de Brest', 'Football', 21,
   'Brest', 'Stade Francis-Le Blé', 48.3904, -4.4861,
   'tournament', '', 'Jeunes', 'U15', '1')

) AS e(static_id, title, sport, days_offset, city, venue, lat, lng,
       event_type, team_name, category, level, club_static_id)
JOIN public.clubs c ON c.static_id = e.club_static_id
ON CONFLICT (static_id) DO NOTHING;

-- Ajouter un score au match passé
UPDATE public.events
SET score = '{"home": 3, "away": 1}'::jsonb
WHERE static_id = 'rec-ev-usb-past';

-- ── 5. Annonces clubs ─────────────────────────────────────────────────────────

INSERT INTO public.club_announcements
  (club_id, author_id, type, title, message, target_teams)
SELECT
  c.id,
  c.user_id,
  a.type,
  a.title,
  a.message,
  a.target_teams
FROM (VALUES
  ('rec-fc-plougastel', 'info',
   'Reprise des entraînements',
   'Les entraînements reprennent le lundi 9 juin à 19h. Tous les joueurs sont attendus au Stade de Kermaria.',
   ARRAY['all']),
  ('rec-fc-plougastel', 'urgent',
   '⚠️ Convocation annulée',
   'La convocation pour le match de samedi est annulée suite aux intempéries. Recontactez le bureau.',
   ARRAY['Seniors 1']),
  ('rec-hb-landerneau', 'result',
   'Victoire 28-24 ! 🎉',
   'Belle victoire de nos Féminines face à Metz. Prochain match vendredi à 20h.',
   ARRAY['Féminines 1']),
  ('rec-rc-brest', 'info',
   'Inscription tournoi d''été',
   'Le tournoi amical de juillet est ouvert aux inscriptions. Formulaire disponible sur notre site.',
   ARRAY['all'])
) AS a(club_static_id, type, title, message, target_teams)
JOIN public.clubs c ON c.static_id = a.club_static_id
WHERE c.user_id IS NOT NULL; -- Nécessite un propriétaire réel

-- ── 6. Notifications de recette ───────────────────────────────────────────────
-- Crée des notifications de démonstration pour le FC Plouvorn (pending)
-- Note : ces inserts échoueront silencieusement si les user_ids n'existent pas.

-- Notification admin → nouveau club pending (FC Plouvorn)
-- (sera insérée automatiquement par l'edge function en production)

-- ── 7. Vues SQL pour rapports (optionnel) ────────────────────────────────────

-- Vue : résumé par statut pour le dashboard admin
CREATE OR REPLACE VIEW public.v_clubs_by_status AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE source = 'seed' OR source = 'seed_recette') as seed_clubs,
  COUNT(*) FILTER (WHERE source NOT IN ('seed','seed_recette') OR source IS NULL) as real_clubs
FROM public.clubs
GROUP BY status
ORDER BY CASE status
  WHEN 'pending_verification' THEN 1
  WHEN 'verified'             THEN 2
  WHEN 'suspended'            THEN 3
  WHEN 'rejected'             THEN 4
  WHEN 'draft'                THEN 5
  ELSE 6
END;

-- ── 8. Récapitulatif ────────────────────────────────────────────────────────

-- Afficher le bilan après insertion
SELECT * FROM public.v_clubs_by_status;
