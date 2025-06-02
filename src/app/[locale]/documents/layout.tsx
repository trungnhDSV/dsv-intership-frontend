import { auth } from '@/auth';
import MainNav from '@/components/MainNav';
import { NavbarHeight } from '@/constants/UI';
import { redirect } from 'next/navigation';
import React from 'react';

const layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return (
    <div>
      <MainNav />
      <main style={{ paddingTop: `${NavbarHeight}px` }}>{children}</main>
    </div>
  );
};

export default layout;
