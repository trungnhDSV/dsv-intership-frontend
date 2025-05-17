import MainNav from "@/components/MainNav";
import { NavbarHeight } from "@/constants/UI";
import { SessionProvider } from "next-auth/react";
import React from "react";

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <SessionProvider>
      <div>
        <MainNav />

        <div style={{ paddingTop: `${NavbarHeight}px` }}>{children}</div>
      </div>
    </SessionProvider>
  );
};

export default layout;
