interface CompressResult {
  dataUrl: string;
  w: number;
  h: number;
}

export function compressImage(
  file: File,
  { maxWidth = 1200, quality = 0.85 }: { maxWidth?: number; quality?: number } = {},
): Promise<CompressResult> {
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
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), w, h });
      };
      img.onerror = () => reject(new Error('Image illisible'));
      img.src = ev.target!.result as string;
    };
    reader.onerror = () => reject(new Error('Lecture fichier échouée'));
    reader.readAsDataURL(file);
  });
}

interface RemoveBackgroundResult {
  result: string;
  apiMode: boolean;
}

export async function removeBackground(dataUrl: string): Promise<RemoveBackgroundResult> {
  try {
    const { supabase } = await import('./supabase.js');
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64: dataUrl },
    });
    if (error || (data as { mockFallback?: boolean })?.mockFallback) {
      throw new Error((data as { error?: string })?.error ?? error?.message ?? 'API unavailable');
    }
    return { result: (data as { resultBase64: string }).resultBase64, apiMode: true };
  } catch {
    const result = await mockDetourage(dataUrl);
    return { result, apiMode: false };
  }
}

export function mockDetourage(dataUrl: string): Promise<string> {
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
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const { data } = imgData;

      const samplePts: [number, number][] = [
        [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
        [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
        [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
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

      const HARD_THRESH = 50;
      const SOFT_THRESH = 85;

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bgR;
        const dg = data[i + 1] - bgG;
        const db = data[i + 2] - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        if (dist < HARD_THRESH) {
          data[i + 3] = 0;
        } else if (dist < SOFT_THRESH) {
          const t = (dist - HARD_THRESH) / (SOFT_THRESH - HARD_THRESH);
          data[i + 3] = Math.round(255 * t * t);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Détourage impossible'));
    img.src = dataUrl;
  });
}

export function generateThumbnail(dataUrl: string, size = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(size / img.width, size / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => reject(new Error('Thumbnail impossible'));
    img.src = dataUrl;
  });
}

type ProcessPhase = 'compressing' | 'processing' | 'thumbnail';

interface ProcessPlayerImageResult {
  originalDataUrl: string;
  processedDataUrl: string;
  thumbDataUrl: string;
  metadata: { width: number; height: number; fileSize: number; mockMode: boolean };
}

export async function processPlayerImage(
  file: File,
  { onPhase }: { onPhase?: (phase: ProcessPhase) => void } = {},
): Promise<ProcessPlayerImageResult> {
  onPhase?.('compressing');
  const { dataUrl: compressed, w, h } = await compressImage(file, { maxWidth: 1200, quality: 0.88 });

  onPhase?.('processing');
  const { result: processed, apiMode } = await removeBackground(compressed);
  if (!apiMode) await new Promise(r => setTimeout(r, 900));

  onPhase?.('thumbnail');
  const thumb = await generateThumbnail(processed, 120);

  return {
    originalDataUrl:  compressed,
    processedDataUrl: processed,
    thumbDataUrl:     thumb,
    metadata: { width: w, height: h, fileSize: file.size, mockMode: !apiMode },
  };
}
