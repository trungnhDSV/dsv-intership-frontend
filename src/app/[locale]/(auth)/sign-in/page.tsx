'use client';
import SignInForm from '@/app/[locale]/(auth)/sign-in/SignInForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SignInPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/documents');
    }
  }, [session, status, router]);
  return <SignInForm />;
};

export default SignInPage;
