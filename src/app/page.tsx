import { auth } from '@/auth';
import SignOutBtn from '@/components/SignOutBtn';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return (
    <>
      HomePage
      <SignOutBtn />
    </>
  );
}
