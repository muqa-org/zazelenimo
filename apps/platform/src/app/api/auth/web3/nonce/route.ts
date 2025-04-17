// apps/platform/src/app/api/auth/nonce/route.ts
// (Or apps/platform/src/app/api/auth/web3/nonce/route.ts if you kept the old path)

import { upsertUserWithNonce } from '@muqa/db';
import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { z } from 'zod';

import crypto from 'crypto';

// Schema expects 'walletAddress'
const WalletNonceRequestSchema = z.object({
	walletAddress: z
		.string()
		.refine(isAddress, { message: 'Invalid address format' }),
});

export type WalletNonceRequestDTO = z.infer<typeof WalletNonceRequestSchema>;
export type WalletNonceResponse = {
	nonce: string;
};

const NONCE_EXPIRY_MINUTES = 5;

export async function POST(req: NextRequest) {
	// --- ADDED: Log right at the start ---
	console.log('[Nonce API] POST function handler invoked.');
	// --- End Added Log ---

	let requestBody; // Variable to hold the parsed body for logging
	try {
		// --- Step 1: Parse Request Body ---
		console.log('[Nonce API] Attempting to parse request body...'); // Added log before parsing
		// Try parsing JSON first
		try {
			requestBody = await req.json();
			console.log(
				'[Nonce API] Received request body:',
				JSON.stringify(requestBody, null, 2),
			); // Log the received body
		} catch (parseError) {
			console.error(
				'[Nonce API] Failed to parse request body as JSON:',
				parseError,
			);
			// Attempt to read as text for logging, if JSON parsing fails
			try {
				const textBody = await req.text();
				console.error('[Nonce API] Raw request body (non-JSON):', textBody);
			} catch (textError) {
				console.error(
					'[Nonce API] Failed to read request body as text:',
					textError,
				);
			}
			return NextResponse.json(
				{ message: 'Invalid JSON in request body' },
				{ status: 400 },
			);
		}

		// --- Step 2: Validate Request Body ---
		console.log('[Nonce API] Attempting Zod validation...'); // Added log before validation
		const validationResult = WalletNonceRequestSchema.safeParse(requestBody);
		if (!validationResult.success) {
			const errors = validationResult.error.flatten().fieldErrors;
			// Log detailed validation errors on the server
			console.error(
				'[Nonce API] Zod validation failed:',
				JSON.stringify(errors, null, 2),
			);
			// Return detailed errors in JSON format
			return NextResponse.json(
				{
					message: 'Invalid request: Validation failed.',
					details: errors, // Send Zod errors back to client
				},
				{ status: 400 },
			);
		}
		console.log('[Nonce API] Zod validation successful.'); // Added log after validation

		// Destructure walletAddress AFTER successful validation
		const { walletAddress } = validationResult.data;

		// --- Step 3: Generate Nonce & Expiry ---
		const nonce = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

		// --- Step 4: Store Nonce in DB ---
		console.log(`[Nonce API] Attempting DB upsert for ${walletAddress}...`); // Added log before DB call
		await upsertUserWithNonce(walletAddress, { nonce, expiresAt });
		console.log(`[Nonce API] DB upsert successful for ${walletAddress}.`); // Added log after DB call

		// --- Step 5: Return Success Response ---
		console.log(`[Nonce API] Generated nonce for ${walletAddress}: ${nonce}`);
		return NextResponse.json({ nonce }); // Success response is JSON
	} catch (error) {
		// --- Catch other potential errors (e.g., DB errors) ---
		// Log added here to ensure we see errors within the main try block
		console.error('[Nonce API] Error within POST handler try block:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'An unknown error occurred';
		// Ensure a JSON response for internal errors too
		return NextResponse.json(
			{ message: 'Internal Server Error', error: errorMessage },
			{ status: 500 },
		);
	}
}
