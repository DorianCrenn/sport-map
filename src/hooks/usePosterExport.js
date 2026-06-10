import { useState } from 'react';
import { toBlob } from 'html-to-image';
import { sanitizeFilename } from '../lib/sanitize.js';

/**
 * usePosterExport — Logique d'export et de partage PosterStudio.
 *
 * Extrait de PosterStudio.jsx. Gère : download PNG, partage WA/IG/FB, copy link, export dual-format.
 * trackAIGeneration / trackAIImport restent dans PosterStudio car référencés par usePosterAI.
 *
 * @param {object} options
 * @param {React.RefObject} options.exportWrapperRef    — nœud HD story/post courant
 * @param {React.RefObject} options.altExportWrapperRef — nœud HD format alternatif
 * @param {string} options.format     — 'story' | 'post'
 * @param {string} options.altFormat  — format alternatif
 * @param {object} options.event
 * @param {string} options.event.id
 * @param {string} options.event.title
 * @param {string} options.event.date
 * @param {string} options.event.city
 * @param {Function} options.trackExport — callback(channel) fourni par PosterStudio
 */
export function usePosterExport({ exportWrapperRef, altExportWrapperRef, format, altFormat, event, trackExport, onExportError }) {
  const [downloading,     setDownloading]     = useState(false);
  const [sharing,         setSharing]         = useState(false);
  const [sharingIG,       setSharingIG]       = useState(false);
  const [exportingAll,    setExportingAll]    = useState(false);
  const [linkCopied,      setLinkCopied]      = useState(false);
  const [platformPreview, setPlatformPreview] = useState(null);

  async function getBlob() {
    const node = exportWrapperRef.current;
    if (!node) return null;
    try {
      let blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
      // Safari iOS peut retourner un blob vide — retry après délai
      if (!blob || blob.size < 10_000) {
        await new Promise(r => setTimeout(r, 350));
        blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
      }
      return blob;
    } catch {
      return null;
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await getBlob();
      if (!blob) {
        onExportError?.('Export impossible — mémoire insuffisante ou navigateur incompatible.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
      trackExport('download');
    } finally { setTimeout(() => setDownloading(false), 900); }
  }

  async function handleShareWhatsApp() {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const d = new Date(event?.date);
      const eventUrl = event?.id
        ? `${window.location.origin}${window.location.pathname}#event/${event.id}`
        : window.location.origin;
      const text = `🏟️ *${event?.title || 'Match'}*\n📅 ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event?.city ?? ''}\n\n${eventUrl}`;
      const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: event?.title });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
      trackExport('whatsapp');
    } catch { /* erreur partage — silencieux */ } finally { setSharing(false); }
  }

  async function handleShareIG() {
    setSharingIG(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: event?.title ?? 'SportLink' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `affiche-sportlink-${format}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      trackExport('instagram');
    } catch { /* erreur partage — silencieux */ } finally { setSharingIG(false); }
  }

  function handleShareFacebook() {
    const eventUrl = event?.id
      ? `${window.location.origin}${window.location.pathname}#event/${event.id}`
      : window.location.origin;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
      '_blank', 'noopener,noreferrer,width=600,height=400'
    );
    trackExport('facebook');
  }

  async function handleDownloadAll() {
    setExportingAll(true);
    try {
      const blob1 = await getBlob();
      if (!blob1) { onExportError?.('Export impossible — mémoire insuffisante ou navigateur incompatible.'); return; }
      if (blob1) {
        const url1 = URL.createObjectURL(blob1);
        const a1 = document.createElement('a');
        a1.href = url1;
        a1.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${format}.png`;
        a1.click();
        URL.revokeObjectURL(url1);
      }
      await new Promise(r => setTimeout(r, 400));
      const altNode = altExportWrapperRef.current;
      if (altNode) {
        let blob2 = await toBlob(altNode, { pixelRatio: 3, cacheBust: true });
        if (!blob2 || blob2.size < 10_000) {
          await new Promise(r => setTimeout(r, 350));
          blob2 = await toBlob(altNode, { pixelRatio: 3, cacheBust: true });
        }
        if (blob2) {
          const url2 = URL.createObjectURL(blob2);
          const a2 = document.createElement('a');
          a2.href = url2;
          a2.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${altFormat}.png`;
          a2.click();
          URL.revokeObjectURL(url2);
        }
      }
      trackExport('download_all');
    } finally { setTimeout(() => setExportingAll(false), 900); }
  }

  function handleCopyLink() {
    const url = event?.id
      ? `${window.location.origin}${window.location.pathname}#event/${event.id}`
      : window.location.origin;
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return {
    // States
    downloading, sharing, sharingIG, exportingAll, linkCopied,
    platformPreview, setPlatformPreview,
    // Handlers
    handleDownload, handleShareWhatsApp, handleShareIG,
    handleShareFacebook, handleDownloadAll, handleCopyLink,
  };
}
