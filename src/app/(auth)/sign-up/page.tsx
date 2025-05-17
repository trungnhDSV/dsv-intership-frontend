'use client';
import SignUpForm from '@/app/(auth)/sign-up/SignUpForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const SignUpPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session found, redirecting to documents');
      console.log('Session:', session);
      router.push('/documents');
    }
  }, [session, status, router]);
  return <SignUpForm />;
};

export default SignUpPage;
