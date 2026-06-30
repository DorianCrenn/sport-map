import { useState } from 'react';
import { toBlob } from 'html-to-image';
import { sanitizeFilename } from '../lib/sanitize.js';

interface EventRef { id?: string; title?: string; date?: string; city?: string; }

interface PosterExportOptions {
  exportWrapperRef:    React.RefObject<HTMLElement | null>;
  altExportWrapperRef: React.RefObject<HTMLElement | null>;
  format:    string;
  altFormat: string;
  event?:    EventRef;
  trackExport:  (channel: string) => void;
  onExportError?: (msg: string) => void;
}

export function usePosterExport({ exportWrapperRef, altExportWrapperRef, format, altFormat, event, trackExport, onExportError }: PosterExportOptions) {
  const [downloading,     setDownloading]     = useState(false);
  const [sharing,         setSharing]         = useState(false);
  const [sharingIG,       setSharingIG]       = useState(false);
  const [exportingAll,    setExportingAll]    = useState(false);
  const [linkCopied,      setLinkCopied]      = useState(false);
  const [platformPreview, setPlatformPreview] = useState<string | null>(null);

  async function getBlob(): Promise<Blob | null> {
    const node = exportWrapperRef.current;
    if (!node) return null;
    try {
      let blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
      if (!blob || blob.size < 10_000) { await new Promise(r => setTimeout(r, 350)); blob = await toBlob(node, { pixelRatio: 3, cacheBust: true }); }
      return blob;
    } catch { return null; }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await getBlob();
      if (!blob) { onExportError?.('Export impossible — mémoire insuffisante ou navigateur incompatible.'); return; }
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a'); a.href = url; a.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${format}.png`; a.click(); URL.revokeObjectURL(url);
      trackExport('download');
    } finally { setTimeout(() => setDownloading(false), 900); }
  }

  async function handleShareWhatsApp() {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const d         = new Date(event?.date ?? '');
      const eventUrl  = event?.id ? `${window.location.origin}${window.location.pathname}#event/${event.id}` : window.location.origin;
      const text      = `🏟️ *${event?.title || 'Match'}*\n📅 ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event?.city ?? ''}\n\n${eventUrl}`;
      const file      = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text, title: event?.title }); }
      else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
      trackExport('whatsapp');
    } catch { /* silencieux */ } finally { setSharing(false); }
  }

  async function handleShareIG() {
    setSharingIG(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: event?.title ?? 'SportLink' }); }
      else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `affiche-sportlink-${format}.png`; a.click(); URL.revokeObjectURL(url); }
      trackExport('instagram');
    } catch { /* silencieux */ } finally { setSharingIG(false); }
  }

  function handleShareFacebook() {
    const eventUrl = event?.id ? `${window.location.origin}${window.location.pathname}#event/${event.id}` : window.location.origin;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank', 'noopener,noreferrer,width=600,height=400');
    trackExport('facebook');
  }

  async function handleDownloadAll() {
    setExportingAll(true);
    try {
      const blob1 = await getBlob();
      if (!blob1) { onExportError?.('Export impossible — mémoire insuffisante ou navigateur incompatible.'); return; }
      const url1 = URL.createObjectURL(blob1); const a1 = document.createElement('a'); a1.href = url1; a1.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${format}.png`; a1.click(); URL.revokeObjectURL(url1);
      await new Promise(r => setTimeout(r, 400));
      const altNode = altExportWrapperRef.current;
      if (altNode) {
        let blob2 = await toBlob(altNode, { pixelRatio: 3, cacheBust: true });
        if (!blob2 || blob2.size < 10_000) { await new Promise(r => setTimeout(r, 350)); blob2 = await toBlob(altNode, { pixelRatio: 3, cacheBust: true }); }
        if (blob2) { const url2 = URL.createObjectURL(blob2); const a2 = document.createElement('a'); a2.href = url2; a2.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${altFormat}.png`; a2.click(); URL.revokeObjectURL(url2); }
      }
      trackExport('download_all');
    } finally { setTimeout(() => setExportingAll(false), 900); }
  }

  function handleCopyLink() {
    const url = event?.id ? `${window.location.origin}${window.location.pathname}#event/${event.id}` : window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch((e: unknown) => {
      console.warn('[usePosterExport] clipboard write failed:', e);
    });
  }

  return { downloading, sharing, sharingIG, exportingAll, linkCopied, platformPreview, setPlatformPreview, handleDownload, handleShareWhatsApp, handleShareIG, handleShareFacebook, handleDownloadAll, handleCopyLink };
}
