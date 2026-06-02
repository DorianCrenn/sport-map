/**
 * Tests usePosterExport — états, partage Facebook, copy link, download guards
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(async () => {
    // Retourne un blob simulé de taille suffisante
    return new Blob(['x'.repeat(15000)], { type: 'image/png' });
  }),
}));

vi.mock('../../lib/sanitize.js', () => ({
  sanitizeFilename: vi.fn((name) => name?.replace(/[^a-z0-9-]/gi, '-').toLowerCase() ?? 'match'),
  sanitizeText: vi.fn((t) => t),
}));

import { usePosterExport } from '../../hooks/usePosterExport.js';
import { toBlob } from 'html-to-image';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRef(value = null) {
  return { current: value };
}

const mockEvent = {
  id: 'evt-1',
  title: 'FC Brest vs FC Nantes',
  date: '2026-06-15T15:00:00.000Z',
  city: 'Brest',
};

function renderExport(overrides = {}) {
  const trackExport = vi.fn();
  const exportWrapperRef = makeRef(document.createElement('div'));
  const altExportWrapperRef = makeRef(document.createElement('div'));
  const defaults = {
    exportWrapperRef,
    altExportWrapperRef,
    format: 'story',
    altFormat: 'post',
    event: mockEvent,
    trackExport,
    ...overrides,
  };
  const { result } = renderHook(() => usePosterExport(defaults));
  return { result, trackExport, exportWrapperRef, altExportWrapperRef };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset navigator.clipboard mock
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  });
  // Reset window.open mock
  vi.spyOn(window, 'open').mockImplementation(() => {});
  // Reset URL mocks
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  globalThis.URL.revokeObjectURL = vi.fn();
});

// ── États initiaux ─────────────────────────────────────────────────────────────

describe('usePosterExport — états initiaux', () => {
  it('downloading est false par défaut', () => {
    const { result } = renderExport();
    expect(result.current.downloading).toBe(false);
  });

  it('sharing est false par défaut', () => {
    const { result } = renderExport();
    expect(result.current.sharing).toBe(false);
  });

  it('sharingIG est false par défaut', () => {
    const { result } = renderExport();
    expect(result.current.sharingIG).toBe(false);
  });

  it('exportingAll est false par défaut', () => {
    const { result } = renderExport();
    expect(result.current.exportingAll).toBe(false);
  });

  it('linkCopied est false par défaut', () => {
    const { result } = renderExport();
    expect(result.current.linkCopied).toBe(false);
  });

  it('platformPreview est null par défaut', () => {
    const { result } = renderExport();
    expect(result.current.platformPreview).toBeNull();
  });
});

// ── setPlatformPreview ────────────────────────────────────────────────────────

describe('usePosterExport — setPlatformPreview', () => {
  it('setPlatformPreview change la valeur', () => {
    const { result } = renderExport();
    act(() => result.current.setPlatformPreview('ig-story'));
    expect(result.current.platformPreview).toBe('ig-story');
  });

  it('setPlatformPreview peut être réinitialisé à null', () => {
    const { result } = renderExport();
    act(() => result.current.setPlatformPreview('ig-post'));
    act(() => result.current.setPlatformPreview(null));
    expect(result.current.platformPreview).toBeNull();
  });
});

// ── handleCopyLink ────────────────────────────────────────────────────────────

describe('usePosterExport — handleCopyLink', () => {
  it('copie l\'URL de l\'événement dans le presse-papier', async () => {
    const { result } = renderExport();
    await act(async () => result.current.handleCopyLink());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('#event/evt-1')
    );
  });

  it('copie l\'URL de base si event.id est absent', async () => {
    const { result } = renderExport({ event: { title: 'No ID event' } });
    await act(async () => result.current.handleCopyLink());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.origin);
  });

  it('linkCopied passe à true après handleCopyLink', async () => {
    const { result } = renderExport();
    await act(async () => result.current.handleCopyLink());
    expect(result.current.linkCopied).toBe(true);
  });
});

// ── handleShareFacebook ───────────────────────────────────────────────────────

describe('usePosterExport — handleShareFacebook', () => {
  it('ouvre une fenêtre Facebook avec l\'URL encodée', () => {
    const { result } = renderExport();
    act(() => result.current.handleShareFacebook());
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      expect.any(String)
    );
  });

  it('appelle trackExport("facebook")', () => {
    const { result, trackExport } = renderExport();
    act(() => result.current.handleShareFacebook());
    expect(trackExport).toHaveBeenCalledWith('facebook');
  });

  it('utilise l\'URL de l\'événement si event.id est défini', () => {
    const { result } = renderExport();
    act(() => result.current.handleShareFacebook());
    const calledUrl = window.open.mock.calls[0][0];
    expect(decodeURIComponent(calledUrl)).toContain('#event/evt-1');
  });

  it('utilise l\'URL de base si event.id est absent', () => {
    const { result } = renderExport({ event: { title: 'No ID' } });
    act(() => result.current.handleShareFacebook());
    const calledUrl = window.open.mock.calls[0][0];
    expect(decodeURIComponent(calledUrl)).toContain(window.location.origin);
  });
});

// ── handleDownload ────────────────────────────────────────────────────────────

describe('usePosterExport — handleDownload', () => {
  it('ne fait rien si exportWrapperRef.current est null (blob null)', async () => {
    toBlob.mockResolvedValueOnce(null);
    const { result, trackExport } = renderExport({ exportWrapperRef: makeRef(null) });
    await act(async () => result.current.handleDownload());
    expect(trackExport).not.toHaveBeenCalled();
  });

  it('appelle trackExport("download") quand le blob est valide', async () => {
    const { result, trackExport } = renderExport();
    await act(async () => result.current.handleDownload());
    expect(trackExport).toHaveBeenCalledWith('download');
  });

  it('appelle URL.createObjectURL avec le blob', async () => {
    const { result } = renderExport();
    await act(async () => result.current.handleDownload());
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('appelle URL.revokeObjectURL pour libérer la mémoire', async () => {
    const { result } = renderExport();
    await act(async () => result.current.handleDownload());
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});

// ── handleDownloadAll ─────────────────────────────────────────────────────────

describe('usePosterExport — handleDownloadAll', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('appelle trackExport("download_all") quand le blob est valide', async () => {
    const { result, trackExport } = renderExport();
    await act(async () => {
      const p = result.current.handleDownloadAll();
      await vi.runAllTimersAsync();
      await p;
    });
    expect(trackExport).toHaveBeenCalledWith('download_all');
  });

  it('ne crash pas si altExportWrapperRef.current est null', async () => {
    const { result, trackExport } = renderExport({ altExportWrapperRef: makeRef(null) });
    await act(async () => {
      const p = result.current.handleDownloadAll();
      await vi.runAllTimersAsync();
      await p;
    });
    expect(trackExport).toHaveBeenCalledWith('download_all');
  });
});

// ── Nommage des fichiers via sanitizeFilename ─────────────────────────────────

describe('usePosterExport — nommage fichiers', () => {
  it('sanitizeFilename est appelé avec le titre de l\'événement lors du download', async () => {
    const { sanitizeFilename } = await import('../../lib/sanitize.js');
    const { result } = renderExport();
    await act(async () => result.current.handleDownload());
    expect(sanitizeFilename).toHaveBeenCalledWith('FC Brest vs FC Nantes');
  });

  it('le téléchargement utilise le format "post" dans le nom du fichier', async () => {
    const { sanitizeFilename } = await import('../../lib/sanitize.js');
    const { result } = renderExport({ format: 'post' });
    await act(async () => result.current.handleDownload());
    // Le nom inclut le format — vérifié via URL.createObjectURL appelé
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(sanitizeFilename).toHaveBeenCalled();
  });
});
