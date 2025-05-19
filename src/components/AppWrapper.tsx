// src/components/AppWrapper.tsx
'use client';

import { useAutoLogout } from '@/app/hooks/useAutoLogout';

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useAutoLogout();
  return <>{children}</>;
}
