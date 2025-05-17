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
      <div style={{ paddingTop: `${NavbarHeight}px` }}>{children}</div>
    </div>
  );
};

export default layout;
