'use client';
import SignUpForm from '@/app/(auth)/sign-up/SignUpForm';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const SignUpPage = () => {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session found, redirecting to documents');
      console.log('Session:', session);
      window.location.href = '/documents';
    }
  }, [session, status]);
  return <SignUpForm />;
};

export default SignUpPage;
