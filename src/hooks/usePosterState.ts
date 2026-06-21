import { useReducer, useEffect, useMemo, useRef, useState } from 'react';
import { posterReducer } from '../lib/posterReducer.js';
import { usePosterDraft, usePosterLibrary, useFavoriteTemplates, useDefaultTemplate } from './usePosterDraft.js';
import { getBgCache, normalizeSport } from '../lib/sportBgCache.js';
import type { PosterOverlayElement, PosterPlayerLayer } from '../types/sportlink.js';

type AnyJSON = Record<string, unknown>;

export interface PosterReducerState {
  format: string;
  templateId: string;
  accentColor: string;
  bgSrc: string;
  bgUrl: string;
  bgErr: boolean;
  bgMode: string;
  bgPreset: string;
  bgTint: string;
  bgTintOp: number;
  homeName: string;
  awayName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  championship: string;
  tagline: string;
  sponsorSrc: string;
  transforms: Record<string, any>;
  effects: Record<string, any>;
  overlayElements: PosterOverlayElement[];
  aiOverlayElements: PosterOverlayElement[];
  playerLayers: PosterPlayerLayer[];
  scoreHome?: number;
  scoreAway?: number;
  convocationPlayers: any[];
  [key: string]: unknown;
}

interface InitialFields {
  homeName?:      string;
  awayName?:      string;
  homeLogo?:      string | null;
  awayLogo?:      string | null;
  championship?:  string;
  tagline?:       string;
}

interface PosterStateOptions {
  event?:              { id?: string; sport?: string; title?: string; date?: string; city?: string } | null;
  club?:               { id?: string; name?: string } | null;
  initialAccent?:      string;
  initialFields:       InitialFields;
  initialBgSrc?:       string | null;
  isTournamentEvent?:  boolean;
  resultMode?:         { home: number; away: number } | null;
  convocationPlayers?: AnyJSON[];
}

export function usePosterState({ event, club, initialAccent, initialFields, initialBgSrc, isTournamentEvent, resultMode, convocationPlayers }: PosterStateOptions) {
  const draftHook  = usePosterDraft(event?.id);
  const libHook    = usePosterLibrary();
  const favTplHook = useFavoriteTemplates();
  const defTplHook = useDefaultTemplate(club?.id);

  const [poster, dispatch] = useReducer(posterReducer as unknown as React.Reducer<AnyJSON, AnyJSON>, {
    format: 'story',
    templateId: isTournamentEvent ? 'tr-premium' : (resultMode ? 'impact' : (convocationPlayers?.length ? 'convocation' : 'simple')),
    accentColor: initialAccent,
    scoreHome: resultMode?.home !== undefined ? resultMode.home : undefined,
    scoreAway: resultMode?.away !== undefined ? resultMode.away : undefined,
    bgSrc: '', bgUrl: '', bgErr: false, bgMode: 'color',
    bgPreset: '', bgTint: '', bgTintOp: 0,
    overlayElements: [], aiOverlayElements: [], playerLayers: [],
    homeName: initialFields.homeName, awayName: initialFields.awayName,
    homeLogo: initialFields.homeLogo, awayLogo: initialFields.awayLogo,
    championship: initialFields.championship, tagline: initialFields.tagline,
    convocationPlayers: convocationPlayers ?? [],
    sponsorSrc: '', transforms: {},
  });

  const set = (key: string, value: unknown) => dispatch({ type: key, value } as AnyJSON);

  const [lastSavedAt,   setLastSavedAt]   = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const skipAutoSave = useRef(true);

  useEffect(() => {
    favTplHook.loadFromDB();
    const draft    = draftHook.loadDraft();
    const sportKey = normalizeSport(event?.sport ?? '') as string;
    const cachedSportBg = getBgCache(sportKey) as string | null;

    if (draft?.state) {
      const merged: AnyJSON = { ...draft.state };
      if (!merged.homeLogo && initialFields.homeLogo) merged.homeLogo = initialFields.homeLogo;
      if (!merged.awayLogo && initialFields.awayLogo) merged.awayLogo = initialFields.awayLogo;
      if (initialBgSrc) { merged.bgSrc = initialBgSrc; merged.bgMode = 'url'; merged.bgErr = false; merged.bgPreset = ''; }
      else if (!merged.bgSrc && !merged.bgPreset && cachedSportBg) { merged.bgSrc = cachedSportBg; merged.bgMode = 'url'; }
      dispatch({ type: 'PATCH', payload: merged } as AnyJSON);
      setRestoredDraft(true);
      setTimeout(() => setRestoredDraft(false), 3000);
    } else {
      const defaultTpl = defTplHook.get();
      if (defaultTpl) set('templateId', defaultTpl);
      if (initialBgSrc) { dispatch({ type: 'PATCH', payload: { bgSrc: initialBgSrc, bgMode: 'url', bgErr: false, bgPreset: '' } } as AnyJSON); }
      else if (cachedSportBg) { dispatch({ type: 'PATCH', payload: { bgSrc: cachedSportBg, bgMode: 'url', bgErr: false } } as AnyJSON); }
    }
    setTimeout(() => { skipAutoSave.current = false; }, 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draftState = useMemo(() => {
    const { bgUrl: _bgUrl, bgErr: _bgErr, ...rest } = poster;
    return rest;
  }, [poster]);

  useEffect(() => {
    if (skipAutoSave.current) return;
    const t = setTimeout(() => { draftHook.saveDraft(draftState); setLastSavedAt(new Date().toISOString()); }, 2000);
    return () => clearTimeout(t);
  }, [draftState]); // eslint-disable-line react-hooks/exhaustive-deps

  return { poster: poster as PosterReducerState, dispatch, set, draftState, lastSavedAt, restoredDraft, draftHook, libHook, favTplHook, defTplHook };
}
