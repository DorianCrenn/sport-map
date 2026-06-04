/**
 * Tests posterReducer — reducer pur du state PosterStudio
 */
import { describe, it, expect } from 'vitest';
import { posterReducer } from '../../lib/posterReducer.js';

const initialState = {
  format: 'story',
  templateId: 'simple',
  accentColor: '#22D96A',
  homeName: 'FC Brest',
  awayName: 'FC Nantes',
  bgPreset: '',
  bgSrc: '',
  bgMode: 'color',
  overlayElements: [],
  aiOverlayElements: [],
  playerLayers: [],
  transforms: {},
};

describe('posterReducer — PATCH', () => {
  it('fusionne un patch partiel sur le state', () => {
    const next = posterReducer(initialState, { type: 'PATCH', payload: { accentColor: '#3b82f6' } });
    expect(next.accentColor).toBe('#3b82f6');
    expect(next.format).toBe('story'); // non modifié
  });

  it('patch multiple propriétés simultanément', () => {
    const next = posterReducer(initialState, {
      type: 'PATCH',
      payload: { format: 'post', templateId: 'bold', bgMode: 'url' },
    });
    expect(next.format).toBe('post');
    expect(next.templateId).toBe('bold');
    expect(next.bgMode).toBe('url');
    expect(next.homeName).toBe('FC Brest'); // inchangé
  });

  it('patch vide ne modifie rien', () => {
    const next = posterReducer(initialState, { type: 'PATCH', payload: {} });
    expect(next).toEqual(initialState);
  });

  it('patch avec nouvelle clé l\'ajoute au state', () => {
    const next = posterReducer(initialState, { type: 'PATCH', payload: { newKey: 'val' } });
    expect(next.newKey).toBe('val');
  });

  it('patch ne mute pas le state original', () => {
    const original = { ...initialState };
    posterReducer(initialState, { type: 'PATCH', payload: { format: 'post' } });
    expect(initialState.format).toBe(original.format);
  });
});

describe('posterReducer — RESET', () => {
  it('remplace entièrement le state', () => {
    const newState = { format: 'post', templateId: 'neon' };
    const next = posterReducer(initialState, { type: 'RESET', payload: newState });
    expect(next).toEqual(newState);
    expect(next.homeName).toBeUndefined(); // ancienne prop perdue
  });
});

describe('posterReducer — mise à jour directe par clé', () => {
  it('met à jour format', () => {
    const next = posterReducer(initialState, { type: 'format', value: 'post' });
    expect(next.format).toBe('post');
    expect(next.templateId).toBe('simple'); // inchangé
  });

  it('met à jour templateId', () => {
    const next = posterReducer(initialState, { type: 'templateId', value: 'luxe' });
    expect(next.templateId).toBe('luxe');
  });

  it('met à jour overlayElements (tableau)', () => {
    const elements = [{ uid: 'el-1', type: 'star' }];
    const next = posterReducer(initialState, { type: 'overlayElements', value: elements });
    expect(next.overlayElements).toEqual(elements);
  });

  it('met à jour playerLayers (tableau)', () => {
    const layers = [{ uid: 'pl-1', name: 'Kevin' }];
    const next = posterReducer(initialState, { type: 'playerLayers', value: layers });
    expect(next.playerLayers).toEqual(layers);
  });

  it('met à jour transforms (objet)', () => {
    const transforms = { title: { dx: 10, dy: 5 } };
    const next = posterReducer(initialState, { type: 'transforms', value: transforms });
    expect(next.transforms).toEqual(transforms);
  });

  it('met à jour accentColor', () => {
    const next = posterReducer(initialState, { type: 'accentColor', value: '#ff0000' });
    expect(next.accentColor).toBe('#ff0000');
  });

  it('met à jour homeName', () => {
    const next = posterReducer(initialState, { type: 'homeName', value: 'Stade Brestois' });
    expect(next.homeName).toBe('Stade Brestois');
  });

  it('ne mute pas le state original', () => {
    const next = posterReducer(initialState, { type: 'format', value: 'landscape' });
    expect(initialState.format).toBe('story');
    expect(next).not.toBe(initialState);
  });
});

describe('posterReducer — séquences d\'actions', () => {
  it('enchaîne plusieurs actions correctement', () => {
    let state = initialState;
    state = posterReducer(state, { type: 'format', value: 'post' });
    state = posterReducer(state, { type: 'PATCH', payload: { accentColor: '#8b5cf6', bgMode: 'url' } });
    state = posterReducer(state, { type: 'templateId', value: 'impact' });
    expect(state.format).toBe('post');
    expect(state.accentColor).toBe('#8b5cf6');
    expect(state.bgMode).toBe('url');
    expect(state.templateId).toBe('impact');
    expect(state.homeName).toBe('FC Brest'); // inchangé
  });
});
