import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../../constants/zIndex.js';

interface MatchPosterViewerProps {
  imageUrl: string;
  title?: string;
  onClose: () => void;
}

export default function MatchPosterViewer({ imageUrl, title, onClose }: MatchPosterViewerProps) {
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'affiche-sportlink.png', { type: blob.type || 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: title ?? 'SportLink' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'affiche-sportlink.png'; a.click(); URL.revokeObjectURL(url);
      }
    } catch { /* silencieux */ } finally { setSharing(false); }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: Z.formModal, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >✕</button>

        <motion.img
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          src={imageUrl} alt={title ?? 'Affiche du match'}
          style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        />

        <div className="flex items-center gap-3 mt-5">
          <a
            href={imageUrl} download="affiche-sportlink.png"
            className="px-5 py-3 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger
          </a>
          <button
            onClick={handleShare} disabled={sharing}
            className="px-5 py-3 rounded-full bg-white/10 text-white text-sm font-bold flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>
            </svg>
            {sharing ? 'Partage…' : 'Partager'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
