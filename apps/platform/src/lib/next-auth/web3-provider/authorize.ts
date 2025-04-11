import { deleteUserNonce, getUserWithNonce } from '@muqa/db';
import { RequestInternal } from 'next-auth';

import { verifySignature } from '../../cometh/api';

export default async function authorize(
	// Ensure 'challenge' is expected in credentials type if defined elsewhere,
	// otherwise, check for its existence directly.
	credentials:
		| Record<'address' | 'signedNonce' | 'challenge', string>
		| undefined,
	req: Pick<RequestInternal, 'body' | 'headers' | 'method' | 'query'>,
) {
	// Step 1: Receive Credentials - check for challenge
	if (
		!credentials?.address ||
		!credentials?.signedNonce ||
		!credentials?.challenge
	) {
		console.error(
			'[Authorize] Missing credentials (address, signedNonce, challenge)',
		);
		throw new Error('Required credentials not provided.');
	}

	const { address, signedNonce, challenge } = credentials; // Destructure challenge
	console.log(`[Authorize] Attempting authorization for: ${address}`);

	try {
		// Step 2: Nonce Lookup & User Retrieval
		const user = await getUserWithNonce(address);

		if (!user?.authNonce) {
			// Check if user and authNonce exist
			console.error(
				`[Authorize] User or nonce data not found for address: ${address}`,
			);
			throw new Error('User account or authentication challenge not found.');
		}

		// Step 3: Nonce Validity Checks
		const storedNonce = user.authNonce.nonce;
		const nonceExpiry = user.authNonce.expiresAt;

		// CHECK: Compare stored nonce with the challenge from frontend
		if (storedNonce !== challenge) {
			console.error(
				`[Authorize] Nonce mismatch for user: ${user.id}. Stored: ${storedNonce}, Challenge: ${challenge}`,
			);
			throw new Error('Invalid authentication challenge.');
		}

		if (new Date() > nonceExpiry) {
			console.error(`[Authorize] Nonce expired for user: ${user.id}`);
			// Clear the expired nonce
			await deleteUserNonce(user);
			throw new Error('Authentication challenge expired. Please try again.');
		}
		console.log(`[Authorize] Nonce validated for user: ${user.id}`);

		// Step 4: Signature Verification (Keep using Cometh API as requested)
		console.log(`[Authorize] Verifying signature via Cometh API...`);
		// Verify the signedNonce against the *original nonce* (challenge)
		const verification = await verifySignature(
			address,
			challenge, // Use the challenge (original nonce) for verification
			signedNonce,
		);
		console.log('[Authorize] Cometh API verification response:', verification);

		if (!verification.success || !verification.result) {
			console.error(
				`[Authorize] Cometh API Signature invalid for user: ${user.id}`,
			);
			throw new Error('Invalid signature provided.');
		}
		console.log(`[Authorize] Cometh API Signature validated successfully.`);

		// Step 5: Check User Status (Assuming 'isActive' field exists or logic is handled elsewhere)
		// if (!user.isActive) {
		//   console.warn(`[Authorize] Login attempt by inactive user: ${user.id}`);
		//   throw new Error("Your account is currently inactive.");
		// }

		// Step 6: Success - Clear Nonce and Return User Object
		console.log(`[Authorize] Authorization successful for user: ${user.id}`);
		await deleteUserNonce(user);

		// Return necessary user info for the session/jwt callbacks
		return {
			id: user.id,
			address: user.address, // Pass address if needed in session/jwt
			// name: user.name, // Add other fields if needed by jwt/session callbacks
			// email: user.email,
		};
	} catch (error: any) {
		console.error('[Authorize] Error during authorization process:', error);
		// Re-throw the error message or a generic one
		throw new Error(
			error.message || 'An internal error occurred during authentication.',
		);
	}
}
