import { useState } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { generateAIBackground, generateCustomBackground, generateCustomElement } from '../lib/posterVariants.js';

interface BgResult { imageUrl?: string | null; error?: string; [key: string]: unknown; }
interface ElResult { imageUrl?: string | null; error?: string; [key: string]: unknown; }

interface PosterAIOptions {
  aiGenerateBlocked?: boolean;
  onTrack?:          () => void;
  clubId?:           string | null;
  onError?:          (msg: string) => void;
}

interface GenerateBgOptions {
  dnaForBg?:  unknown;
  eventSport?: string;
  onSuccess?: (url: string) => void;
}

interface GenerateElOptions {
  accentColor?: string;
  onSuccess?:   (res: ElResult) => void;
}

export function usePosterAI({ aiGenerateBlocked, onTrack, clubId, onError }: PosterAIOptions = {}) {
  const [aiBgLoading,   setAiBgLoading]   = useState(false);
  const [aiBgResult,    setAiBgResult]    = useState<BgResult | null>(null);
  const [customPrompt,  setCustomPrompt]  = useState('');
  const [aiElLoading,   setAiElLoading]   = useState(false);
  const [elementPrompt, setElementPrompt] = useState('');

  async function generateBg({ dnaForBg, eventSport, onSuccess }: GenerateBgOptions) {
    if (isDemoMode() || aiGenerateBlocked || aiBgLoading) return;
    setAiBgLoading(true);
    setAiBgResult(null);
    try {
      const res = (customPrompt.trim()
        ? await generateCustomBackground(customPrompt.trim())
        : await generateAIBackground(dnaForBg as any, eventSport, supabase, clubId)) as unknown as BgResult;
      setAiBgResult(res);
      if (res.imageUrl) { onSuccess?.(res.imageUrl); onTrack?.(); }
      else if (res.error) { onError?.('Génération IA indisponible, réessayez.'); }
    } catch {
      onError?.('Génération IA indisponible, réessayez.');
    } finally { setAiBgLoading(false); }
  }

  async function generateElement({ accentColor, onSuccess }: GenerateElOptions) {
    if (isDemoMode() || aiGenerateBlocked || aiElLoading || !elementPrompt.trim()) return;
    setAiElLoading(true);
    try {
      const res = await generateCustomElement(elementPrompt.trim(), accentColor) as unknown as ElResult;
      if (res.imageUrl) { onSuccess?.(res); onTrack?.(); }
      else if (res.error) { onError?.('Génération IA indisponible, réessayez.'); }
    } catch {
      onError?.('Génération IA indisponible, réessayez.');
    } finally { setAiElLoading(false); }
  }

  return { aiBgLoading, aiBgResult, customPrompt, setCustomPrompt, generateBg, aiElLoading, elementPrompt, setElementPrompt, generateElement };
}
