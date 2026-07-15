import { useRef, useState } from 'react';
import { useEventPhotos } from '../hooks/useEventPhotos.js';

interface Photo { id: string | number; url: string; caption?: string | null; user_id?: string; }
interface PhotoCardProps { photo: Photo; canDelete: boolean; onDelete: (id: string | number) => void; onUseBg?: (url: string) => void; }

function PhotoCard({ photo, canDelete, onDelete, onUseBg }: PhotoCardProps) {
  const [showActions, setShowActions] = useState(false);
  return (
    <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 'var(--sl-radius-lg)', overflow: 'hidden', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', flexShrink: 0, width: 140 }} onClick={() => setShowActions(v => !v)}>
      <img src={photo.url} alt={photo.caption ?? 'Photo'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {showActions && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 }}>
          {onUseBg && <button onClick={e => { e.stopPropagation(); onUseBg(photo.url); setShowActions(false); }} style={{ width: '100%', padding: '7px 0', borderRadius: 'var(--sl-radius-md)', border: 'none', cursor: 'pointer', backgroundColor: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700 }}>Utiliser comme fond</button>}
          {canDelete && <button onClick={e => { e.stopPropagation(); onDelete(photo.id); }} style={{ width: '100%', padding: '7px 0', borderRadius: 'var(--sl-radius-md)', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700 }}>Supprimer</button>}
          <button onClick={e => { e.stopPropagation(); setShowActions(false); }} style={{ width: '100%', padding: '7px 0', borderRadius: 'var(--sl-radius-md)', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }}>Annuler</button>
        </div>
      )}
    </div>
  );
}

interface EventPhotoGalleryProps { eventId: string | number; clubId: string | null; currentUserId?: string | null; canUpload?: boolean; onUseAsBg?: (url: string) => void; }

export default function EventPhotoGallery({ eventId, clubId, currentUserId, canUpload, onUseAsBg }: EventPhotoGalleryProps) {
  const { photos, loading, uploading, uploadPhoto, deletePhoto, maxPhotos } = useEventPhotos(String(eventId));
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      await (uploadPhoto as unknown as (f: File, clubId: string | null) => Promise<void>)(file, clubId);
    }
  }

  if (loading) return null;
  if ((photos as Photo[]).length === 0 && !canUpload) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Photos ({(photos as Photo[]).length}/{maxPhotos as number})</div>
        {canUpload && (photos as Photo[]).length < (maxPhotos as number) && (
          <button onClick={() => inputRef.current?.click()} disabled={uploading as boolean} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--sl-radius-md)', border: 'none', cursor: (uploading as boolean) ? 'default' : 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', opacity: (uploading as boolean) ? 0.5 : 1 }}>{uploading ? 'Envoi…' : '+ Photo'}</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      {(photos as Photo[]).length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          {(photos as Photo[]).map(p => <PhotoCard key={p.id} photo={p} canDelete={p.user_id === currentUserId} onDelete={deletePhoto as (id: any) => void} onUseBg={onUseAsBg} />)}
        </div>
      )}
      {(photos as Photo[]).length === 0 && canUpload && (
        <button onClick={() => inputRef.current?.click()} disabled={uploading as boolean} style={{ width: '100%', padding: '16px 0', borderRadius: 'var(--sl-radius-xl)', border: '1.5px dashed var(--sl-border)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--sl-t3)' }}>{uploading ? 'Envoi en cours…' : 'Ajouter des photos post-match'}</button>
      )}
    </div>
  );
}
