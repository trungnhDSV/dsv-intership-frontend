'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import VerifyNav from '@/components/VerifyNav';
import { NavbarHeight } from '@/constants/UI';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const router = useRouter();
  const hasRunRef = useRef(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || hasRunRef.current) return;
    hasRunRef.current = true;

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
          method: 'Post',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error('Token không hợp lệ');
        setStatus('success');

        const data = await res.json();

        const verifiedToken = data.data.token;
        await signIn('magic-link', {
          redirect: false,
          token: verifiedToken,
          callbackUrl: '/documents',
        });

        // if (login?.ok) {
        //   router.push('/documents'); // hoặc bất kỳ route nào
        // }
      } catch (err) {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  if (!token) {
    router.push('/sign-in');
    return null;
  }

  const handleNavigate = () => {
    router.push('/documents');
  };

  if (status === 'error') {
    // Return Next.js 404 page
    return router.push('/404');
  }

  return (
    <div className='flex w-screen h-screen'>
      <VerifyNav />
      <div
        className='flex flex-1 item-center justify-center'
        style={{ marginTop: `${NavbarHeight}px` }}
      >
        {status === 'pending' && <Loading />}
        {status === 'success' && <VerifySuccess handleNavigate={handleNavigate} />}
      </div>
    </div>
  );
}

const Loading = () => {
  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <Spinner size='large' />
    </div>
  );
};

const VerifySuccess = ({ handleNavigate }: { handleNavigate: () => void }) => {
  return (
    <div className='flex items-center justify-center flex-col gap-6 w-fit'>
      <Image
        priority={true}
        src={'/verify-success.png'}
        width={1000}
        height={1000}
        alt='logo'
        className='w-[192px] h-[192px]'
      />
      <p className='font-bold text-[32px]'>Well done!!</p>
      <p>You have verifies your email successfully</p>
      <Button className='bg-[#F5C731] w-full' onClick={handleNavigate}>
        Go To My Document
      </Button>
    </div>
  );
};
