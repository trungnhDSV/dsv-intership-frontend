// useAutoLogout

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';
import { showErrorToast } from '@/components/CustomToast';

export function useAutoLogout() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken) return;

    const payload = jwtDecode(session.accessToken);
    if (!payload?.exp) return;

    const now = Date.now() / 1000; // giây
    const expiresIn = payload.exp - now;

    if (expiresIn > 0) {
      const timeout = setTimeout(() => {
        localStorage.removeItem('googleDriveToken');
        signOut();
      }, expiresIn * 1000);
      return () => clearTimeout(timeout);
    } else {
      // Token đã hết hạn, logout luôn
      showErrorToast({
        title: 'Your session has expired',
        description: 'Please log in again',
      });
      localStorage.removeItem('googleDriveToken');
      signOut();
    }
    console.log(session?.accessToken);
  }, [session?.accessToken]);
}
