// auth.ts

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!API_URL || !AUTH_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required environment variables');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    }),
    Credentials({
      id: 'email-password',
      name: 'Email/Password',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { 'Content-Type': 'application/json' },
          });

          const data: {
            statusCode: number;
            data: {
              token: string;
              user: {
                id: string;
                email: string;
                fullName: string;
              };
            };
          } = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Invalid credentials');
          }

          if (data?.data?.token) {
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.fullName,
              token: data.data.token,
            };
          }
          return null;
        } catch (error) {
          console.error('Credentials auth error:', error);
          throw new Error('Authentication failed. Please try again.');
        }
      },
    }),
    Credentials({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/auth/verify-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credentials?.token }),
          });

          const data = await res.json();

          if (!res.ok || !data?.data?.token) {
            throw new Error(data?.message || 'Invalid verification link');
          }

          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.fullName,
            token: data.data.token,
          };
        } catch (error) {
          console.error('Magic link auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${API_URL}/auth/oauth-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              fullName: user.name,
            }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message);
          }
          const data = await res.json();
          user.id = data.data.user.id;
          user.token = data.data.token;
          return true;
        } catch (error) {
          return '/sign-in?error=email-exists';
        }
      }
      return true;
    },
    async jwt({
      token,
      user,
      account,
    }: {
      token: any;
      user: { id: string; email: string; name: string; token: string };
      account: unknown;
    }) {
      if (account && user) {
        if (account.provider === 'google') {
          token.accessToken = user.token;
        } else token.accessToken = user.token;
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: AUTH_SECRET,
});
