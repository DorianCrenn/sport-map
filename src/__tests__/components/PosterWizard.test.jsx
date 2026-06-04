/**
 * Tests PosterWizard — WizardStepBar, WizardContent, WizardFooter
 * Mode Simple du PosterStudio : 3 étapes (Style → Infos → Exporter)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../components/poster/posterConstants.js', () => ({
  COLOR_PRESETS: [
    { color: '#3b82f6', label: 'Bleu' },
    { color: '#ef4444', label: 'Rouge' },
    { color: '#22d96a', label: 'Vert' },
    { color: '#f59e0b', label: 'Ambre' },
  ],
  loadSavedBgs: vi.fn(() => []),
  persistSavedBgs: vi.fn(),
  loadSavedEls: vi.fn(() => []),
  persistSavedEls: vi.fn(),
  SPORT_PALETTE: {},
  TINT_PALETTE: [],
  LAYER_BLOCKS: [],
  PANEL_TABS: [],
}));

import { WizardStepBar, WizardContent, WizardFooter } from '../../components/poster/PosterWizard.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'simple', label: 'Simple', icon: '🎨' },
  { id: 'bold',   label: 'Bold',   icon: '⚡' },
  { id: 'neon',   label: 'Néon',   icon: '🌟' },
];

function makePs(overrides = {}) {
  return {
    wizardStep: 1,
    setWizardStep: vi.fn(),
    onClose: vi.fn(),
    format: 'story',
    set: vi.fn(),
    accentColor: '#8b5cf6',
    templateId: 'simple',
    displayTemplates: TEMPLATES,
    sportColors: ['#3b82f6', '#ef4444'],
    homeName: 'FC Brest',
    awayName: 'FC Nantes',
    championship: 'Championnat Bretagne',
    isTournamentEvent: false,
    handleDownload: vi.fn(),
    downloading: false,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

// ── WizardStepBar ─────────────────────────────────────────────────────────────

describe('WizardStepBar', () => {
  it('affiche les 3 étapes', () => {
    render(<WizardStepBar ps={makePs()} />);
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Infos')).toBeInTheDocument();
    expect(screen.getByText('Exporter')).toBeInTheDocument();
  });

  it('étape 1 active quand wizardStep=1', () => {
    render(<WizardStepBar ps={makePs({ wizardStep: 1 })} />);
    const stepBtn = screen.getByRole('button', { name: /Étape 1 : Style/i });
    expect(stepBtn).toBeInTheDocument();
  });

  it('étape 2 active quand wizardStep=2', () => {
    render(<WizardStepBar ps={makePs({ wizardStep: 2 })} />);
    expect(screen.getByRole('button', { name: /Étape 2 : Infos/i })).toBeInTheDocument();
  });

  it('cliquer sur une étape passée appelle setWizardStep', async () => {
    const setWizardStep = vi.fn();
    render(<WizardStepBar ps={makePs({ wizardStep: 3, setWizardStep })} />);
    const step1Btn = screen.getByRole('button', { name: /Étape 1.*cliquer pour revenir/i });
    await userEvent.click(step1Btn);
    expect(setWizardStep).toHaveBeenCalledWith(1);
  });

  it('ne peut pas cliquer sur une étape future', async () => {
    const setWizardStep = vi.fn();
    render(<WizardStepBar ps={makePs({ wizardStep: 1, setWizardStep })} />);
    const step3Btn = screen.getByRole('button', { name: /Étape 3 : Exporter$/i });
    await userEvent.click(step3Btn);
    expect(setWizardStep).not.toHaveBeenCalled();
  });
});

// ── WizardContent — Étape 1 (Style) ──────────────────────────────────────────

describe('WizardContent — étape 1 (Style)', () => {
  it('affiche les boutons de format', () => {
    render(<WizardContent ps={makePs({ wizardStep: 1 })} />);
    expect(screen.getByRole('button', { name: /Post 4:5/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Story 9:16/i })).toBeInTheDocument();
  });

  it('affiche les templates disponibles', () => {
    render(<WizardContent ps={makePs({ wizardStep: 1 })} />);
    expect(screen.getByText('Simple')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('affiche "Style de l\'affiche" comme label', () => {
    render(<WizardContent ps={makePs({ wizardStep: 1 })} />);
    expect(screen.getByText(/Style de l'affiche/i)).toBeInTheDocument();
  });

  it('cliquer sur "Post" appelle set("format", "post")', async () => {
    const set = vi.fn();
    render(<WizardContent ps={makePs({ wizardStep: 1, format: 'story', set })} />);
    await userEvent.click(screen.getByRole('button', { name: /Post 4:5/i }));
    expect(set).toHaveBeenCalledWith('format', 'post');
  });

  it('cliquer sur un template appelle set("templateId", id)', async () => {
    const set = vi.fn();
    render(<WizardContent ps={makePs({ wizardStep: 1, set })} />);
    await userEvent.click(screen.getByText('Bold'));
    expect(set).toHaveBeenCalledWith('templateId', 'bold');
  });

  it('affiche des swatches de couleur', () => {
    render(<WizardContent ps={makePs({ wizardStep: 1 })} />);
    expect(screen.getByText(/Couleur principale/i)).toBeInTheDocument();
    const colorBtns = screen.getAllByRole('button', { name: /Couleur #/i });
    expect(colorBtns.length).toBeGreaterThan(0);
  });

  it('cliquer sur un swatch appelle set("accentColor", couleur)', async () => {
    const set = vi.fn();
    // Couleur unique absente de COLOR_PRESETS pour éviter les doublons
    render(<WizardContent ps={makePs({ wizardStep: 1, sportColors: ['#ab1234'], set })} />);
    await userEvent.click(screen.getByRole('button', { name: /Couleur #ab1234/i }));
    expect(set).toHaveBeenCalledWith('accentColor', '#ab1234');
  });
});

// ── WizardContent — Étape 2 (Infos) ──────────────────────────────────────────

describe('WizardContent — étape 2 (Infos)', () => {
  it('affiche les champs équipe pour un match', () => {
    render(<WizardContent ps={makePs({ wizardStep: 2, isTournamentEvent: false })} />);
    expect(screen.getByText(/Équipe domicile/i)).toBeInTheDocument();
    expect(screen.getByText(/Équipe visiteur/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nom du tournoi/i)).not.toBeInTheDocument();
  });

  it('affiche le champ tournoi pour un tournoi', () => {
    render(<WizardContent ps={makePs({ wizardStep: 2, isTournamentEvent: true })} />);
    expect(screen.getByText(/Nom du tournoi/i)).toBeInTheDocument();
    expect(screen.queryByText(/Équipe domicile/i)).not.toBeInTheDocument();
  });

  it('pré-remplit le champ équipe domicile', () => {
    render(<WizardContent ps={makePs({ wizardStep: 2, homeName: 'Stade Brestois' })} />);
    const input = screen.getAllByDisplayValue('Stade Brestois');
    expect(input.length).toBeGreaterThan(0);
  });

  it('modifier l\'équipe appelle set("homeName", ...)', async () => {
    const set = vi.fn();
    render(<WizardContent ps={makePs({ wizardStep: 2, homeName: 'FC Brest', set })} />);
    const input = screen.getByDisplayValue('FC Brest');
    await userEvent.clear(input);
    await userEvent.type(input, 'Stade Brestois');
    expect(set).toHaveBeenCalledWith('homeName', expect.any(String));
  });

  it('affiche le champ Compétition', () => {
    render(<WizardContent ps={makePs({ wizardStep: 2 })} />);
    expect(screen.getByText(/Compétition/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Championnat Bretagne')).toBeInTheDocument();
  });
});

// ── WizardContent — Étape 3 (Export) ─────────────────────────────────────────

describe('WizardContent — étape 3 (Export)', () => {
  it('affiche le message de succès', () => {
    render(<WizardContent ps={makePs({ wizardStep: 3 })} />);
    expect(screen.getByText(/Votre affiche est prête/i)).toBeInTheDocument();
  });

  it('affiche les instructions de partage', () => {
    render(<WizardContent ps={makePs({ wizardStep: 3 })} />);
    expect(screen.getByText(/Téléchargez-la/i)).toBeInTheDocument();
  });
});

// ── WizardFooter ──────────────────────────────────────────────────────────────

describe('WizardFooter — étape 1', () => {
  it('affiche "Annuler" à l\'étape 1', () => {
    render(<WizardFooter ps={makePs({ wizardStep: 1 })} />);
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
  });

  it('affiche "Suivant" à l\'étape 1', () => {
    render(<WizardFooter ps={makePs({ wizardStep: 1 })} />);
    expect(screen.getByRole('button', { name: /Suivant/i })).toBeInTheDocument();
  });

  it('"Annuler" appelle onClose', async () => {
    const onClose = vi.fn();
    render(<WizardFooter ps={makePs({ wizardStep: 1, onClose })} />);
    await userEvent.click(screen.getByRole('button', { name: /Annuler/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('"Suivant" appelle setWizardStep(s => s + 1)', async () => {
    const setWizardStep = vi.fn();
    render(<WizardFooter ps={makePs({ wizardStep: 1, setWizardStep })} />);
    await userEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    expect(setWizardStep).toHaveBeenCalled();
  });
});

describe('WizardFooter — étape 2', () => {
  it('affiche "Précédent" à l\'étape 2', () => {
    render(<WizardFooter ps={makePs({ wizardStep: 2 })} />);
    expect(screen.getByRole('button', { name: /Précédent/i })).toBeInTheDocument();
  });

  it('"Précédent" appelle setWizardStep(s => s - 1)', async () => {
    const setWizardStep = vi.fn();
    render(<WizardFooter ps={makePs({ wizardStep: 2, setWizardStep })} />);
    await userEvent.click(screen.getByRole('button', { name: /Précédent/i }));
    expect(setWizardStep).toHaveBeenCalled();
  });
});

describe('WizardFooter — étape 3', () => {
  it('affiche "Télécharger en PNG" à l\'étape 3', () => {
    render(<WizardFooter ps={makePs({ wizardStep: 3 })} />);
    expect(screen.getByRole('button', { name: /Télécharger en PNG/i })).toBeInTheDocument();
  });

  it('"Télécharger" appelle handleDownload', async () => {
    const handleDownload = vi.fn();
    render(<WizardFooter ps={makePs({ wizardStep: 3, handleDownload })} />);
    await userEvent.click(screen.getByRole('button', { name: /Télécharger en PNG/i }));
    expect(handleDownload).toHaveBeenCalledTimes(1);
  });

  it('"Télécharger" est désactivé si downloading=true', () => {
    render(<WizardFooter ps={makePs({ wizardStep: 3, downloading: true })} />);
    const btn = screen.getByRole('button', { name: /Téléchargement/i });
    expect(btn).toBeDisabled();
  });

  it('affiche "Téléchargement…" si downloading=true', () => {
    render(<WizardFooter ps={makePs({ wizardStep: 3, downloading: true })} />);
    expect(screen.getByText(/Téléchargement…/i)).toBeInTheDocument();
  });
});
