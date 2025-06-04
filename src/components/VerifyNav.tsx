import { NavbarHeight } from '@/constants/UI';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const VerifyNav = () => {
  return (
    <nav
      className='w-full bg-white shadow-md flex items-center fixed'
      style={{ height: `${NavbarHeight}px` }}
    >
      <Link href='/verify-email'>
        <Image src={'/logo.png'} width={100} height={100} alt='logo' className='w-8 h-8 ml-6' />
      </Link>
    </nav>
  );
};

export default VerifyNav;
