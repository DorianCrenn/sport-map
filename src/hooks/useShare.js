import { useCallback } from 'react';

export function useShare() {
  const share = useCallback(async ({ title, text, url }) => {
    const fullUrl = url || window.location.href;
    const shareData = { title, text, url: fullUrl };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'native' };
      } catch (err) {
        if (err.name === 'AbortError') return { success: false, method: 'native' };
      }
    }

    // Clipboard fallback: copy full text + URL so the paste contains event details
    const clipboardText = text ? `${text}\n${fullUrl}` : fullUrl;
    try {
      await navigator.clipboard.writeText(clipboardText);
      return { success: true, method: 'clipboard' };
    } catch {
      return { success: false, method: 'none' };
    }
  }, []);

  return { share };
}
