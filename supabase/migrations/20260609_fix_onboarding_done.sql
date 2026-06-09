-- Profils créés avant l'ajout de la colonne onboarding_done ont NULL.
-- Ces utilisateurs sont déjà actifs — ils ne doivent pas revoir l'onboarding.
UPDATE profiles
SET onboarding_done = true
WHERE onboarding_done IS NULL;
