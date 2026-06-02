import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Canvas + Image mocks ──────────────────────────────────────────────────────

function makeImageMock({ failLoad = false } = {}) {
  return class MockImage {
    constructor() {
      this._src = '';
      this.width = 100;
      this.height = 100;
    }
    set src(val) {
      this._src = val;
      setTimeout(() => {
        if (failLoad) this.onerror?.(new Error('load failed'));
        else this.onload?.();
      }, 0);
    }
    get src() { return this._src; }
  };
}

function makeCanvasMock({ pixelData } = {}) {
  const data = pixelData ?? new Uint8ClampedArray(100 * 100 * 4).fill(200); // grey image
  const ctx = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data, width: 100, height: 100 })),
    putImageData: vi.fn(),
  };
  return {
    canvas: { width: 0, height: 0, getContext: () => ctx, toDataURL: () => 'data:image/png;base64,MOCK' },
    ctx,
  };
}

let originalCreateElement;
let originalImage;

beforeEach(() => {
  originalCreateElement = document.createElement.bind(document);
  originalImage = globalThis.Image;
});

afterEach(() => {
  document.createElement = originalCreateElement;
  globalThis.Image = originalImage;
  vi.restoreAllMocks();
});

// ── compressImage ─────────────────────────────────────────────────────────────

import { compressImage } from '../../lib/imageUtils.js';

describe('compressImage — validation entrée', () => {
  it('rejette si le fichier est null', async () => {
    await expect(compressImage(null)).rejects.toThrow('non supporté');
  });

  it('rejette si le type n\'est pas image/*', async () => {
    const file = new File(['text'], 'doc.txt', { type: 'text/plain' });
    await expect(compressImage(file)).rejects.toThrow('non supporté');
  });

  it('rejette si le fichier dépasse 10 Mo', async () => {
    const bigContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([bigContent], 'big.jpg', { type: 'image/jpeg' });
    await expect(compressImage(file)).rejects.toThrow('trop lourde');
  });

  it('rejette si l\'image ne charge pas', async () => {
    globalThis.Image = makeImageMock({ failLoad: true });
    const { canvas } = makeCanvasMock();
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return originalCreateElement(tag);
    });

    const file = new File(['fakeimg'], 'img.jpg', { type: 'image/jpeg' });
    await expect(compressImage(file)).rejects.toThrow();
  });

  it('résout avec un dataUrl pour une image valide', async () => {
    globalThis.Image = makeImageMock();
    const { canvas } = makeCanvasMock();
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return originalCreateElement(tag);
    });

    const file = new File(['fakeimg'], 'img.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file);
    expect(result.dataUrl).toContain('data:');
    expect(typeof result.w).toBe('number');
    expect(typeof result.h).toBe('number');
  });
});

// ── mockDetourage ─────────────────────────────────────────────────────────────

import { mockDetourage } from '../../lib/imageUtils.js';

describe('mockDetourage', () => {
  it('rejette si l\'image ne charge pas', async () => {
    globalThis.Image = makeImageMock({ failLoad: true });
    await expect(mockDetourage('data:image/png;base64,x')).rejects.toThrow('Détourage impossible');
  });

  it('résout un PNG avec fond transparent pour une image unie', async () => {
    globalThis.Image = makeImageMock();

    // Image entièrement grise — le fond gris doit être détouré
    const grayPixels = new Uint8ClampedArray(10 * 10 * 4);
    for (let i = 0; i < grayPixels.length; i += 4) {
      grayPixels[i] = 200; grayPixels[i + 1] = 200; grayPixels[i + 2] = 200; grayPixels[i + 3] = 255;
    }
    const { canvas, ctx } = makeCanvasMock({ pixelData: grayPixels });
    ctx.getImageData.mockReturnValue({ data: grayPixels });
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return originalCreateElement(tag);
    });

    const result = await mockDetourage('data:image/png;base64,test');
    expect(result).toContain('data:image/png');
  });

  it('met les pixels proches du fond à alpha=0 — logique de distance pure', () => {
    // Test de la logique de distance couleur sans canvas :
    // dist = sqrt(dr² + dg² + db²). Si < 50 → alpha=0. Si >= 85 → alpha=255.
    const HARD = 50, SOFT = 85;

    function calcAlpha(r, g, b, bgR, bgG, bgB) {
      const dr = r - bgR, dg = g - bgG, db = b - bgB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < HARD) return 0;
      if (dist >= SOFT) return 255;
      const t = (dist - HARD) / (SOFT - HARD);
      return Math.round(255 * t * t);
    }

    // Pixel identique au fond → transparent
    expect(calcAlpha(200, 200, 200, 200, 200, 200)).toBe(0);
    // Pixel très proche du fond → transparent
    expect(calcAlpha(210, 205, 198, 200, 200, 200)).toBe(0);
    // Pixel rouge vif sur fond blanc → opaque
    expect(calcAlpha(220, 30, 30, 255, 255, 255)).toBe(255);
    // Pixel dans la zone de feathering : dist = sqrt(55²) = 55 → entre 50 et 85
    const alpha = calcAlpha(255, 200, 200, 200, 200, 200);
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(255);
  });
});

// ── removeBackground ──────────────────────────────────────────────────────────

import { removeBackground } from '../../lib/imageUtils.js';

describe('removeBackground', () => {
  it('retourne apiMode=false en fallback canvas si l\'Edge Function échoue', async () => {
    // Mock supabase.functions.invoke pour simuler une erreur
    vi.doMock('../../lib/supabase.js', () => ({
      supabase: {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      },
    }));

    globalThis.Image = makeImageMock();
    const { canvas } = makeCanvasMock();
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return originalCreateElement(tag);
    });

    const result = await removeBackground('data:image/png;base64,test');
    expect(result.apiMode).toBe(false);
    expect(result.result).toContain('data:');
  });
});
