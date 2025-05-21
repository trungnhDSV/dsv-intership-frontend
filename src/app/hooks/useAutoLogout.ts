import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

export function useAutoLogout(inactivityTime = 30 * 60 * 1000) {
  const { data: session } = useSession();
  const timer = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        console.warn('⏱️ No activity for 30 mins, logging out');
        signOut({ callbackUrl: '/sign-in' });
      }, inactivityTime);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start timer

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [session, inactivityTime]);
}
