'use client';
import SignInForm from '@/app/(auth)/sign-in/SignInForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SignInPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session found, redirecting to documents');
      console.log('Session:', session);
      router.push('/documents');
    }
  }, [session, status, router]);
  return <SignInForm />;
};

export default SignInPage;
