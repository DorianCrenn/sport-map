// PS-IMG-002/003 — Client-side image utilities
// Compression + background removal (Remove.bg via Edge Function, canvas fallback)

// ── Compression ────────────────────────────────────────────────────────────────

export function compressImage(file, { maxWidth = 1200, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Fichier non supporté'));
    }
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('Image trop lourde (max 10 Mo)'));
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), w, h });
      };
      img.onerror = () => reject(new Error('Image illisible'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Lecture fichier échouée'));
    reader.readAsDataURL(file);
  });
}

// ── Remove.bg via Edge Function (PS-API-001) ──────────────────────────────────
// Calls Supabase Edge Function → Remove.bg API.
// Falls back to canvas mock if API key is not configured.

export async function removeBackground(dataUrl) {
  try {
    const { supabase } = await import('./supabase.js');
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64: dataUrl },
    });
    if (error || data?.mockFallback) throw new Error(data?.error ?? error?.message ?? 'API unavailable');
    return { result: data.resultBase64, apiMode: true };
  } catch {
    // Graceful fallback to canvas-based mock
    const result = await mockDetourage(dataUrl);
    return { result, apiMode: false };
  }
}

// ── Canvas-based mock (fallback when Remove.bg not configured) ────────────────
// Samples edge pixels to detect background color, then removes close matches.

export function mockDetourage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const { data } = imgData;

      // Sample background from corners + midpoints of edges
      const samplePts = [
        [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
        [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
        [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
        // Second ring (2px in)
        [2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3],
      ];

      let sumR = 0, sumG = 0, sumB = 0;
      for (const [x, y] of samplePts) {
        const idx = (y * w + x) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
      }
      const n = samplePts.length;
      const bgR = Math.round(sumR / n);
      const bgG = Math.round(sumG / n);
      const bgB = Math.round(sumB / n);

      const HARD_THRESH = 50;   // fully transparent below this distance
      const SOFT_THRESH = 85;   // feathered edge between hard and soft

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bgR;
        const dg = data[i + 1] - bgG;
        const db = data[i + 2] - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        if (dist < HARD_THRESH) {
          data[i + 3] = 0;
        } else if (dist < SOFT_THRESH) {
          const t = (dist - HARD_THRESH) / (SOFT_THRESH - HARD_THRESH);
          data[i + 3] = Math.round(255 * t * t); // quadratic ease-in for smoother edge
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Détourage impossible'));
    img.src = dataUrl;
  });
}

// ── Thumbnail generation ───────────────────────────────────────────────────────

export function generateThumbnail(dataUrl, size = 120) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(size / img.width, size / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => reject(new Error('Thumbnail impossible'));
    img.src = dataUrl;
  });
}

// ── Full pipeline ──────────────────────────────────────────────────────────────

export async function processPlayerImage(file, { onPhase } = {}) {
  onPhase?.('compressing');
  const { dataUrl: compressed, w, h } = await compressImage(file, { maxWidth: 1200, quality: 0.88 });

  onPhase?.('processing');
  const { result: processed, apiMode } = await removeBackground(compressed);
  // Add a small delay only in mock mode so the UX feels intentional
  if (!apiMode) await new Promise(r => setTimeout(r, 900));

  onPhase?.('thumbnail');
  const thumb = await generateThumbnail(processed, 120);

  return {
    originalDataUrl: compressed,
    processedDataUrl: processed,
    thumbDataUrl: thumb,
    metadata: { width: w, height: h, fileSize: file.size, mockMode: !apiMode },
  };
}
