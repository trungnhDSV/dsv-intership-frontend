'use client';
import SignUpForm from '@/app/[locale]/(auth)/sign-up/SignUpForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SignUpPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/documents');
    }
  }, [session, status, router]);
  return <SignUpForm />;
};

export default SignUpPage;
