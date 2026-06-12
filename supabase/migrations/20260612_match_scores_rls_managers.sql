-- ─── Droits d'écriture match_scores étendus aux managers/editors ─────────────
-- Les coaches (club_managers.role IN 'manager','editor') peuvent mettre à jour
-- le statut et le score d'un match (live score, saisie post-match).

DROP POLICY IF EXISTS "match_scores_write" ON public.match_scores;

CREATE POLICY "match_scores_write"
  ON public.match_scores FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(
      (SELECT e.club_id FROM public.events e WHERE e.id = match_scores.event_id),
      ARRAY['manager', 'editor']
    )
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(
      (SELECT e.club_id FROM public.events e WHERE e.id = match_scores.event_id),
      ARRAY['manager', 'editor']
    )
  );

-- Activer Realtime sur match_scores pour le live score et le Multiplex
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_scores;
