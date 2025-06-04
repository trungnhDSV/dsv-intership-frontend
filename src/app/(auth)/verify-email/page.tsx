'use client';
import { Button } from '@/components/ui/button';
import VerifyNav from '@/components/VerifyNav';
import { NavbarHeight } from '@/constants/UI';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const VerifyPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  useEffect(() => {
    if (status === 'loading') return;
    else if (status === 'authenticated') router.push('/documents');
  }, [session, status, router]);
  useEffect(() => {
    const savedEmail = localStorage.getItem('pendingEmail');
    if (savedEmail) setEmail(savedEmail);
  }, [router]);

  return (
    <div className='flex w-screen h-screen'>
      <VerifyNav />
      <div
        className='flex flex-1 item-center justify-center'
        style={{ marginTop: `${NavbarHeight}px` }}
      >
        {/* <VerifySuccess /> */}
        <SendVerificationEmail email={email} />
      </div>
    </div>
  );
};

export default VerifyPage;

const SendVerificationEmail = ({ email }: { email: string }) => {
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const handleResendVerification = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify?email=${email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
    }
  };

  return (
    <div className='flex items-center justify-center flex-col gap-6'>
      <Image
        src={'/verify.png'}
        width={1000}
        height={1000}
        alt='logo'
        className='w-[192px] h-[192px]'
      />
      <p className='font-bold text-[32px]'>Verify your email address</p>
      <p>
        We&apos;ve just sent a verification email to <span className='font-semibold'>{email}</span>.
        Please check your inbox
      </p>
      <p>
        Didn&apos;t receive an email?{' '}
        <Button
          onClick={handleResendVerification}
          disabled={countdown > 0}
          className='text-[16px] bg-transparent text-[#B28A05] underline hover:bg-transparent p-0 cursor-pointer'
        >
          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Link'}
        </Button>
      </p>
    </div>
  );
};
