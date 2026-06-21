import { useEffect, useRef } from 'react';

export function useAndroidBack(isOpen: boolean, onClose: () => void): void {
  const pushed    = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;

    history.pushState({ sl_overlay: true }, '');
    pushed.current = true;

    function handlePopState() {
      pushed.current = false;
      onCloseRef.current?.();
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (pushed.current) {
        pushed.current = false;
        history.go(-1);
      }
    };
  }, [isOpen]);
}
