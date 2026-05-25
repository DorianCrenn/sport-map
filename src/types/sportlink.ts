// ─────────────────────────────────────────────────────────────────────────────
// sportlink.ts — Types TypeScript centraux (migration progressive depuis JS)
// Premier fichier TS du projet : chaque nouveau composant ou hook migré ici.
// ─────────────────────────────────────────────────────────────────────────────

// ── Données brutes issues du calendrier importé ───────────────────────────────

/**
 * Un match tel qu'il est stocké dans localStorage sous `club-page-{id}`,
 * dans un bloc de type "matches". Les chaînes sont souvent brutes/sales
 * (ex: "U15 REGIONAL 2 PLOUVORN AG / REZE FC").
 */
export interface RawMatch {
  id: string;
  /** Format ISO partiel : "2026-05-30" */
  date: string;
  /** Vrai = match à domicile */
  isHome?: boolean;
  /** Nom de l'adversaire (brut, peut contenir la division) */
  opponent?: string;
  /** Format HH:MM ex: "15:00" */
  time?: string;
  venue?: string;
  competition?: string;
  /** Nom complet de l'équipe tel qu'importé du district */
  teamName?: string;
  /** Catégorie lisible : "Senior A", "U18", "Féminines"… */
  category?: string;
  scoreHome?: number | null;
  scoreAway?: number | null;
  publishedOnMap?: boolean;
}

// ── Club ──────────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  sport: string;
  city?: string;
  logo_url?: string;
  logoUrl?: string;
  primaryColor?: string;
}

// ── Poster ────────────────────────────────────────────────────────────────────

/** Référence à une équipe dans le contexte d'une affiche */
export interface PosterTeam {
  name: string;
  logo?: string;
}

/**
 * Objet propagé en props à chaque composant template (TplSimple, TplNeon…).
 * C'est ce que PosterRenderer spread via `<Component {...data} />`.
 */
export interface PosterData {
  event: {
    date: string;
    sport: string;
    venue?: string;
    city?: string;
    homeOrAway?: 'home' | 'away';
  };
  homeTeam: PosterTeam;
  awayTeam: PosterTeam;
  championship?: string;
  tagline?: string;
  accentColor?: string;
}

/**
 * Match du week-end entièrement résolu, prêt à être affiché et exporté.
 * Construit par `useWeekendPosters` depuis les données brutes + club.
 */
export interface WeekendMatch {
  id: string;
  clubId: string;
  /** Étiquette lisible : "Senior A", "U18 Féminines"… */
  category: string;
  homeTeam: PosterTeam;
  awayTeam: PosterTeam;
  date: Date;
  /** Format HH:MM */
  time?: string;
  venue?: string;
  competition: string;
  sport: string;
  /** ID du template à utiliser (ex: "simple", "neon", "cinema") */
  templateId: string;
  /** Prêt à être spreaded dans PosterRenderer data={...} */
  posterData: PosterData;
}

// ── Export ────────────────────────────────────────────────────────────────────

export type ExportAction = 'download' | 'share';
export type ExportStatus = 'idle' | 'generating' | 'done' | 'error';
