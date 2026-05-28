-- ── Sponsors unifiés : ajouter tier, website_url, page_visible ───────────────
-- Permet d'utiliser club_sponsors comme source unique pour la page club ET le feed.
--   tier         → niveau d'affichage (Or/Argent/Bronze/Partenaire) sur la page
--   website_url  → lien cliquable du sponsor sur la page club
--   page_visible → afficher sur la page club publique (SponsorsBlock)
--   active       → injecter dans le feed des abonnés (déjà existant)

ALTER TABLE public.club_sponsors
  ADD COLUMN IF NOT EXISTS tier         text    NOT NULL DEFAULT 'partner',
  ADD COLUMN IF NOT EXISTS website_url  text,
  ADD COLUMN IF NOT EXISTS page_visible boolean NOT NULL DEFAULT true;

ALTER TABLE public.club_sponsors
  DROP CONSTRAINT IF EXISTS chk_sponsor_tier;

ALTER TABLE public.club_sponsors
  ADD CONSTRAINT chk_sponsor_tier
  CHECK (tier IN ('gold', 'silver', 'bronze', 'partner'));
