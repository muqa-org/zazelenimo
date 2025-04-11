import { prisma } from '@muqa/db'; // Ensure User type is imported if needed
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { Session, AuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt'; // Import JWT type

import Web3CredentialsProvider from './provider';

// Define custom types for JWT and Session to include walletAddress and userId
interface CustomJWT extends JWT {
	userId?: string;
	address?: string; // Changed from walletAddress to address for consistency
}

interface CustomSession extends Session {
	user?: {
		id?: string | null;
		name?: string | null; // Keep name if you intend to use it
		email?: string | null; // Keep email if you intend to use it
		image?: string | null; // Keep image if you intend to use it
		address?: string | null; // Changed from walletAddress to address
	};
}

const authOptions: AuthOptions = {
	providers: [Web3CredentialsProvider],
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
	},
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		// *** ADD JWT CALLBACK ***
		async jwt({ token, user }) {
			// The 'user' object here comes from the 'authorize' function's return value
			// during the initial sign-in. It will contain { id, address }.
			// On subsequent calls (like session refresh), 'user' will be undefined.
			if (user) {
				// *** ADD TYPE ASSERTION HERE ***
				// Assert that the 'user' object has 'id' and 'address' properties
				// when it's passed from the authorize function.
				const authorizedUser = user as { id: string; address: string };
				token.sub = authorizedUser.address; // Use 'sub' (subject) standard JWT claim for the address
				token.userId = authorizedUser.id; // Add user ID to token
				// token.address = user.address; // Or add explicitly if preferred over 'sub'

				// If you need more user data in the token (like name/email),
				// you might fetch it here, but keep the token payload small.
				// Example:
				// const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
				// if (dbUser) {
				//    token.name = dbUser.firstName; // Assuming firstName exists
				// }
			}
			return token as CustomJWT; // Cast to your custom type
		},
		async session({ session, token }: { session: any; token: any }) {
			// This callback transfers info from the JWT (token) to the session object used by useSession()
			const customSession = session as CustomSession; // Cast to your custom type

			// Ensure session.user exists
			if (!customSession.user) {
				customSession.user = {};
			}

			// Transfer necessary info from token to session
			if (token?.sub) {
				customSession.user.address = token.sub as string; // Map 'sub' back to address
				// Set default name to truncated address if no other name is available
				customSession.user.name = truncate(token.sub as `0x${string}`);
			}
			// if (token?.address) { // Use this if you added token.address instead of sub
			// 	customSession.user.address = token.address as string;
			//  customSession.user.name = truncate(token.address as `0x${string}`);
			// }

			if (token?.userId) {
				customSession.user.id = token.userId as string;
			}

			// Add other fields like name if you included them in the jwt callback
			// if (token?.name) {
			//   customSession.user.name = token.name as string;
			// }

			// The original code had session.address = token.sub;
			// This is redundant if you add it to session.user.address
			// If you need it directly on the session object, you can keep it:
			// customSession.address = token.sub;

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
