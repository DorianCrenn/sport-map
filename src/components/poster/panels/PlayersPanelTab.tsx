/**
 * PlayersPanelTab — Upload joueurs, bibliothèque media, gestion calques joueurs.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SLabel } from '../PosterAtoms.jsx';

const PHASE_LABELS = { compressing: 'Compression…', processing: 'Détourage IA…', thumbnail: 'Finalisation…' };

export default function PlayersPanelTab({ ps }) {
  const {
    accentColor, aiUsage, aiImportBlocked, aiImportsPerMonth, clubMedia,
    playerLayers, set, playerName, setPlayerName,
    playerFileRef, replaceFileRef, replaceTargetId,
    isDragOver, handleDragOver, handleDragLeave, handleDrop, handlePlayerFile,
    tagEditingId, setTagEditingId, tagInput, setTagInput,
    mediaSearch, setMediaSearch, mediaFavOnly, setMediaFavOnly, mediaFolder, setMediaFolder,
    addPlayerLayer, removePlayerLayer, updatePlayerLayer, club,
  } = ps;

  const [versionHistoryId, setVersionHistoryId] = useState(null);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [newFolderForAsset, setNewFolderForAsset] = useState(null);

  const { uploadPhase, uploadError, lastUpload } = clubMedia;
  const isUploading = uploadPhase && uploadPhase !== 'done' && uploadPhase !== 'error';
  const baseAssets = mediaSearch
    ? clubMedia.searchAssets(mediaSearch)
    : mediaFavOnly ? clubMedia.filterByFavorites()
    : mediaFolder ? clubMedia.filterByFolder(mediaFolder)
    : clubMedia.assets;
  const availableFolders = clubMedia.getAvailableFolders();
  const teamFolders = (club?.categories ?? []).flatMap(c => (c.teams ?? []).map(t => t.name)).filter(Boolean);
  const allFolders = [...new Set([...teamFolders, ...availableFolders])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Import quota badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 9, backgroundColor: aiImportBlocked ? 'rgba(239,68,68,0.07)' : `${accentColor}0D`, border: `1px solid ${aiImportBlocked ? 'rgba(239,68,68,0.2)' : accentColor + '25'}` }}>
        <span style={{ fontSize: 10, color: aiImportBlocked ? '#ef4444' : 'var(--sl-t3)', fontWeight: 600 }}>
          {aiImportBlocked
            ? 'Quota mensuel atteint — plan insuffisant'
            : aiImportsPerMonth === null
              ? '✓ Imports illimités'
              : aiImportsPerMonth === 0
                ? 'IA non disponible sur ce plan'
                : `${Math.max(0, aiImportsPerMonth - (aiUsage.import_count ?? 0))}/${aiImportsPerMonth} imports restants ce mois`}
        </span>
        {aiImportBlocked && <span style={{ fontSize: 9, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.06em' }}>ELITE</span>}
      </div>

      {/* Upload zone */}
      {!isUploading && uploadPhase !== 'done' && (
        <div>
          <SLabel accent={accentColor}>Ajouter un joueur</SLabel>
          <div style={{ marginBottom: 8 }}>
            <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Nom du joueur (optionnel)"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => playerFileRef.current?.click()}
            style={{
              padding: '22px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
              border: `2px dashed ${isDragOver ? accentColor : 'var(--sl-border-s)'}`,
              background: isDragOver ? `${accentColor}10` : 'var(--sl-surface)', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📸</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 3 }}>
              {isDragOver ? "Déposer l'image" : 'Déposer une photo ou cliquer'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>JPEG · PNG · max 10 Mo · fond uni recommandé</div>
          </div>
          <input ref={playerFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePlayerFile(e.target.files?.[0])} />
          <input ref={replaceFileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && replaceTargetId.current) clubMedia.replaceAsset(replaceTargetId.current, file);
              e.target.value = '';
            }} />
          {uploadError && (
            <div style={{ marginTop: 8, padding: '7px 11px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div style={{ padding: '22px 16px', borderRadius: 14, background: 'var(--sl-surface)', border: `1px solid ${accentColor}30`, textAlign: 'center' }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>
            {uploadPhase === 'compressing' ? '📦' : uploadPhase === 'processing' ? '✂️' : '🖼️'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 6 }}>{PHASE_LABELS[uploadPhase] || 'Traitement…'}</div>
          <div style={{ height: 3, borderRadius: 2, background: 'var(--sl-border)', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: accentColor, borderRadius: 2 }}
              animate={{ width: uploadPhase === 'compressing' ? '30%' : uploadPhase === 'processing' ? '75%' : '100%' }}
              transition={{ duration: 0.5 }} />
          </div>
        </div>
      )}

      {/* Upload result preview */}
      {uploadPhase === 'done' && lastUpload && (
        <div style={{ padding: '14px', borderRadius: 14, background: `${accentColor}0E`, border: `1.5px solid ${accentColor}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 60, height: 80, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sl-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={lastUpload.thumbDataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 3 }}>{lastUpload.name}</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Détourage effectué · Fond supprimé</div>
              <div style={{ fontSize: 10, color: accentColor, marginTop: 2 }}>✓ Ajouté sur l'affiche</div>
            </div>
          </div>
          <button onClick={clubMedia.resetUpload}
            style={{ width: '100%', padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'var(--sl-surface)', color: 'var(--sl-t2)', border: '1px solid var(--sl-border)' }}>
            + Autre joueur
          </button>
        </div>
      )}

      {/* Joueurs sur cette affiche */}
      {(playerLayers || []).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <SLabel accent={accentColor}>Sur cette affiche ({playerLayers.length})</SLabel>
            <button onClick={() => set('playerLayers', [])}
              style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, textDecoration: 'underline' }}>
              Tout retirer
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(playerLayers || []).map(pl => (
              <div key={pl.uid} style={{ padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <div style={{ width: 36, height: 44, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pl.thumbUrl ? <img src={pl.thumbUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 18 }}>🧍</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                    {[['Fond', false], ['Dessus', true]].map(([lbl, val]) => (
                      <button key={String(lbl)} onClick={() => updatePlayerLayer(pl.uid, { zAbove: val })}
                        style={{ padding: '3px 8px', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 800, backgroundColor: pl.zAbove === val ? accentColor : 'var(--sl-surface)', color: pl.zAbove === val ? '#fff' : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => removePlayerLayer(pl.uid)}
                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.10)', color: '#ef4444', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { key: 'scale', label: 'Taille', min: 0.3, max: 1.6, step: 0.05, format: v => `${Math.round(v * 100)}%` },
                    { key: 'opacity', label: 'Opacité', min: 0.1, max: 1, step: 0.05, format: v => `${Math.round(v * 100)}%` },
                    { key: 'x', label: 'Position', min: 5, max: 95, step: 1, format: () => '↔' },
                  ].map(({ key, label, min, max, step, format }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 38, flexShrink: 0 }}>{label}</span>
                      <input type="range" min={min} max={max} step={step} value={pl[key]}
                        onChange={e => updatePlayerLayer(pl.uid, { [key]: key === 'x' ? parseInt(e.target.value) : parseFloat(e.target.value) })}
                        style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                      <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 26, textAlign: 'right', flexShrink: 0 }}>{format(pl[key])}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                  {[{ key: 'shadow', label: '🌑 Ombre' }, { key: 'glow', label: '✨ Glow' }, { key: 'flip', label: '↔ Miroir' }].map(({ key, label }) => (
                    <button key={key} onClick={() => updatePlayerLayer(pl.uid, { [key]: !pl[key] })}
                      style={{ padding: '4px 10px', borderRadius: 7, fontSize: 9.5, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${pl[key] ? accentColor : 'var(--sl-border-s)'}`, background: pl[key] ? `${accentColor}16` : 'var(--sl-surface)', color: pl[key] ? accentColor : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bibliothèque */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SLabel>Bibliothèque ({clubMedia.assets.length}/10)</SLabel>
          <button onClick={() => setMediaFavOnly(v => !v)}
            style={{ fontSize: 9.5, color: mediaFavOnly ? '#ef4444' : 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px' }}>
            {mediaFavOnly ? '❤ Favoris' : '♡ Favoris'}
          </button>
        </div>
        {allFolders.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            <button onClick={() => setMediaFolder(null)}
              style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: `1px solid ${!mediaFolder ? accentColor : 'var(--sl-border)'}`, backgroundColor: !mediaFolder ? `${accentColor}18` : 'transparent', color: !mediaFolder ? accentColor : 'var(--sl-t3)', cursor: 'pointer' }}>
              Tous
            </button>
            {allFolders.map(f => (
              <button key={f} onClick={() => setMediaFolder(mediaFolder === f ? null : f)}
                style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: `1px solid ${mediaFolder === f ? accentColor : 'var(--sl-border)'}`, backgroundColor: mediaFolder === f ? `${accentColor}18` : 'transparent', color: mediaFolder === f ? accentColor : 'var(--sl-t3)', cursor: 'pointer' }}>
                {f}
              </button>
            ))}
          </div>
        )}
        <input value={mediaSearch} onChange={e => setMediaSearch(e.target.value)} placeholder="Rechercher un joueur…"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 12, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
        {baseAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--sl-t3)', fontSize: 11 }}>
            {clubMedia.assets.length === 0 ? 'Ajoutez votre premier joueur ci-dessus.' : 'Aucun résultat.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {baseAssets.map(asset => {
              const isTagging = tagEditingId === asset.id;
              return (
                <div key={asset.id} style={{ position: 'relative' }}>
                  <button onClick={() => addPlayerLayer(asset)}
                    style={{ width: '100%', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {asset.thumbDataUrl
                      ? <img src={asset.thumbDataUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22 }}>🧍</span>}
                  </button>
                  <button onClick={() => clubMedia.toggleFavorite(asset.id)}
                    style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.45)', color: asset.isFavorite ? '#ef4444' : 'rgba(255,255,255,0.7)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    {asset.isFavorite ? '❤' : '♡'}
                  </button>
                  <button onClick={() => clubMedia.deleteAsset(asset.id)}
                    style={{ position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.55)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                  {/* Remplacer */}
                  <button onClick={() => { replaceTargetId.current = asset.id; replaceFileRef.current?.click(); }}
                    title="Remplacer cette photo"
                    style={{ position: 'absolute', bottom: 24, left: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.7)', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>↺</button>
                  {/* Historique versions */}
                  {(asset.versions ?? []).length > 0 && (
                    <button
                      onClick={() => setVersionHistoryId(versionHistoryId === asset.id ? null : asset.id)}
                      title={`${(asset.versions ?? []).length} version(s) précédente(s)`}
                      style={{ position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.75)', color: '#fff', fontSize: 7, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      {(asset.versions ?? []).length}v
                    </button>
                  )}
                  <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'center' }}>{asset.name}</span>
                    <button onClick={() => { setTagEditingId(isTagging ? null : asset.id); setTagInput(''); }}
                      style={{ flexShrink: 0, fontSize: 9, lineHeight: 1, padding: '1px 3px', border: 'none', background: 'none', cursor: 'pointer', color: (asset.tags ?? []).length > 0 ? accentColor : 'var(--sl-t3)', opacity: 0.8 }}>🏷</button>
                  </div>
                  {/* Dossier — sélecteur + création */}
                  <div style={{ marginTop: 2 }}>
                    <select value={asset.folder ?? ''}
                      onChange={e => {
                        if (e.target.value === '__new__') { setNewFolderForAsset(asset.id); setNewFolderInput(''); }
                        else clubMedia.setFolder(asset.id, e.target.value || null);
                      }}
                      style={{ width: '100%', fontSize: 8, padding: '1px 3px', borderRadius: 4, border: `1px solid ${asset.folder ? accentColor + '60' : 'var(--sl-border)'}`, backgroundColor: asset.folder ? `${accentColor}10` : 'transparent', color: asset.folder ? accentColor : 'var(--sl-t3)', outline: 'none', cursor: 'pointer' }}>
                      <option value="">📁 Dossier…</option>
                      {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                      <option value="__new__">+ Nouveau dossier</option>
                    </select>
                    {newFolderForAsset === asset.id && (
                      <input
                        autoFocus
                        value={newFolderInput}
                        onChange={e => setNewFolderInput(e.target.value)}
                        placeholder="Nom du dossier…"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newFolderInput.trim()) {
                            clubMedia.setFolder(asset.id, newFolderInput.trim());
                            setNewFolderForAsset(null);
                            setNewFolderInput('');
                          } else if (e.key === 'Escape') { setNewFolderForAsset(null); }
                        }}
                        onBlur={() => setNewFolderForAsset(null)}
                        style={{ width: '100%', marginTop: 2, fontSize: 8, padding: '2px 4px', borderRadius: 4, border: `1px solid ${accentColor}60`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                  {/* Historique versions panel */}
                  {versionHistoryId === asset.id && (asset.versions ?? []).length > 0 && (
                    <div style={{ marginTop: 6, padding: '6px 6px 4px', borderRadius: 8, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Versions précédentes
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(asset.versions ?? []).map(v => (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 22, height: 28, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                              {v.thumbDataUrl && <img src={v.thumbDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 7, color: 'var(--sl-t3)' }}>
                                {new Date(v.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                            <button
                              onClick={() => { clubMedia.revertToVersion(asset.id, v.id); setVersionHistoryId(null); }}
                              style={{ fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 4, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}
                            >
                              Revenir
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isTagging && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 4 }}>
                        {(asset.tags ?? []).map(tag => (
                          <button key={tag} onClick={() => clubMedia.updateTags(asset.id, (asset.tags ?? []).filter(t => t !== tag))}
                            style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: `${accentColor}18`, color: accentColor, fontWeight: 600, border: `1px solid ${accentColor}40`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            {tag} <span style={{ opacity: 0.6 }}>✕</span>
                          </button>
                        ))}
                      </div>
                      <input autoFocus value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="+ tag"
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = tagInput.trim().replace(/,$/, '');
                            if (val && !(asset.tags ?? []).includes(val)) clubMedia.updateTags(asset.id, [...(asset.tags ?? []), val]);
                            setTagInput('');
                          } else if (e.key === 'Escape') { setTagEditingId(null); setTagInput(''); }
                        }}
                        style={{ width: '100%', fontSize: 9, padding: '3px 5px', borderRadius: 5, border: `1px solid ${accentColor}60`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
