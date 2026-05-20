import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDynamicMeta } from '../../hooks/useDynamicMeta.js';

describe('useDynamicMeta', () => {
  beforeEach(() => {
    document.title = 'SportLink';
    document.querySelectorAll('meta[property^="og:"], meta[property^="twitter:"], meta[name="description"]')
      .forEach(el => el.remove());
  });

  it('met à jour le document.title avec le format "titre · SportLink"', () => {
    renderHook(() => useDynamicMeta({ title: 'US Brest' }));
    expect(document.title).toBe('US Brest · SportLink');
  });

  it('utilise le titre par défaut si aucun titre fourni', () => {
    renderHook(() => useDynamicMeta({}));
    expect(document.title).toBe('SportLink — Sport en Finistère');
  });

  it('crée les balises og:title et og:description', () => {
    renderHook(() => useDynamicMeta({ title: 'FC Test', description: 'Club de foot' }));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc  = document.querySelector('meta[property="og:description"]');
    expect(ogTitle?.getAttribute('content')).toBe('FC Test · SportLink');
    expect(ogDesc?.getAttribute('content')).toBe('Club de foot');
  });

  it('crée les balises og:image et og:url', () => {
    renderHook(() => useDynamicMeta({
      title: 'Test',
      image: 'https://cdn.example.com/logo.png',
      url:   'https://sportlink.fr/club/123',
    }));
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content'))
      .toBe('https://cdn.example.com/logo.png');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content'))
      .toBe('https://sportlink.fr/club/123');
  });

  it('crée les balises twitter:card et twitter:title', () => {
    renderHook(() => useDynamicMeta({ title: 'Club Rando' }));
    expect(document.querySelector('meta[property="twitter:card"]')?.getAttribute('content'))
      .toBe('summary_large_image');
    expect(document.querySelector('meta[property="twitter:title"]')?.getAttribute('content'))
      .toBe('Club Rando · SportLink');
  });

  it('met à jour la meta description', () => {
    renderHook(() => useDynamicMeta({ description: 'Description club' }));
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content'))
      .toBe('Description club');
  });

  it('restaure le titre précédent au démontage', () => {
    document.title = 'Titre original';
    const { unmount } = renderHook(() => useDynamicMeta({ title: 'Club Test' }));
    expect(document.title).toBe('Club Test · SportLink');
    unmount();
    expect(document.title).toBe('Titre original');
  });
});
