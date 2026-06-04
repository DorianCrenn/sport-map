import { useReducer, useEffect, useMemo, useRef, useState } from 'react';
import { posterReducer } from '../lib/posterReducer.js';
import {
  usePosterDraft,
  usePosterLibrary,
  useFavoriteTemplates,
  useDefaultTemplate,
} from './usePosterDraft.js';
import { getBgCache, normalizeSport } from '../lib/sportBgCache.js';

export function usePosterState({ event, club, initialAccent, initialFields, initialBgSrc, isTournamentEvent, resultMode }) {
  const draftHook  = usePosterDraft(event?.id);
  const libHook    = usePosterLibrary();
  const favTplHook = useFavoriteTemplates();
  const defTplHook = useDefaultTemplate(club?.id);

  const [poster, dispatch] = useReducer(posterReducer, {
    format: 'story',
    templateId: isTournamentEvent ? 'tr-premium' : (resultMode ? 'impact' : 'simple'),
    accentColor: initialAccent,
    scoreHome: resultMode?.home !== undefined ? resultMode.home : undefined,
    scoreAway: resultMode?.away !== undefined ? resultMode.away : undefined,
    bgSrc: '', bgUrl: '', bgErr: false, bgMode: 'color',
    bgPreset: '',
    bgTint: '', bgTintOp: 0,
    overlayElements: [],
    aiOverlayElements: [],
    playerLayers: [],
    homeName: initialFields.homeName, awayName: initialFields.awayName,
    homeLogo: initialFields.homeLogo, awayLogo: initialFields.awayLogo,
    championship: initialFields.championship, tagline: initialFields.tagline,
    sponsorSrc: '', transforms: {},
  });

  const set = (key, value) => dispatch({ type: key, value });

  const [lastSavedAt,   setLastSavedAt]   = useState(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const skipAutoSave = useRef(true);

  // Draft restore on mount
  useEffect(() => {
    favTplHook.loadFromDB();
    const draft = draftHook.loadDraft();
    const sportKey = normalizeSport(event?.sport || '');
    const cachedSportBg = getBgCache(sportKey);
    if (draft?.state) {
      const merged = { ...draft.state };
      if (!merged.homeLogo && initialFields.homeLogo) merged.homeLogo = initialFields.homeLogo;
      if (!merged.awayLogo && initialFields.awayLogo) merged.awayLogo = initialFields.awayLogo;
      if (initialBgSrc) {
        merged.bgSrc = initialBgSrc;
        merged.bgMode = 'url';
        merged.bgErr = false;
        merged.bgPreset = '';
      } else if (!merged.bgSrc && !merged.bgPreset && cachedSportBg) {
        merged.bgSrc = cachedSportBg;
        merged.bgMode = 'url';
      }
      dispatch({ type: 'PATCH', payload: merged });
      setRestoredDraft(true);
      setTimeout(() => setRestoredDraft(false), 3000);
    } else {
      const defaultTpl = defTplHook.get();
      if (defaultTpl) set('templateId', defaultTpl);
      if (initialBgSrc) {
        dispatch({ type: 'PATCH', payload: { bgSrc: initialBgSrc, bgMode: 'url', bgErr: false, bgPreset: '' } });
      } else if (cachedSportBg) {
        dispatch({ type: 'PATCH', payload: { bgSrc: cachedSportBg, bgMode: 'url', bgErr: false } });
      }
    }
    setTimeout(() => { skipAutoSave.current = false; }, 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draftState = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const { bgUrl, bgErr, ...rest } = poster;
    return rest;
  }, [poster]);

  // Auto-save 2s après chaque changement
  useEffect(() => {
    if (skipAutoSave.current) return;
    const t = setTimeout(() => {
      draftHook.saveDraft(draftState);
      setLastSavedAt(new Date().toISOString());
    }, 2000);
    return () => clearTimeout(t);
  }, [draftState]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    poster, dispatch, set,
    draftState, lastSavedAt, restoredDraft,
    draftHook, libHook, favTplHook, defTplHook,
  };
}
