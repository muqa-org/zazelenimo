import { prisma } from '@muqa/db';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { AuthOptions } from 'next-auth';

import Web3CredentialsProvider from './provider';

const authOptions: AuthOptions = {
	providers: [Web3CredentialsProvider],
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
	},
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token }: { session: any; token: any }) {
			session.address = token.sub;
			session.user.name = token.sub;
			return session;
		},
	},
};

export default authOptions;
