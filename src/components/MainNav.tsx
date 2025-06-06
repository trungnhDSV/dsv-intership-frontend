'use client';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SignOutBtn from '@/components/SignOutBtn';
import { NavbarHeight } from '@/constants/UI';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

const MainNav = () => {
  const { data: session, status } = useSession();
  const t = useTranslations('navBar');
  const [isOpen, setIsOpen] = useState(false);
  if (status === 'loading' || !session) return null;
  return (
    <nav
      className='w-full bg-white shadow-md flex items-center fixed z-100'
      style={{ height: `${NavbarHeight}px` }}
    >
      <Link href={'/documents'}>
        <Image src={'/logo.png'} width={100} height={100} alt='logo' className='w-8 h-8 ml-6' />
      </Link>
      <div className='flex flex-1 justify-end pr-6 items-center gap-4'>
        <LanguageSwitcher />
        <p className='text-[14px] ml-4'>
          {(() => {
            const hour = new Date().getHours();
            if (hour < 12) return t('goodMorning');
            if (hour < 18) return t('goodAfternoon');
            return t('goodEvening');
          })()}
          , {session.user?.name}
        </p>
        <div
          className={cn(
            'ring-1 ring-[#E3E8EF] rounded-full p-[4px] w-10 h-10 transition-all duration-200 ease-in-out',
            isOpen && 'ring-[#F2385A]'
          )}
        >
          <DropdownMenu dir='ltr' open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
            <DropdownMenuTrigger asChild>
              <Avatar className='w-full h-full rounded-full bg-[#F5C731] flex items-center justify-center'>
                <AvatarFallback className='text-xs font-medium text-gray-900'>
                  {session.user?.name?.split(' ').map((n) => n[0])}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='mt-3 mr-6 rounded-xl w-[196px] p-2 bg-white border-[1px] border-[#D9D9D9]'>
              <DropdownMenuItem className='px-4 py-3 hover:bg-[#F5C731]/50 rounded-lg hover:border-none'>
                <div className='w-[137px] text-[16px]'>
                  <SignOutBtn />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
