'use client';

import { Button } from '@allo/kit'; // Assuming Button component is available
import {
	createSafeSmartAccount,
	retrieveAccountAddressFromPasskeys,
	createSmartAccountClient,
	// Add specific types if available, e.g., SmartAccount, SmartAccountClient
} from '@cometh/connect-sdk-4337';
import { useSession, signIn, signOut } from 'next-auth/react';
import React, { useState } from 'react';
import { Hex, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains'; // Use your target chain

// --- Helper Functions ---
async function fetchNonce(walletAddress: string): Promise<string> {
	console.log(`[Auth Frontend] Fetching nonce for ${walletAddress}`);
	const response = await fetch('/api/auth/web3/nonce', {
		// Use the renamed route
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ walletAddress }),
	});
	if (!response.ok) {
		const errorData = await response.json();
		console.error('[Auth Frontend] Nonce API error:', errorData);
		throw new Error(
			errorData.message || `Nonce API request failed: ${response.status}`,
		);
	}
	const data = await response.json();
	if (!data.nonce) throw new Error('Nonce not received from API');
	console.log(`[Auth Frontend] Nonce received: ${data.nonce}`);
	return data.nonce;
}

async function signNonce(client: any, nonce: string): Promise<Hex> {
	// Replace 'any' with SDK type
	console.log('[Auth Frontend] Requesting signature for nonce...');
	if (!client?.account?.signMessage) {
		console.error(
			'[Auth Frontend] SmartAccountClient is invalid or signMessage is unavailable.',
		);
		throw new Error(
			'SmartAccountClient is invalid or signMessage is unavailable.',
		);
	}
	try {
		const signature = await client.account.signMessage({ message: nonce });
		console.log(`[Auth Frontend] Signature obtained: ${signature}`);
		return signature as Hex;
	} catch (error: any) {
		console.error('[Auth Frontend] Signing error:', error);
		throw new Error(
			`Failed to sign message: ${error.message || 'User cancelled or signing failed'}`,
		);
	}
}

async function callNextAuthSignIn(
	walletAddress: string,
	signedNonce: Hex,
	challenge: string,
): Promise<any> {
	// Replace 'any' with actual signIn response type
	console.log('[Auth Frontend] Calling NextAuth signIn...');
	// Use the ID of your CredentialsProvider ('web3-credentials' based on your provider file name)
	const signInResponse = await signIn('credentials', {
		// Default ID if not specified, or use your specific ID
		walletAddress: walletAddress,
		signedNonce: signedNonce,
		challenge: challenge,
		redirect: false,
	});

	console.log('[Auth Frontend] NextAuth signIn response:', signInResponse);
	if (!signInResponse?.ok) {
		console.error(
			'[Auth Frontend] NextAuth Sign-in failed:',
			signInResponse?.error,
		);
		throw new Error(signInResponse?.error || 'Authentication failed');
	}
	console.log('[Auth Frontend] NextAuth Sign-in successful!');
	return signInResponse;
}
// --- End Helper Functions ---

export default function PasskeyAuthButton({
	className = '',
}: {
	className?: string;
}) {
	const { data: session, status } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const comethApiKey = process.env.NEXT_PUBLIC_COMETH_API_KEY;

	// Initial check for API key configuration
	if (!comethApiKey) {
		return (
			<p className='text-red-500'>Error: Cometh API Key not configured.</p>
		);
	}

	const handleConnectOrRegister = async () => {
		setIsLoading(true);
		setError(null);
		let smartAccountClientInstance: any = null;
		let walletAddress: string | null = null;
		let nonce: string | null = null;
		let signature: Hex | null = null;

		// Ensure API key is valid before proceeding
		if (!comethApiKey || comethApiKey.includes('your-cometh')) {
			setError('Cometh API Key is not properly configured.');
			setIsLoading(false);
			return;
		}

		try {
			// --- 1. Attempt Login ---
			console.log(
				'[Auth Frontend] Attempting login: retrieveAccountAddressFromPasskey...',
			);
			try {
				walletAddress = await retrieveAccountAddressFromPasskeys(
					comethApiKey,
					arbitrumSepolia,
				);
				console.log(
					'[Auth Frontend] Existing wallet address retrieved:',
					walletAddress,
				);

				// Initialize client for existing wallet (Guide Step 2c for Login)
				const smartAccount = await createSafeSmartAccount({
					apiKey: comethApiKey,
					chain: arbitrumSepolia, // Ensure chain matches
					smartAccountAddress: walletAddress as `0x${string}`,
				});
				console.log(
					'[Auth Frontend] SmartAccount object obtained for existing wallet.',
				);

				smartAccountClientInstance = createSmartAccountClient({
					account: smartAccount,
					chain: arbitrumSepolia,
					bundlerTransport: http(), // Add required bundlerTransport
				});
				console.log(
					'[Auth Frontend] SmartAccountClient initialized for existing wallet.',
				);
			} catch (loginError: any) {
				console.warn('[Auth Frontend] Retrieve address error:', loginError);
				// --- 2. Handle "No Passkey Found" for Registration Fallback ---
				const isNoPasskeyError =
					loginError.message?.toLowerCase().includes('no passkey found') ||
					loginError.message?.toLowerCase().includes('cancelled') ||
					loginError.name === 'NotFoundError' ||
					loginError.name === 'AbortError' ||
					loginError.message?.includes('could not be found'); // Add other potential indicators

				if (isNoPasskeyError) {
					console.log(
						'[Auth Frontend] No existing passkey found or process cancelled. Proceeding to registration...',
					);

					// --- 3. Initiate Registration (Guide Step 1a) ---
					const smartAccount = await createSafeSmartAccount({
						apiKey: comethApiKey,
						chain: arbitrumSepolia,
					});
					walletAddress = smartAccount.address;
					console.log(
						'[Auth Frontend] New wallet address predicted:',
						walletAddress,
					);

					// Initialize client for new wallet (Guide Step 1c)
					smartAccountClientInstance = createSmartAccountClient({
						account: smartAccount,
						chain: arbitrumSepolia,
						bundlerTransport: http(), // Add required bundlerTransport
					});
					console.log(
						'[Auth Frontend] SmartAccountClient initialized for new wallet.',
					);
				} else {
					// Handle other login errors
					throw new Error(
						`Login failed: ${loginError.message || 'Unknown error during login attempt'}`,
					);
				}
			}

			// --- 4. Fetch Nonce ---
			if (!walletAddress || !smartAccountClientInstance) {
				throw new Error(
					'Wallet address or client not available after login/registration attempt.',
				);
			}
			nonce = await fetchNonce(walletAddress);

			// --- 5. Sign Nonce ---
			signature = await signNonce(smartAccountClientInstance, nonce);

			// --- 6. Call NextAuth signIn ---
			await callNextAuthSignIn(walletAddress, signature, nonce);
			// Success updates session via useSession hook
		} catch (err: any) {
			console.error('[Auth Frontend] Authentication process error:', err);
			setError(
				err.message || 'An unexpected error occurred during authentication.',
			);
		} finally {
			setIsLoading(false);
		}
	};

	// --- UI Rendering ---
	if (status === 'loading') {
		return (
			<Button className={className} disabled>
				Loading...
			</Button>
		); // Placeholder for loading state
	}

	if (session) {
		const userWalletAddress = (session.user as any)?.walletAddress;
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				{userWalletAddress && (
					<span className='hidden font-mono text-sm md:inline'>{`${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`}</span>
				)}
				<Button
					onClick={() => signOut()}
					disabled={isLoading}
					variant='outline'
					size='sm'
				>
					Sign Out
				</Button>
			</div>
		);
	}

	// Render the combined Sign In / Register button
	return (
		<div className={className}>
			<Button
				onClick={handleConnectOrRegister}
				disabled={isLoading}
				// Add styling as needed
			>
				{isLoading ? 'Connecting...' : 'Sign In / Register'}
			</Button>
			{error && <p className='mt-2 text-xs text-red-600'>Error: {error}</p>}
		</div>
	);
}
