import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/signin`,
          {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await res.json();
        console.log("data:", data);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Login failed");
        }
        if (res.ok && data?.data.token) return data.data.user;

        return null;
      },
    }),
    CredentialsProvider({
      id: "verify-link",
      name: "Verify Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      authorize: async (credentials) => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: credentials.token }),
            }
          );

          const result: {
            data: {
              token: string;
              user: {
                id: string;
                email: string;
                fullName: string;
              };
            };
          } = await res.json();
          console.log("verify-link result:", result);

          if (!res.ok || !result?.data?.token || !result?.data?.user) {
            console.error("verify-link authorize failed:", result);
            return null;
          }

          return {
            token: result.data.token,
            ...result.data.user, // đảm bảo có id, email, name nếu cần
          };
        } catch (err) {
          console.error("verify-link authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          console.log(
            "PATH",
            `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-check`
          );
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-check`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, fullName: user.name }),
            }
          );

          const result = await res.json();

          if (!res.ok) {
            console.warn(
              "❌ OAuth block reason:",
              result?.message || "Unknown"
            );
            return "/sign-in?error=email-exists";
          }
        } catch (err) {
          console.error("❌ OAuth fetch/network error:", err);
          return "/sign-in";
        }
      }

      return true;
    },

    async jwt({
      token,
      user,
    }: {
      token: any;
      user:
        | {
            id: string;
            email: string;
            fullName: string;
            token?: string;
          }
        | undefined;
    }) {
      if (user?.token) {
        token.accessToken = user.token;
        token.user = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
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
  secret: process.env.JWT_SECRET,
});
