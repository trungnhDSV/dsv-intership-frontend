'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React from 'react';

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const t = useTranslations('home');
  return (
    <div className='relative flex items-center justify-between min-h-screen'>
      <Image
        src={'/hero.jpg'}
        width={10000}
        height={10000}
        alt='hero Image'
        className='absolute inset-0 object-cover w-full h-full -z-10'
      />
      <div className='flex flex-col gap-4 ml-12'>
        <div className='flex items-center justify-center bg-sidebar-primary-foreground text-xl font-bold px-3 py-1 rounded-sm gap-1'>
          <Image src={'/logo.png'} width={100} height={100} alt='logo' className='w-8 h-8' />
          DI-PDF
        </div>
        <div className='flex flex-col gap-0'>
          <p className='text-sm font-light text-white'>
            {t('sloganHeader')} <br />
            <span className='text-sm font-bold text-white'>{t('sloganTail')}</span>
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};

export default Layout;
