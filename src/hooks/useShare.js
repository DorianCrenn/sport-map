import { useCallback } from 'react';

export function useShare() {
  const share = useCallback(async ({ title, text, url }) => {
    const shareData = { title, text, url: url || window.location.href };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'native' };
      } catch (err) {
        if (err.name === 'AbortError') return { success: false, method: 'native' };
      }
    }

    try {
      await navigator.clipboard.writeText(url || window.location.href);
      return { success: true, method: 'clipboard' };
    } catch {
      return { success: false, method: 'none' };
    }
  }, []);

  return { share };
}
