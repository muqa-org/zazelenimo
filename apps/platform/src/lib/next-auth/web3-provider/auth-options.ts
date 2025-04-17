import { prisma } from '@muqa/db'; // Ensure User type is imported if needed
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { Session, AuthOptions, User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt'; // Import JWT type

import Web3CredentialsProvider from './provider';

// Define custom types for JWT and Session to include walletAddress and userId
interface CustomJWT extends JWT {
	userId?: string;
	walletAddress?: string;
}

interface CustomSession extends Session {
	user?: {
		id?: string | null;
		name?: string | null;
		email?: string | null;
		image?: string | null;
		walletAddress?: string | null;
	};
}

// Define the shape of the user object returned by authorize
interface AuthorizeReturnUser extends NextAuthUser {
	id: string;
	walletAddress: string | null;
}

const authOptions: AuthOptions = {
	providers: [Web3CredentialsProvider],
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
	},
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		// jwt callback: Called when JWT is created/updated
		async jwt({ token, user }) {
			// The 'user' object here comes from the 'authorize' function's return value
			// during the initial sign-in. It will contain { id, address }.
			// On subsequent calls (like session refresh), 'user' will be undefined.
			if (user) {
				// Assert that the 'user' object has 'id' and 'address' properties
				// when it's passed from the authorize function.
				const authorizedUser = user as AuthorizeReturnUser;
				token.walletAddress = authorizedUser.walletAddress;
				token.userId = authorizedUser.id; // Add user ID to token
			}
			return token as CustomJWT; // Return the enriched token
		},
		// session callback: Called when session is created/updated
		async session({ session, token }: { session: any; token: any }) {
			// This callback transfers info from the JWT (token) to the session object used by useSession
			const customSession = session as CustomSession; // Cast to your custom type

			// Ensure session.user exists
			if (!customSession.user) {
				customSession.user = {};
			}

			// Transfer necessary info from token to session
			if (token?.userId) {
				customSession.user.id = token.userId as string;
			}
			if (token?.walletAddress) {
				customSession.user.walletAddress = token.walletAddress as string;
				customSession.user.name = truncate(
					token.walletAddress as `0x${string}`,
				);
			}

			return customSession;
		},
	},
	// pages: { ... }, // Add if you have custom sign-in pages
	// debug: process.env.NODE_ENV === 'development', // Optional: enable for debugging
};

// Helper function (if not already defined/imported)
const TRUNCATE_LENGTH = 10;
const TRUNCATE_OFFSET = 4;
const truncate = (str?: `0x${string}`) =>
	str && str.length > TRUNCATE_LENGTH
		? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
		: `${str}`;

export default authOptions;
