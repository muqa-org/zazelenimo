import { prisma } from '@muqa/db';
import { AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import Web3CredentialsProvider from './provider';
import { User } from 'next-auth';

// Extend the User type to include address
interface ExtendedUser extends User {
	address?: string;
}

// Extend the Session type
declare module 'next-auth' {
	interface Session {
		user: {
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			address?: string;
		};
	}
}

// Extend the JWT type
declare module 'next-auth/jwt' {
	interface JWT {
		id?: string;
		address?: string;
	}
}

const authOptions: AuthOptions = {
	providers: [Web3CredentialsProvider],
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error',
	},
	callbacks: {
		async jwt({ token, user }) {
			// Initial sign in
			if (user) {
				const extendedUser = user as ExtendedUser;
				token.id = user.id;
				token.address = extendedUser.address;
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.address = token.address as string;
				session.user.name = token.address as string;
			}
			return session;
		},
	},
};

export default authOptions;
