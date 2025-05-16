// // auth.ts
// import NextAuth, { type NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";

// const API_URL = process.env.NEXT_PUBLIC_API_URL;
// const JWT_SECRET = process.env.JWT_SECRET;
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// if (!API_URL || !JWT_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
//   throw new Error("Missing required environment variables");
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       profile(profile) {
//         return {
//           id: profile.sub,
//           email: profile.email,
//           name: profile.name,
//           image: profile.picture,
//         };
//       },
//     }),
//     CredentialsProvider({
//       id: "email-password",
//       name: "Email/Password",
//       credentials: {
//         email: { label: "Email", type: "text" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         try {
//           const res = await fetch(`${API_URL}/auth/signin`, {
//             method: "POST",
//             body: JSON.stringify(credentials),
//             headers: { "Content-Type": "application/json" },
//           });

//           const data = await res.json();

//           if (!res.ok) {
//             throw new Error(data.message || "Invalid credentials");
//           }

//           if (data?.data?.token) {
//             return {
//               id: data.data.user.id,
//               email: data.data.user.email,
//               name: data.data.user.fullName,
//               token: data.data.token,
//             };
//           }
//           return null;
//         } catch (error) {
//           console.error("Credentials auth error:", error);
//           throw new Error("Authentication failed. Please try again.");
//         }
//       },
//     }),
//     CredentialsProvider({
//       id: "magic-link",
//       name: "Magic Link",
//       credentials: {
//         token: { label: "Token", type: "text" },
//       },
//       async authorize(credentials) {
//         try {
//           const res = await fetch(`${API_URL}/auth/verify-login`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ token: credentials?.token }),
//           });

//           const data = await res.json();

//           if (!res.ok || !data?.data?.token) {
//             throw new Error(data?.message || "Invalid verification link");
//           }

//           return {
//             id: data.data.user.id,
//             email: data.data.user.email,
//             name: data.data.user.fullName,
//             token: data.data.token,
//           };
//         } catch (error) {
//           console.error("Magic link auth error:", error);
//           return null;
//         }
//       },
//     }),
//   ],
//   callbacks: {
//     async signIn({ user, account }) {
//       // Block Google sign-in if email already registered with credentials
//       if (account?.provider === "google") {
//         try {
//           const res = await fetch(`${API_URL}/auth/oauth-check`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ email: user.email }),
//           });

//           if (!res.ok) {
//             const error = await res.json();
//             throw new Error(error.message);
//           }
//           return true;
//         } catch (error) {
//           console.error("OAuth check failed:", error);
//           return `/signin?error=oauth_blocked&message=${encodeURIComponent(
//             error instanceof Error ? error.message : "OAuth not allowed"
//           )}`;
//         }
//       }
//       return true;
//     },
//     async jwt({ token, user, account }) {
//       // Initial sign-in
//       if (account && user) {
//         token.accessToken = user.token;
//         token.user = {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//         };
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       session.accessToken = token.accessToken;
//       session.user = token.user;
//       return session;
//     },
//   },
//   session: {
//     strategy: "jwt",
//     maxAge: 24 * 60 * 60, // 1 day
//   },
//   pages: {
//     signIn: "/signin",
//     error: "/auth/error",
//   },
//   cookies: {
//     sessionToken: {
//       name: "__Secure-next-auth.session-token",
//       options: {
//         httpOnly: true,
//         sameSite: "lax",
//         path: "/",
//         secure: process.env.NODE_ENV === "production",
//       },
//     },
//   },
//   secret: JWT_SECRET,
//   debug: process.env.NODE_ENV === "development",
// };

// export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

console.log('🔥 INIT AUTH CONFIG');

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
        console.log('Email/Password ', credentials);
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

          console.log('data', data);

          if (data?.data?.token) {
            console.log('VALID TOKEN', data.data.token);
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
          console.log('Magic link ', credentials);
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
            body: JSON.stringify({ email: user.email, fullName: user.name }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message);
          }
          return true;
        } catch (error) {
          console.error('OAuth check failed:', error);
          return `/sign-in?error=email-exists`;
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
      console.log('JWT CALLBACK', token, user, account);
      if (account && user) {
        token.accessToken = user.token;
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
      console.log('JWT token', token);
      return token;
    },
    async session({ session, token }) {
      console.log('SESSION CALLBACK', session, token);
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
