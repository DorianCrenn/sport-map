import { useState } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { generateAIBackground, generateCustomBackground, generateCustomElement } from '../lib/posterVariants.js';

/**
 * Manages async AI state for PosterStudio.
 * Handles loading flags, results, and prompt inputs.
 * Saved BGs/elements remain in PosterStudio (too many JSX usages to safely move).
 *
 * @param {object} opts
 * @param {boolean}  opts.aiGenerateBlocked — true when monthly quota exceeded
 * @param {function} [opts.onTrack]         — called after each successful generation (analytics)
 */
export function usePosterAI({ aiGenerateBlocked, onTrack, clubId, onError } = {}) {
  const [aiBgLoading,   setAiBgLoading]   = useState(false);
  const [aiBgResult,    setAiBgResult]    = useState(null);
  const [customPrompt,  setCustomPrompt]  = useState('');
  const [aiElLoading,   setAiElLoading]   = useState(false);
  const [elementPrompt, setElementPrompt] = useState('');

  async function generateBg({ dnaForBg, eventSport, onSuccess }) {
    if (isDemoMode() || aiGenerateBlocked || aiBgLoading) return;
    setAiBgLoading(true);
    setAiBgResult(null);
    try {
      const res = customPrompt.trim()
        ? await generateCustomBackground(customPrompt.trim())
        : await generateAIBackground(dnaForBg, eventSport, supabase, clubId);
      setAiBgResult(res);
      if (res.imageUrl) {
        onSuccess?.(res.imageUrl);
        onTrack?.();
      } else if (res.error) {
        onError?.('Génération IA indisponible, réessayez.');
      }
    } catch {
      onError?.('Génération IA indisponible, réessayez.');
    } finally {
      setAiBgLoading(false);
    }
  }

  async function generateElement({ accentColor, onSuccess }) {
    if (isDemoMode() || aiGenerateBlocked || aiElLoading || !elementPrompt.trim()) return;
    setAiElLoading(true);
    try {
      const res = await generateCustomElement(elementPrompt.trim(), accentColor);
      if (res.imageUrl) {
        onSuccess?.(res);
        onTrack?.();
      } else if (res.error) {
        onError?.('Génération IA indisponible, réessayez.');
      }
    } catch {
      onError?.('Génération IA indisponible, réessayez.');
    } finally {
      setAiElLoading(false);
    }
  }

  return {
    aiBgLoading, aiBgResult,
    customPrompt, setCustomPrompt,
    generateBg,
    aiElLoading,
    elementPrompt, setElementPrompt,
    generateElement,
  };
}
