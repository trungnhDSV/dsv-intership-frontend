'use client';
import SignUpForm from '@/app/(auth)/sign-up/SignUpForm';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const SignUpPage = () => {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'authenticated') {
      window.location.href = '/documents';
    }
  }, [session, status]);
  return <SignUpForm />;
};

export default SignUpPage;
