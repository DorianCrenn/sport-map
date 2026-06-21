import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const MAX_IMAGES = 5;

export function GalleryBlockEditor({ block, onChange }: { block: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const images: string[] = block.data?.images ?? [];
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');

  function addImage() {
    const url = inputVal.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} photos`);
      return;
    }
    setError('');
    onChange({ images: [...images, url] });
    setInputVal('');
  }

  function removeImage(i: number) {
    onChange({ images: images.filter((_, idx) => idx !== i) });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addImage(); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Galerie photos · {images.length}/{MAX_IMAGES}
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--sl-border)' }}>
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
              />
              <button
                onClick={() => removeImage(i)}
                aria-label="Supprimer la photo"
                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKey}
            placeholder="URL de la photo (https://…)"
            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
          />
          <button
            onClick={addImage}
            disabled={!inputVal.trim()}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 12, fontWeight: 700, opacity: inputVal.trim() ? 1 : 0.4 }}
          >
            Ajouter
          </button>
        </div>
      )}
      {error && <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>{error}</p>}
    </div>
  );
}

export function GalleryBlockView({ block }: { block: Record<string, any> }) {
  const images: string[] = block.data?.images ?? [];
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) return null;

  const cols = images.length === 1 ? 1 : images.length <= 2 ? 2 : 3;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            aria-label={`Agrandir la photo ${i + 1}`}
            className="img-skeleton"
            style={{ display: 'block', padding: 0, border: 'none', cursor: 'zoom-in', aspectRatio: cols === 1 ? '16/9' : '1', borderRadius: 10, overflow: 'hidden' }}
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.img
              key={lightbox}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              src={images[lightbox]}
              alt={`Photo ${lightbox + 1}`}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 12, objectFit: 'contain' }}
            />

            {images.length > 1 && lightbox > 0 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(l => (l ?? 1) - 1); }}
                aria-label="Photo précédente"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            {images.length > 1 && lightbox < images.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(l => (l ?? 0) + 1); }}
                aria-label="Photo suivante"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}

            <button onClick={() => setLightbox(null)}
              aria-label="Fermer"
              style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {lightbox + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
