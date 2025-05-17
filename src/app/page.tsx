import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (!session) {
    console.log('IN HOMEPAGE, Session not found, redirecting to sign-in');
    redirect('/sign-in');
  } else {
    console.log('IN HOMEPAGE, Session found', session);
    redirect('/documents');
  }

  return <>HomePage</>;
}
