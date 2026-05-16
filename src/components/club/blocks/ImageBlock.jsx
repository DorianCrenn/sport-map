import { useRef } from 'react';

const FIT_OPTIONS = [
  { value: 'cover',   label: 'Remplir' },
  { value: 'contain', label: 'Adapter' },
];

const RATIO_OPTIONS = [
  { value: '16/9',  label: '16:9' },
  { value: '4/3',   label: '4:3' },
  { value: '1/1',   label: '1:1' },
  { value: 'auto',  label: 'Auto' },
];

export default function ImageBlock({ data, isEditing, onUpdate }) {
  const { src = '', caption = '', fit = 'cover', ratio = '16/9' } = data;
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Image trop lourde (max 4 Mo). Utilisez plutôt une URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => onUpdate({ src: ev.target.result });
    reader.readAsDataURL(file);
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        {/* Preview */}
        {src ? (
          <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: ratio !== 'auto' ? ratio : undefined, maxHeight: 180 }}>
            <img src={src} alt="preview" className="w-full h-full" style={{ objectFit: fit }} />
            <button
              onClick={() => onUpdate({ src: '' })}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-xs text-gray-400">Aucune image sélectionnée</span>
          </div>
        )}

        {/* Upload + URL */}
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex-1 justify-center"
            style={{ color: '#0F1E3A' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Choisir un fichier
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">ou URL</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <input
          type="url"
          value={src.startsWith('data:') ? '' : src}
          onChange={e => onUpdate({ src: e.target.value })}
          placeholder="https://exemple.com/image.jpg"
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
        />

        {/* Légende */}
        <input
          type="text"
          value={caption}
          onChange={e => onUpdate({ caption: e.target.value })}
          placeholder="Légende (optionnel)…"
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
        />

        {/* Options */}
        <div className="flex gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Format</p>
            <div className="flex gap-1">
              {FIT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => onUpdate({ fit: opt.value })}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={fit === opt.value ? { backgroundColor:'#0F1E3A', color:'white' } : { backgroundColor:'#f1f5f9', color:'#64748b' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Ratio</p>
            <div className="flex gap-1 flex-wrap">
              {RATIO_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => onUpdate({ ratio: opt.value })}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={ratio === opt.value ? { backgroundColor:'#0F1E3A', color:'white' } : { backgroundColor:'#f1f5f9', color:'#64748b' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!src) return (
    <div className="flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-sm py-8">
      Aucune image
    </div>
  );

  return (
    <figure className="m-0">
      <div className="rounded-xl overflow-hidden img-skeleton" style={{ aspectRatio: ratio !== 'auto' ? ratio : undefined }}>
        <img src={src} alt={caption || ''} loading="lazy" className="w-full h-full" style={{ objectFit: fit }} />
      </div>
      {caption && (
        <figcaption className="text-xs text-gray-400 text-center mt-2 italic">{caption}</figcaption>
      )}
    </figure>
  );
}
