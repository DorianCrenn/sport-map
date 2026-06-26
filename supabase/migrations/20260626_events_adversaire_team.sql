-- Ajoute le champ équipe adverse sur les événements (ex: "Seniors A" du club AS Plougastel)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS adversaire_team TEXT;
