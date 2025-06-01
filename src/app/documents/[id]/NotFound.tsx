'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';

const NotFound = ({ email }: { email: string | undefined }) => {
  const router = useRouter();
  return (
    <div className='h-full w-full flex rounded-[12px] overflow-hidden'>
      <div className='flex-1 flex items-center justify-center'>
        <div className='w-fit h-full flex flex-col justify-center'>
          <div className='flex items-center justify-center gap-6 w-fit h-fit'>
            <Image src='/notfound.png' alt='empty' width={245} height={245} priority />
            <div className=' h-full flex flex-col justify-between items-start py-3'>
              <div className='flex flex-col gap-[10px]'>
                <h1 className='font-bold text-5xl'>Oops,</h1>
                <p className='text-[32px]'>You don't have permission to access this file</p>
                <p className='text-[16px]'>
                  You are signed in as <span className='font-bold'>{email}</span>
                </p>
              </div>
              <Button
                className='bg-[#E3E3E3] text-[16px]'
                variant='outline'
                onClick={() => router.replace('/documents')}
              >
                Back to my document
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
