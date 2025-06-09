'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const NotFound = ({ email, is404 = false }: { email: string | undefined; is404?: boolean }) => {
  const router = useRouter();
  const t = useTranslations('notFoundDoc');

  return (
    <div className='h-full w-full flex rounded-[12px] overflow-hidden'>
      <div className='flex-1 flex items-center justify-center'>
        <div className='w-fit h-full flex flex-col justify-center'>
          <div className='flex items-center justify-center gap-6 w-fit h-fit'>
            <Image src='/notfound.png' alt='empty' width={245} height={245} priority />
            <div className=' h-full flex flex-col justify-between items-start py-3'>
              <div className='flex flex-col gap-[10px]'>
                <h1 className='font-bold text-5xl'>Oops,</h1>
                {is404 ? (
                  <p className='text-[32px]'>{t('title404')}</p>
                ) : (
                  <>
                    <p className='text-[32px]'>{t('tittle')}</p>
                    <p className='text-[16px]'>
                      {t('desc')} <span className='font-bold'>{email}</span>
                    </p>
                  </>
                )}
              </div>
              <Button
                className='bg-[#E3E3E3] text-[16px] cursor-pointer'
                variant='outline'
                onClick={() => router.replace('/documents')}
              >
                {t('backToHome')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
