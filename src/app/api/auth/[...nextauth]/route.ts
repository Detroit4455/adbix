import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.mobileNumber || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          console.log('Attempting to authenticate user:', credentials.mobileNumber);

          const { db } = await connectToDatabase();
          const user = await db.collection('users').findOne({ mobileNumber: credentials.mobileNumber });

          if (!user) {
            console.log('No user found with mobile number:', credentials.mobileNumber);
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            console.log('Invalid password for user:', credentials.mobileNumber);
            return null;
          }

          console.log('User authenticated successfully:', credentials.mobileNumber);

          return {
            id: user._id.toString(),
            name: user.name,
            mobileNumber: user.mobileNumber,
            siteUrl: user.siteUrl,
            lastUpdated: user.lastUpdated,
            role: user.role || 'user'
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mobileNumber = user.mobileNumber;
        token.siteUrl = user.siteUrl;
        token.lastUpdated = user.lastUpdated;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.mobileNumber = token.mobileNumber;
        session.user.siteUrl = token.siteUrl;
        session.user.lastUpdated = token.lastUpdated;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 