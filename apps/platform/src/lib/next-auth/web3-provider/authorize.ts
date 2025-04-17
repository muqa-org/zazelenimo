import { clearUserNonce, getUserWithNonce } from '@muqa/db';
import { RequestInternal } from 'next-auth';

import { createPublicClient, http, isAddress, verifyMessage, Hex } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Configure Viem Public Client
// You might want to move this instantiation to a shared utility file
const publicClient = createPublicClient({
	chain: arbitrumSepolia, // Make sure this matches your target chain
	transport: http(process.env.RPC_URL),
});

// Define the expected shape of the user object returned on success
interface AuthorizedUser {
	id: string;
	walletAddress: string | null; // Match Prisma schema (String?)
}

export default async function authorize(
	// Ensure 'challenge' is expected in credentials type if defined elsewhere,
	// otherwise, check for its existence directly.
	credentials:
		| Record<'walletAddress' | 'signedNonce' | 'challenge', string>
		| undefined,
	req: Pick<RequestInternal, 'body' | 'headers' | 'method' | 'query'>,
): Promise<AuthorizedUser | null> {
	// Step 1: Receive Credentials - check for challenge
	if (
		!credentials?.walletAddress ||
		!credentials?.signedNonce ||
		!credentials?.challenge
	) {
		console.error(
			'[Authorize] Missing credentials (address, signedNonce, challenge)',
		);
		throw new Error('Required credentials not provided.');
	}

	const { walletAddress, signedNonce, challenge } = credentials;

	// Validate address format early
	if (!isAddress(walletAddress)) {
		console.error(`[Authorize] Invalid wallet address: ${walletAddress}`);
		throw new Error('Invalid wallet address provided.');
	}
	console.log(`[Authorize] Attempting authorization for: ${walletAddress}`);

	try {
		// Step 2: Retrieve User and Stored Nonce from DB
		const user = await getUserWithNonce(walletAddress);

		if (!user) {
			console.error(`[Authorize] User not found for address: ${walletAddress}`);
			throw new Error('User account not found. Please register first.');
		}
		if (!user.nonce || !user.nonceExpiry) {
			console.error(`[Authorize] Nonce data missing for user: ${user.id}`);
			throw new Error(
				'Authentication challenge not found or expired. Please try again.',
			);
		}

		// Step 3: Validate Nonce Content and Expiry
		if (user.nonce !== challenge) {
			console.error(
				`[Authorize] Nonce mismatch for user: ${user.id}. Stored: ${user.nonce}, Challenge: ${challenge}`,
			);
			throw new Error('Invalid authentication challenge.');
		}

		if (new Date() > user.nonceExpiry) {
			console.error(`[Authorize] Nonce expired for user: ${user.id}`);
			await clearUserNonce(user.id); // Clear the expired nonce
			throw new Error('Authentication challenge expired. Please try again.');
		}
		console.log(`[Authorize] Nonce validated for user: ${user.id}`);

		// Step 4: Verify Signature using Viem (EIP-1271 / EIP-6492)
		console.log(`[Authorize] Verifying signature via Viem client...`);
		// Verify the signedNonce against the *original nonce* (challenge)
		const isValidSignature = await publicClient.verifyMessage({
			address: walletAddress as `0x${string}`,
			message: challenge,
			signature: signedNonce as Hex,
		});

		if (!isValidSignature) {
			console.error(
				`[Authorize] Viem signature verification failed for user: ${user.id}`,
			);
			throw new Error('Signature verification failed.');
		}
		console.log(`[Authorize] Viem signature validated successfully.`);

		//Step 5: Check User Status
		if (!user.isActive) {
			console.warn(`[Authorize] Login attempt by inactive user: ${user.id}`);
			throw new Error('Your account is currently inactive.');
		}

		// Step 6: Success - Clear Nonce and Return User Object
		console.log(`[Authorize] Authorization successful for user: ${user.id}`);
		await clearUserNonce(user.id);

		// Return necessary user info for the session/jwt callbacks
		// Ensure the returned object matches the guide's expectation
		return {
			id: user.id,
			walletAddress: user.walletAddress,
		};
	} catch (error: any) {
		console.error('[Authorize] Error during authorization process:', error);
		// Re-throw the error message or a generic one
		throw new Error(
			error.message || 'An internal error occurred during authentication.',
		);
	}
}
