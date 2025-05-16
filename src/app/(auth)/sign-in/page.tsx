import SignInForm from '@/app/(auth)/sign-in/SignInForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

const SignInPage = async () => {
  const session = await auth();
  console.log('Session:', session);
  if (session) redirect('/');
  return <SignInForm />;
};

export default SignInPage;
