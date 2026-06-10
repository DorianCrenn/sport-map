import { describe, it, expect } from 'vitest';
import { translateSupabaseError } from '../../lib/translateSupabaseError.js';

describe('translateSupabaseError', () => {
  it('traduit Invalid login credentials', () => {
    expect(translateSupabaseError({ message: 'Invalid login credentials' }))
      .toBe('Email ou mot de passe incorrect');
  });

  it('traduit Email not confirmed', () => {
    expect(translateSupabaseError({ message: 'Email not confirmed' }))
      .toBe('Confirmez votre email avant de vous connecter');
  });

  it('traduit JWT expired', () => {
    expect(translateSupabaseError({ message: 'JWT expired' }))
      .toBe('Session expirée — reconnectez-vous');
  });

  it('traduit permission denied (DB / RLS)', () => {
    expect(translateSupabaseError({ message: 'ERROR: permission denied for table events' }))
      .toBe("Vous n'avez pas les droits pour cette action");
  });

  it('traduit unique constraint', () => {
    expect(translateSupabaseError({ message: 'duplicate key value violates unique constraint' }))
      .toBe('Cette entrée existe déjà');
  });

  it('traduit Payload too large (Storage)', () => {
    expect(translateSupabaseError({ message: 'Payload too large' }))
      .toBe('Fichier trop volumineux');
  });

  it('traduit Failed to fetch (réseau)', () => {
    expect(translateSupabaseError({ message: 'Failed to fetch' }))
      .toBe('Connexion impossible — vérifiez votre réseau');
  });

  it('matching insensible à la casse', () => {
    expect(translateSupabaseError({ message: 'FAILED TO FETCH' }))
      .toBe('Connexion impossible — vérifiez votre réseau');
  });

  it('retourne le message original si pas de correspondance', () => {
    expect(translateSupabaseError({ message: 'Erreur inconnue XYZ' }))
      .toBe('Erreur inconnue XYZ');
  });

  it('accepte une string brute', () => {
    expect(translateSupabaseError('Invalid login credentials'))
      .toBe('Email ou mot de passe incorrect');
  });

  it('retourne message générique si error est null', () => {
    expect(translateSupabaseError(null))
      .toBe('Une erreur inconnue est survenue');
  });

  it('retourne message générique si error est undefined', () => {
    expect(translateSupabaseError(undefined))
      .toBe('Une erreur inconnue est survenue');
  });
});
