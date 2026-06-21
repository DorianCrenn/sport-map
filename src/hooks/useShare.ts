import { useCallback } from 'react';

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'none';
}

export function useShare(): { share: (opts: ShareOptions) => Promise<ShareResult> } {
  const share = useCallback(async ({ title, text, url }: ShareOptions): Promise<ShareResult> => {
    const fullUrl = url || window.location.href;
    const shareData = { title, text, url: fullUrl };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'native' };
      } catch (err) {
        if ((err as Error).name === 'AbortError') return { success: false, method: 'native' };
      }
    }

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
