'use client';
import { signOut } from 'next-auth/react';

const SignOutBtn = () => {
  const handleSignOut = async () => {
    localStorage.removeItem('googleDriveToken');
    await signOut();
  };

  return <button onClick={handleSignOut}>SignOut</button>;
};

export default SignOutBtn;
