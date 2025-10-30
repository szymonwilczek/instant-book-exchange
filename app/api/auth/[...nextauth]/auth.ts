import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'checkbox' },
      },
      async authorize(credentials) {
        await connectToDB();
        const user = await User.findOne({ email: credentials?.email }).select('+password');
        if (user && user.password) {
          const isValid = await bcrypt.compare(credentials!.password, user.password);
          if (isValid) {
            return { 
              id: user._id.toString(), 
              email: user.email, 
              name: user.username, 
              rememberMe: credentials?.rememberMe === 'true' 
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectToDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            username: user.name,
            googleId: user.id,
            profileImage: user.image,
            hasCompletedOnboarding: false,
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rememberMe = user.rememberMe;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.rememberMe = token.rememberMe as boolean;
      if (session.rememberMe) {
        session.maxAge = 30 * 24 * 60 * 60; // 30 dni
      } else {
        session.maxAge = 24 * 60 * 60; // 1 dzień
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});