'use client';
import { signOut } from 'next-auth/react';

const SignOutBtn = () => {
  const handleSignOut = async () => {
    localStorage.removeItem('googleDriveToken');
    await signOut();
  };

  return (
    <button onClick={handleSignOut} className='cursor-pointer w-full text-start'>
      SignOut
    </button>
  );
};

export default SignOutBtn;
