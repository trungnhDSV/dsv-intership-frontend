"use client";
import SignOutBtn from "@/components/SignOutBtn";
import { NavbarHeight } from "@/constants/UI";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React from "react";

const MainNav = () => {
  const { data: session, status } = useSession();
  if (status === "loading" || !session) return null;
  return (
    <nav
      className="w-full bg-white shadow-md flex items-center fixed"
      style={{ height: `${NavbarHeight}px` }}
    >
      <Image
        src={"/logo.png"}
        width={100}
        height={100}
        alt="logo"
        className="w-8 h-8 ml-6"
      />
      <div className="flex flex-1 justify-end pr-6 items-center gap-4">
        <p className="text-[14px]">Good Morning, {session.user?.name}</p>
        <div className="ring-1 ring-[#F2385A] rounded-full p-[4px] w-10 h-10">
          <DropdownMenu dir="ltr">
            <DropdownMenuTrigger asChild>
              <Avatar className="w-full h-full rounded-full bg-[#F5C731] flex items-center justify-center">
                <AvatarFallback className="text-xs font-medium text-gray-900">
                  CN
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-3 mr-6 rounded-xl w-fit p-2 bg-white border-[1px] border-[#D9D9D9]">
              <DropdownMenuItem className="px-4 py-3">
                <div className="w-[137px] text-[16px]">
                  <SignOutBtn />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
