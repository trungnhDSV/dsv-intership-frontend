import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user?: {
      id: string;
      email: string;
      name: string;
    };
    googleAccessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    token: string;
  }
}
