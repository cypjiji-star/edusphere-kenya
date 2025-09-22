import { useEffect } from 'react';

export function usePullRefresh(enabled = true) {
  useEffect(() => {
    if (!enabled || !('serviceWorker' in navigator)) return;
    import('pulltorefreshjs').then((PTR) => {
      PTR.default.init({
        mainElement: 'main',
        onRefresh() { location.reload(); },
        shouldPullToRefresh: () => !document.querySelector('[data-no-ptr]'), // disable on charts
      });
    });
  }, [enabled]);
}
