import MainNav from '@/components/MainNav';
import { NavbarHeight } from '@/constants/UI';
import React from 'react';

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div>
      <MainNav />
      <main style={{ paddingTop: `${NavbarHeight}px` }}>{children}</main>
    </div>
  );
};

export default layout;
