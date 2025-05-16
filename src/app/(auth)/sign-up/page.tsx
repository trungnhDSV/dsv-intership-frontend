import SignUpForm from '@/app/(auth)/sign-up/SignUpForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import React from 'react';

const SignUpPage = async () => {
  const session = await auth();
  if (session) redirect('/');
  return <SignUpForm />;
};

export default SignUpPage;
