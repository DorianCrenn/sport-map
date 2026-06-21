import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const LS_KEY_PREFIX = 'sl-club-dna-';
function lsKey(clubId: string | null | undefined) { return `${LS_KEY_PREFIX}${clubId ?? 'anonymous'}`; }
function lsRead(clubId: string | null | undefined): DAProfile | null {
  try { return JSON.parse(localStorage.getItem(lsKey(clubId)) ?? 'null') as DAProfile | null; }
  catch { return null; }
}
function lsWrite(clubId: string | null | undefined, profile: DAProfile | null) {
  try { localStorage.setItem(lsKey(clubId), JSON.stringify(profile)); } catch { /* ignore */ }
}

interface PaletteEntry { r: number; g: number; b: number; hex: string; }

interface DAProfile {
  colors:              { dominant: string; secondary: string; accent: string; background: string; text: string };
  palette:             string[];
  style:               string;
  styleLabel:          string;
  mood:                string[];
  templateAffinities:  string[];
  typography:          { weight: string; tracking: string };
  elements:            { hasGradients: boolean; hasGlow: boolean; hasGold: boolean };
  analysedAt:          string;
  confidence:          number;
  mockMode:            boolean;
}

type PosterDispatch = (action: { type: 'PATCH'; payload: Record<string, unknown> }) => void;

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function luminosity(r: number, g: number, b: number): number { return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function saturation(r: number, g: number, b: number): number { const max = Math.max(r, g, b) / 255; const min = Math.min(r, g, b) / 255; return max === 0 ? 0 : (max - min) / max; }
function colorTemp(r: number, g: number, b: number): number { return (r - b) / 255; }
function colorDistance(a: number[], b: number[]): number { return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2); }

async function extractColorsFromImage(dataUrl: string, sampleSize = 80): Promise<PaletteEntry[]> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize; canvas.height = sampleSize;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 128) continue;
        const key = `${r >> 5},${g >> 5},${b >> 5}`;
        if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
        buckets[key].r += r; buckets[key].g += g; buckets[key].b += b; buckets[key].count++;
      }
      const sorted = Object.values(buckets)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(b => [Math.round(b.r/b.count), Math.round(b.g/b.count), Math.round(b.b/b.count)]);
      const palette: number[][] = [];
      for (const color of sorted) {
        if (palette.every(p => colorDistance(p, color) > 40)) palette.push(color);
        if (palette.length >= 5) break;
      }
      if (palette.length === 0 && sorted.length > 0) palette.push(sorted[0]);
      resolve(palette.map(([r, g, b]) => ({ r, g, b, hex: rgbToHex(r, g, b) })));
    };
    img.onerror = () => resolve([{ r: 139, g: 92, b: 246, hex: '#8b5cf6' }]);
    img.src = dataUrl;
  });
}

const STYLE_LABELS: Record<string, string> = {
  premium: 'Premium · Or', bold: 'Bold · Dynamique', cinematic: 'Cinématique · Sombre',
  minimalist: 'Minimaliste · Épuré', street: 'Street · Urban', esport: 'Esport · Tech', classic: 'Classique · Pro',
};

function classifyStyle(palette: PaletteEntry[]): { style: string; mood: string[]; templateAffinities: string[] } {
  if (palette.length === 0) return { style: 'bold', mood: ['energique'], templateAffinities: ['impact', 'vivid'] };
  const avgLum  = palette.reduce((s, p) => s + luminosity(p.r, p.g, p.b), 0) / palette.length;
  const avgSat  = palette.reduce((s, p) => s + saturation(p.r, p.g, p.b), 0) / palette.length;
  const avgTemp = palette.reduce((s, p) => s + colorTemp(p.r, p.g, p.b), 0) / palette.length;
  let style: string, mood: string[], templateAffinities: string[];
  if      (avgLum < 0.25 && avgSat > 0.5) { style = 'bold';       mood = ['agressif', 'energique', 'dynamique']; templateAffinities = ['neon', 'impact', 'vivid', 'aurora']; }
  else if (avgLum < 0.25)                  { style = 'cinematic';  mood = ['elegant', 'premium', 'officiel'];     templateAffinities = ['cinema', 'luxe', 'prestige', 'magazine']; }
  else if (avgLum > 0.75)                  { style = 'minimalist'; mood = ['moderne', 'epure', 'editorial'];       templateAffinities = ['light', 'blanc', 'bento', 'elegant']; }
  else if (avgSat > 0.6 && avgTemp > 0.1) { style = 'street';     mood = ['urban', 'dynamique', 'energique'];    templateAffinities = ['color', 'impact', 'strike', 'fluo']; }
  else if (avgSat > 0.6)                  { style = 'esport';     mood = ['futuriste', 'tech', 'gaming'];         templateAffinities = ['neon', 'glass', 'aurora', 'vivid']; }
  else if (avgTemp > 0.08)                { style = 'premium';    mood = ['elegant', 'officiel', 'luxe'];         templateAffinities = ['luxe', 'editorial', 'prestige', 'retro']; }
  else                                     { style = 'classic';    mood = ['sobre', 'professionnel', 'classique']; templateAffinities = ['simple', 'editorial', 'magazine', 'pulse']; }
  return { style, mood, templateAffinities };
}

async function analyzeWithAPI(file: File, clubId: string | null | undefined): Promise<DAProfile> {
  const { compressImage } = await import('../lib/imageUtils.js');
  const { dataUrl } = await compressImage(file, { maxWidth: 800, quality: 0.82 });
  const { data, error } = await supabase.functions.invoke('analyze-poster-dna', {
    body: { imageBase64: dataUrl, clubId: clubId ?? null },
  }) as { data: (DAProfile & { mockFallback?: boolean; error?: string }) | null; error: { message: string } | null };
  if (error || data?.mockFallback || data?.error) throw new Error(data?.error ?? error?.message ?? 'API unavailable');
  return { ...data!, mockMode: false };
}

async function analyzeWithCanvas(file: File): Promise<DAProfile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const dataUrl = ev.target!.result as string;
        const palette = await extractColorsFromImage(dataUrl);
        const { style, mood, templateAffinities } = classifyStyle(palette);
        const sorted = [...palette].sort((a, b) => luminosity(a.r, a.g, a.b) - luminosity(b.r, b.g, b.b));
        const darkest   = sorted[0];
        const brightest = sorted[sorted.length - 1];
        const mostSat   = palette.reduce((best, p) => saturation(p.r, p.g, p.b) > saturation(best.r, best.g, best.b) ? p : best, palette[0]);
        const bgLum     = luminosity(darkest.r, darkest.g, darkest.b);
        resolve({
          colors: { dominant: palette[0]?.hex ?? '#111111', secondary: palette[1]?.hex ?? '#222222', accent: mostSat?.hex ?? palette[0]?.hex ?? '#8b5cf6', background: bgLum < 0.5 ? darkest.hex : brightest.hex, text: bgLum < 0.5 ? '#ffffff' : '#111111' },
          palette:            palette.map(p => p.hex),
          style, styleLabel:  STYLE_LABELS[style] || style, mood, templateAffinities,
          typography:         { weight: style === 'minimalist' ? 'light' : style === 'premium' ? 'bold' : 'black', tracking: style === 'minimalist' ? 'wide' : 'tight' },
          elements:           { hasGradients: style !== 'minimalist', hasGlow: ['esport', 'bold'].includes(style), hasGold: style === 'premium' },
          analysedAt:         new Date().toISOString(),
          confidence:         0.72 + Math.random() * 0.15,
          mockMode:           true,
        });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Lecture fichier impossible'));
    reader.readAsDataURL(file);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function syncToSupabase(cId: string | null | undefined, profile: DAProfile | null): Promise<void> {
  if (!cId || !UUID_RE.test(cId)) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('club_brand_kits').upsert({ club_id: cId, da_profile: profile }, { onConflict: 'club_id' });
}

export function useClubDNA(clubId: string | null | undefined) {
  const [daProfile,     setDaProfile]     = useState<DAProfile | null>(() => lsRead(clubId));
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analyzeError,  setAnalyzeError]  = useState<string | null>(null);

  useEffect(() => {
    const cached = lsRead(clubId);
    setDaProfile(cached);
    // Si pas de cache local, tenter de charger depuis club_brand_kits en DB
    if (!cached && clubId) {
      supabase.from('club_brand_kits').select('da_profile').eq('club_id', clubId).maybeSingle()
        .then(({ data }: { data: { da_profile?: DAProfile } | null }) => {
          if (data?.da_profile) { lsWrite(clubId, data.da_profile); setDaProfile(data.da_profile); }
        }, () => {});
    }
  }, [clubId]);

  const persist = useCallback((profile: DAProfile | null) => {
    setDaProfile(profile);
    lsWrite(clubId, profile);
    if (profile) syncToSupabase(clubId, profile).catch(() => {});
  }, [clubId]);

  async function analyzePoster(file: File): Promise<DAProfile> {
    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      let profile: DAProfile;
      try { profile = await analyzeWithAPI(file, clubId); }
      catch { const [p] = await Promise.all([analyzeWithCanvas(file), new Promise(r => setTimeout(r, 1800))]); profile = p as DAProfile; }
      persist(profile);
      return profile;
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Analyse impossible');
      throw err;
    } finally { setAnalyzing(false); }
  }

  function applyToStudio(dispatch: PosterDispatch): void {
    if (!daProfile) return;
    dispatch({ type: 'PATCH', payload: { accentColor: daProfile.colors.accent } });
  }

  function clearDNA(): void {
    persist(null);
    localStorage.removeItem(lsKey(clubId));
  }

  return { daProfile, analyzing, analyzeError, analyzePoster, applyToStudio, clearDNA };
}
