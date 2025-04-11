'use client';

// *** Allo Kit Imports ***
import { comethConfig } from '@allo/kit'; // Ensure this path is correct
//
// *** Direct Cometh SDK Imports ***
import {
	createSafeSmartAccount,
	createSmartAccountClient,
	retrieveAccountAddressFromPasskeys,
	createComethPaymasterClient, // Import if using paymaster
	ComethSmartAccountClient,
	ComethSafeSmartAccount,
} from '@cometh/connect-sdk-4337';
//
// *** NextAuth Imports ***
import { signIn, signOut, useSession } from 'next-auth/react';
//
// *** React/Next Imports ***
import { useTranslations } from 'next-intl';
import { PropsWithChildren, useState, useEffect } from 'react'; // *** Import useEffect ***
//
//
import { http, type Address } from 'viem'; // Import Address type
//
// *** Wagmi Imports (Keep for status/disconnect) ***
import { useAccount, useDisconnect } from 'wagmi';

// *** Local Imports ***
import { Button, ButtonProps } from './Button'; // Ensure Button component path is correct
import { WalletNonceResponse } from '../api/auth/web3/nonce/route'; // Ensure API route path is correct

// --- Helper Functions ---

const TRUNCATE_LENGTH = 10;
const TRUNCATE_OFFSET = 4;

const truncate = (str?: `0x${string}`): string =>
	str && str.length > TRUNCATE_LENGTH + TRUNCATE_OFFSET + 2
		? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
		: (str ?? '');

async function getNonce(address: `0x${string}`): Promise<string> {
	console.log('[getNonce] Fetching for address:', address);
	const body = JSON.stringify({ address });
	const headers = {
		'Content-Type': 'application/json',
	};

	const res = await fetch('/api/auth/web3/nonce', {
		method: 'POST',
		headers,
		body,
	});
	if (!res.ok) {
		const errorBody = await res.text();
		console.error('[getNonce] Nonce API Error Response:', errorBody);
		throw new Error(`Failed to fetch nonce: ${res.statusText}`);
	}

	const { nonce } = (await res.json()) as WalletNonceResponse;
	if (!nonce) {
		console.error('[getNonce] Nonce not received from API');
		throw new Error('Nonce not received from API');
	}
	console.log('[getNonce] Received nonce:', nonce);
	return nonce;
}

function LoadingIcon() {
	return (
		<div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white'></div>
	);
}

function AddressTooltip({
	show,
	label,
	onMouseEnter,
	onMouseLeave,
}: {
	show: boolean;
	label?: `0x${string}`;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}) {
	const copyToClipboard = () => {
		if (label) {
			navigator.clipboard.writeText(label);
		}
	};

	return (
		<>
			{show && !!label && (
				<div
					className='absolute right-0 top-full z-10 mt-2 flex w-max items-center rounded bg-gray-700 p-2 font-mono text-xs text-white shadow-lg'
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
				>
					<span>{label}</span>
					<button
						onClick={copyToClipboard}
						className='ml-2 rounded bg-gray-600 p-1 transition-colors duration-150 ease-in-out hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 active:bg-gray-400'
						title='Copy to clipboard'
					>
						<span className='inline-block transform transition-transform duration-150 ease-in-out active:scale-90'>
							📋
						</span>
					</button>
				</div>
			)}
		</>
	);
}

// --- Custom Hook for Hydration Safety ---
const useHasMounted = () => {
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => {
		setHasMounted(true);
	}, []);
	return hasMounted;
};

// --- Main Component ---

export default function MuqaConnectButton({
	children,
	...props
}: PropsWithChildren<ButtonProps>): JSX.Element {
	const account = useAccount(); // Keep useAccount for display purposes
	const { disconnect } = useDisconnect();
	const { status: sessionStatus } = useSession(); // Use session status as primary auth indicator
	const [showTooltip, setShowTooltip] = useState(false);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const t = useTranslations('auth');
	const hasMounted = useHasMounted(); // Hook to check client-side mount

	// Determines the button label based on connection and session status, only after mounting
	const getLabel = () => {
		if (!hasMounted) return t('connect'); // Default label before mount to avoid hydration mismatch

		const address = truncate(account.address); // Use wagmi address for display if available
		if (sessionStatus === 'loading' || isAuthLoading) return t('connecting');
		if (sessionStatus === 'authenticated')
			return `${t('disconnect')} ${address || ''}`; // Show address if authenticated
		// if (account.isConnecting || account.isReconnecting) return t('connecting'); // Wagmi connecting state
		return t('connect');
	};

	const label = getLabel();

	const onMouseEnter = () => setShowTooltip(!!account?.address && true);
	const onMouseLeave = () => setShowTooltip(false);

	async function signInWithWeb3() {
		console.log('[signInWithWeb3] Starting...');
		setIsAuthLoading(true);
		let walletAddress: Address | null = null;
		let smartAccountClient: ComethSmartAccountClient | null = null;
		let smartAccount: ComethSafeSmartAccount | undefined;

		try {
			// --- Login Flow Attempt ---
			try {
				console.log(
					'[signInWithWeb3] Attempting login: retrieving address via passkey...',
				);
				const retrievedAddress = await retrieveAccountAddressFromPasskeys(
					comethConfig.apiKey,
					comethConfig.chain,
				);

				if (retrievedAddress) {
					walletAddress = retrievedAddress as Address;
					console.log(
						'[signInWithWeb3] Login: Retrieved Wallet Address:',
						walletAddress,
					);

					console.log(
						'[signInWithWeb3] Login: Initializing SmartAccount client for existing address...',
					);
					smartAccount = await createSafeSmartAccount({
						apiKey: comethConfig.apiKey,
						chain: comethConfig.chain,
						smartAccountAddress: walletAddress,
					});
					console.log('[signInWithWeb3] Login: SmartAccount object obtained.');

					const paymasterClient = await createComethPaymasterClient({
						transport: http(comethConfig.paymasterUrl),
						chain: comethConfig.chain,
					});

					smartAccountClient = createSmartAccountClient({
						account: smartAccount,
						chain: comethConfig.chain,
						bundlerTransport: http(comethConfig.bundlerUrl),
						paymaster: paymasterClient,
					});
					console.log('[signInWithWeb3] Login: SmartAccountClient obtained.');
				} else {
					console.log(
						'[signInWithWeb3] Login: No existing passkey selected or found. Proceeding to account creation.',
					);
				}
			} catch (loginError: any) {
				// Distinguish cancellation from other errors
				if (
					loginError?.message?.includes('cancelled') ||
					loginError?.code === 'ACTION_REJECTED'
				) {
					console.log(
						'[signInWithWeb3] Login passkey prompt cancelled by user.',
					);
				} else {
					console.warn(
						'[signInWithWeb3] Login attempt failed, proceeding to account creation:',
						loginError,
					);
				}
				// Fall through to creation flow regardless
			}

			// --- Account Creation Flow (if login didn't succeed OR was cancelled) ---
			if (!walletAddress || !smartAccountClient) {
				console.log('[signInWithWeb3] Attempting account creation...');
				try {
					smartAccount = await createSafeSmartAccount({
						apiKey: comethConfig.apiKey,
						chain: comethConfig.chain,
					});
					walletAddress = smartAccount.address as Address;
					console.log(
						'[signInWithWeb3] Creation: Smart Account instance created.',
					);
					console.log(
						'[signInWithWeb3] Creation: Wallet Address:',
						walletAddress,
					);

					const paymasterClient = await createComethPaymasterClient({
						transport: http(comethConfig.paymasterUrl),
						chain: comethConfig.chain,
					});

					smartAccountClient = createSmartAccountClient({
						account: smartAccount,
						chain: comethConfig.chain,
						bundlerTransport: http(comethConfig.bundlerUrl),
						paymaster: paymasterClient,
					});
					console.log(
						'[signInWithWeb3] Creation: SmartAccountClient initialized.',
					);
				} catch (creationError: any) {
					// Handle potential errors during creation (e.g., user cancels creation prompt)
					if (
						creationError?.message?.includes('cancelled') ||
						creationError?.code === 'ACTION_REJECTED'
					) {
						console.log(
							'[signInWithWeb3] Creation passkey prompt cancelled by user.',
						);
						setIsAuthLoading(false); // Stop loading if cancelled
						return; // Exit the function if creation is cancelled
					} else {
						console.error(
							'[signInWithWeb3] Error during account creation:',
							creationError,
						);
						throw creationError; // Re-throw other errors
					}
				}
			}

			// Ensure we have the address, client, AND the smartAccount object before proceeding
			if (!walletAddress || !smartAccountClient || !smartAccount) {
				console.error(
					'[signInWithWeb3] Failed validation check: Missing address, client, or account object.',
				);
				throw new Error(
					'Failed to obtain wallet address, smart account client, or smart account object.',
				);
			}

			// Step 4: Fetch Nonce from Backend
			console.log('[signInWithWeb3] Fetching nonce...');
			const nonce = await getNonce(walletAddress);
			console.log('[signInWithWeb3] Nonce received:', nonce);

			// Step 5: Sign Nonce using the obtained SmartAccountClient
			console.log('[signInWithWeb3] Signing nonce...');
			const messageToSign = nonce;
			const signedNonce = await smartAccountClient.signMessage({
				account: smartAccount,
				message: messageToSign,
			});
			console.log('[signInWithWeb3] Nonce signed:', signedNonce);

			// Step 6: Call NextAuth signIn with Credentials
			console.log('[signInWithWeb3] Calling NextAuth signIn...');
			const result = await signIn('credentials', {
				address: walletAddress,
				signedNonce,
				challenge: nonce,
				redirect: false,
			});

			console.log('[signInWithWeb3] NextAuth signIn response:', result);

			// Handle NextAuth sign-in response
			if (result?.error) {
				console.error('[signInWithWeb3] NextAuth Error:', result.error);
				throw new Error(`NextAuth sign-in failed: ${result.error}`);
			} else if (result?.ok) {
				console.log('[signInWithWeb3] NextAuth Sign-In Successful');
				// Session state should update via useSession hook triggering re-render
			} else {
				console.warn(
					'[signInWithWeb3] NextAuth signIn returned !ok but no error.',
				);
				throw new Error('NextAuth sign-in did not succeed.');
			}
		} catch (error: unknown) {
			console.error('[signInWithWeb3] Error during sign-in process:', error);
			// TODO: Implement user-friendly error handling (e.g., toast notification)
			// Example: toast({ variant: 'destructive', title: 'Sign-in failed', description: error instanceof Error ? error.message : String(error) });
		} finally {
			console.log('[signInWithWeb3] Finishing, setting loading false.');
			setIsAuthLoading(false); // Stop loading indicator in all cases
		}
	}

	// --- Sign-Out Logic ---
	async function signOutWithWeb3() {
		setIsAuthLoading(true);
		try {
			console.log('Signing out...');
			await signOut({ redirect: false }); // Sign out from NextAuth session
			disconnect(); // Disconnect from Wagmi (clears wallet connection state)
			console.log('Signed out and disconnected.');
		} catch (error) {
			console.error('Error during sign out:', error);
			// TODO: Implement user-friendly error handling
		} finally {
			setIsAuthLoading(false);
		}
	}

	// Determine button action based on session status
	const handleAction = () => {
		if (sessionStatus === 'authenticated') {
			signOutWithWeb3();
		} else {
			// Only allow sign-in attempt if not already loading/authenticating
			if (!isAuthLoading) {
				signInWithWeb3();
			}
		}
	};

	// --- Render Component ---
	// Disable button interactions until mounted to prevent hydration issues
	const isDisabled =
		!hasMounted || isAuthLoading || sessionStatus === 'loading'; // || account.isConnecting || account.isReconnecting;

	return (
		<div className='relative'>
			<Button
				onClick={handleAction}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				disabled={isDisabled}
				{...props}
			>
				{/* Show loading icon if authenticating or connecting */}
				{(isAuthLoading || sessionStatus === 'loading') && <LoadingIcon />}
				{/* Display button text */}
				{children || label}
			</Button>
			{/* Tooltip to show full address on hover */}
			{/* Only show tooltip if mounted and address exists */}
			{hasMounted && (
				<AddressTooltip
					show={showTooltip}
					label={account.address}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
				/>
			)}
		</div>
	);
}
