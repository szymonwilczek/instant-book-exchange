import NextAuth from "next-auth";
import "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDB from "@/lib/db/connect";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    rememberMe?: boolean;
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      username?: string;
      points?: number;
      profileImage?: string;
    };
  }

  interface User {
    rememberMe?: boolean;
    username?: string;
    points?: number;
    profileImage?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rememberMe?: boolean;
    username?: string;
    points?: number;
    profileImage?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "checkbox" },
      },
      async authorize(credentials) {
        await connectToDB();
        const user = await User.findOne({ email: credentials?.email }).select(
          "+password",
        );
        if (user && user.password) {
          const isValid = await bcrypt.compare(
            credentials!.password as string,
            user.password,
          );
          if (isValid) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.username,
              username: user.username,
              points: user.points || 0,
              profileImage: user.profileImage,
              rememberMe: credentials?.rememberMe === "true",
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          const newUser = await User.create({
            email: user.email,
            username: user.name,
            googleId: user.id,
            profileImage: user.image,
            hasCompletedOnboarding: false,
            points: 0,
          });
          user.id = newUser._id.toString();
          user.username = newUser.username;
          user.points = newUser.points || 0;
          user.profileImage = newUser.profileImage;
        } else {
          user.id = existingUser._id.toString();
          user.username = existingUser.username;
          user.points = existingUser.points || 0;
          user.profileImage = existingUser.profileImage;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session, account }) {
      if (user) {
        token.id = user.id;
        token.rememberMe = user.rememberMe;
        token.username = user.username;
        token.points = user.points || 0;
        token.profileImage = user.profileImage;
      }

      if (account?.provider === "google" && !token.points) {
        await connectToDB();
        const dbUser = await User.findOne({ email: token.email }).select(
          "username points profileImage _id",
        );
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.username = dbUser.username;
          token.points = dbUser.points || 0;
          token.profileImage = dbUser.profileImage;
        }
      }

      if (trigger === "update") {
        await connectToDB();
        const dbUser = await User.findOne({ email: token.email }).select(
          "username points profileImage",
        );
        if (dbUser) {
          token.username = dbUser.username;
          token.points = dbUser.points || 0;
          token.profileImage = dbUser.profileImage;
        } else {
          console.error("❌ User not found in DB for update!");
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.rememberMe = token.rememberMe as boolean;
      session.user.username = token.username as string;
      session.user.points = (token.points as number) || 0;
      session.user.profileImage = token.profileImage as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
});
