'use client';

import { googleSignInAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const GoogleSignIn = () => {
  return (
    <form action={googleSignInAction} className='flex gap-3'>
      <Button className='w-full text-sm' variant='outline'>
        <Image
          src={'/icons/google-icon.png'}
          width={20}
          height={20}
          alt='github'
          className='w-6 h-6'
        />
        Continue with Google
      </Button>
    </form>
  );
};

export { GoogleSignIn };
