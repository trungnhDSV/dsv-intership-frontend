"use client";
import { signOut } from "next-auth/react";

const SignOutBtn = () => {
  const handleSignOut = async () => {
    await signOut();
  };

  return <button onClick={handleSignOut}>SignOut</button>;
};

export default SignOutBtn;
