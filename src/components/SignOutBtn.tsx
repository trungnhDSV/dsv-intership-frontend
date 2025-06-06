'use client';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

const SignOutBtn = () => {
  const t = useTranslations('navBar');
  const handleSignOut = async () => {
    localStorage.removeItem('googleDriveToken');
    localStorage.removeItem('googleDriveProfile');
    await signOut();
  };

  return (
    <button onClick={handleSignOut} className='cursor-pointer w-full text-start'>
      {t('logout')}
    </button>
  );
};

export default SignOutBtn;
