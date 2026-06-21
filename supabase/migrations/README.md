# Migrations Supabase — SportLink

> 75 fichiers, ordre chronologique strict.
> **Ne jamais supprimer ni modifier une migration déjà appliquée.**
> Pour corriger une erreur, créer une nouvelle migration.

---

## Phase 1 — Lancement (20–23 mai 2026)

| Fichier | Description |
|---------|-------------|
| `20260520_push_subscriptions.sql` | Table `push_subscriptions` (notifications web push) |
| `20260520_security_rls_fix.sql` | Corrections RLS initiales sur events / announcements |
| `20260521_club_pages_rls_v2.sql` | RLS pages clubs v2 |
| `20260521_club_rls_fix.sql` | Correctif RLS clubs (SELECT public) |
| `20260521_events_missing_columns.sql` | Colonnes manquantes sur `events` |
| `20260521_perf_indexes.sql` | Index de performance initiaux |
| `20260521_plan_xp.sql` | Colonne `plan` et `xp` sur `profiles` |
| `20260521_tournament_fields.sql` | Champs tournois sur `events` |
| `20260523_club_media_assets.sql` | Table `club_media_assets` (photos, vidéos) |
| `20260523_club_media_bucket.sql` | Bucket Storage `club-media` |

---

## Phase 2 — Enrichissement clubs & événements (26–28 mai 2026)

| Fichier | Description |
|---------|-------------|
| `20260526_api_rate_limits.sql` | Table `api_rate_limits` (anti-abus) |
| `20260526_club_follower_counts_fix.sql` | Correctif compteur abonnés clubs |
| `20260526_club_monthly_leaderboard_view.sql` | Vue `club_monthly_leaderboard` |
| `20260526_events_club_id_rls_fix.sql` | Fix RLS events / club_id TEXT vs UUID |
| `20260526_events_man_of_match.sql` | Colonne `man_of_match` sur events |
| `20260526_security_hardening.sql` | Durcissement RLS général |
| `20260527_admin_notif_prefs.sql` | Préférences notifications admin |
| `20260527_ai_import_count_rpc.sql` | RPC compteur imports IA |
| `20260527_club_manager_rls.sql` | RLS `club_managers` |
| `20260527_club_manager_roles.sql` | Colonne `role` sur `club_managers` |
| `20260527_club_sponsors.sql` | Table `club_sponsors` v1 |
| `20260527_event_photos.sql` | Table `event_photos` |
| `20260527_events_archive.sql` | Colonne `archived` + RPC archivage saison |
| `20260527_events_reminder_sent.sql` | Colonne `reminder_sent` sur events |
| `20260527_featured_events.sql` | Table `featured_events` v1 |
| `20260527_poster_exports_ai_tracking.sql` | Tracking exports IA PosterStudio |
| `20260527_scheduled_ann_notified.sql` | Colonne `notified` annonces programmées |
| `20260527_scheduled_announcements.sql` | Table `scheduled_announcements` |
| `20260528_club_managers_status.sql` | Colonne `status` sur `club_managers` |
| `20260528_club_players.sql` | Table `club_players` (effectif) |
| `20260528_club_stats_view.sql` | Vue `club_stats` |
| `20260528_featured_events_fk_fix.sql` | Correctif FK `featured_events` |
| `20260528_prod_audit.sql` | Audit prod — corrections club_id TEXT/UUID |
| `20260528_training_sessions.sql` | Table `training_sessions` |
| `20260528_weekly_digest_cron.sql` | Cron digest hebdomadaire |

---

## Phase 3 — Sponsors & Scores (29–31 mai 2026)

| Fichier | Description |
|---------|-------------|
| `20260529_club_sponsors_unified.sql` | Refonte sponsors unifiée |
| `20260530_club_sponsors_v2.sql` | Sponsors v2 (champs supplémentaires) |
| `20260531_match_scores_system.sql` | Système scores matchs complet |

---

## Phase 4 — Subscriptions, Sécurité P0, Onboarding (1–4 juin 2026)

| Fichier | Description |
|---------|-------------|
| `20260601_club_logos_policy_fix.sql` | Policy Storage logos clubs |
| `20260601_club_subscriptions.sql` | Table `club_subscriptions` (Stripe) |
| `20260602_backfill_club_admins.sql` | Backfill admins clubs existants |
| `20260602_club_challenges.sql` | Table `club_challenges` |
| `20260602_club_managers_select_policy.sql` | Policy SELECT `club_managers` |
| `20260602_event_predictions.sql` | Table `event_predictions` |
| `20260602_on_club_created_trigger.sql` | Trigger init club à la création |
| `20260603_club_status_and_fields.sql` | Colonne `status` clubs (pending/active) + champs enrichis |
| `20260603_event_photos_bucket.sql` | Bucket Storage `event-photos` |
| `20260603_feature_gating_serverside.sql` | Feature gating côté serveur |
| `20260603_missing_indexes.sql` | Index manquants (audit perf) |
| `20260603_p0_security_fixes.sql` | Correctifs sécurité P0 critiques |
| `20260603_rls_hardening_club_status.sql` | RLS basé sur `club.status` |
| `20260603_subscription_expiry_cron.sql` | Cron expiration abonnements |
| `20260603_subscription_tiers_v2.sql` | Tiers abonnement v2 (starter/pro/elite) |
| `20260604_delete_own_account.sql` | RPC suppression compte utilisateur |
| `20260604_fix_club_managers_rls_and_events_poster.sql` | Fix RLS managers + events poster |
| `20260604_match_player_attendance.sql` | Table `match_player_attendance` |

---

## Phase 5 — Convocations & Covoiturage (7–9 juin 2026)

| Fichier | Description |
|---------|-------------|
| `20260607_carpool_history.sql` | Table `carpool_history` (historique trajets) |
| `20260607_event_convocations.sql` | Table `event_convocations` (convocations joueurs) |
| `20260609_fix_onboarding_done.sql` | Correctif flag `onboarding_done` |

---

## Phase 6 — Feedback, Analytics & Médias (10–14 juin 2026)

| Fichier | Description |
|---------|-------------|
| `20260610_app_feedback.sql` | Tables `app_feedback` + `feedback_votes` |
| `20260610_demo_data_columns.sql` | Colonnes données démo (is_demo) |
| `20260610_feedback_vote_count.sql` | Compteur votes feedback (materialized) |
| `20260610_profiles_job_role.sql` | Colonne `job_role` sur `profiles` |
| `20260610_rls_push_subscriptions.sql` | RLS `push_subscriptions` |
| `20260610_storage_mime_types.sql` | MIME types autorisés Storage |
| `20260612_convocation_transport.sql` | Colonne transport sur convocations |
| `20260612_match_scores_rls_managers.sql` | RLS scores matchs pour managers |
| `20260614_security_db_audit.sql` | Audit sécurité DB — 6 failles corrigées |

---

## Phase 7 — Admin, RBAC & Sécurité avancée (16–17 juin 2026)

| Fichier | Description |
|---------|-------------|
| `20260616_analytics.sql` | Table `analytics_events` + RGPD consent |
| `20260616_feedback_admin.sql` | Table `feedback_admin_notes` + notifications |
| `20260616_poster_exports_template.sql` | Colonne `template_id` sur `poster_exports` |
| `20260617_plan_pricing_config.sql` | Table `plan_pricing_config` (prix admin-configurables) |
| `20260617_planning_security.sql` | Sécurisation accès planning (convocations) |
| `20260617_rbac_grants_system.sql` | Tables `permission_matrix`, `feature_gates_db`, `admin_grants`, `admin_audit_log` |
| `20260617_security_audit_fixes.sql` | Audit sécurité — correctifs RLS leaderboard, RGPD emails, guards plan/XP |
