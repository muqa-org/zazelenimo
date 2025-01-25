import { prisma, User } from '@muqa/db';
import { AuthOptions } from 'next-auth';;
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import Web3CredentialsProvider from './provider';

const authOptions: AuthOptions = {
  providers: [
    Web3CredentialsProvider
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.address = (user as User).address;
        token.firstName = (user as User).firstName;
        token.lastName = (user as User).lastName;
        token.email = (user as User).email;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.address = token.address

      session.user.id = token.sub;
      session.user.address = token.address;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.email = token.email;

      return session
    },
  },
};

export default authOptions;
