// App.tsx hoặc layout.tsx hoặc component cha
import { useEffect } from 'react';

export function useListenGoogleDriveToken(onReceived: (data) => void) {
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.access_token) {
        onReceived(e.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onReceived]);
}
