import { auth } from '@/auth';
import MainNav from '@/components/MainNav';
import { NavbarHeight } from '@/constants/UI';
import { NextIntlClientProvider } from 'next-intl';
import { notFound, redirect } from 'next/navigation';
import React from 'react';
import {} from '@/../messages/en.json';

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) => {
  const session = await auth();
  if (!session) redirect('/sign-in');

  let messages;
  try {
    messages = (await import(`@/../messages/${params.locale}.json`)).default;
  } catch (error) {
    notFound(); // fallback nếu không tìm thấy file
  }

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div>
        <MainNav />
        <main style={{ paddingTop: `${NavbarHeight}px` }}>{children}</main>
      </div>
    </NextIntlClientProvider>
  );
};

export default Layout;
