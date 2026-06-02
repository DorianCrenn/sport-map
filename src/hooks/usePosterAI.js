import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
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
export function usePosterAI({ aiGenerateBlocked, onTrack, clubId } = {}) {
  const [aiBgLoading,   setAiBgLoading]   = useState(false);
  const [aiBgResult,    setAiBgResult]    = useState(null);
  const [customPrompt,  setCustomPrompt]  = useState('');
  const [aiElLoading,   setAiElLoading]   = useState(false);
  const [elementPrompt, setElementPrompt] = useState('');

  /**
   * Generate a background image.
   * @param {{ dnaForBg: object, eventSport: string, onSuccess: (url: string) => void }} opts
   */
  async function generateBg({ dnaForBg, eventSport, onSuccess }) {
    if (aiGenerateBlocked || aiBgLoading) return;
    setAiBgLoading(true);
    setAiBgResult(null);
    const res = customPrompt.trim()
      ? await generateCustomBackground(customPrompt.trim())
      : await generateAIBackground(dnaForBg, eventSport, supabase, clubId);
    setAiBgResult(res);
    setAiBgLoading(false);
    if (res.imageUrl) {
      onSuccess?.(res.imageUrl);
      onTrack?.();
    }
  }

  /**
   * Generate a decorative element.
   * @param {{ accentColor: string, onSuccess: (result: { imageUrl, prompt }) => void }} opts
   */
  async function generateElement({ accentColor, onSuccess }) {
    if (aiGenerateBlocked || aiElLoading || !elementPrompt.trim()) return;
    setAiElLoading(true);
    const res = await generateCustomElement(elementPrompt.trim(), accentColor);
    setAiElLoading(false);
    if (res.imageUrl) {
      onSuccess?.(res);
      onTrack?.();
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
