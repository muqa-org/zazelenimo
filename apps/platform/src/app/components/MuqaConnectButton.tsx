// File: apps/platform/src/app/components/MuqaConnectButton.tsx
'use client';

// *** Allo Kit Imports ***
import { comethConfig } from '@allo/kit'; // Ensure this path is correct
// *** Direct Cometh SDK Imports ***
import {
	createSafeSmartAccount,
	createSmartAccountClient,
	retrieveAccountAddressFromPasskeys,
	createComethPaymasterClient // Import if using paymaster
} from "@cometh/connect-sdk-4337";
import { http, type Address } from "viem"; // Import Address type

// *** NextAuth Imports ***
import { signIn, signOut, useSession } from 'next-auth/react';

// *** React/Next Imports ***
import { useTranslations } from 'next-intl';
import { PropsWithChildren, useState } from 'react';

// *** Wagmi Imports (Keep for status/disconnect) ***
import { useAccount, useDisconnect } from 'wagmi';

// *** Local Imports ***
import { Button, ButtonProps } from './Button'; // Ensure Button component path is correct
import { WalletNonceResponse } from '../api/auth/web3/nonce/route'; // Ensure API route path is correct

// --- Helper Functions ---

const TRUNCATE_LENGTH = 10; // Adjusted for better readability
const TRUNCATE_OFFSET = 4;

const truncate = (str?: `0x${string}`): string =>
	str && str.length > TRUNCATE_LENGTH + TRUNCATE_OFFSET + 2 // Adjust length check
		? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
		: str ?? ''; // Return empty string if undefined

// Fetches the nonce from the backend API
async function getNonce(address: `0x${string}`): Promise<string> {
	const body = JSON.stringify({ address });
	const headers = {
		'Content-Type': 'application/json',
	};

	const res = await fetch('/api/auth/web3/nonce', { // Make sure this API path is correct
		method: 'POST',
		headers,
		body,
	});
	if (!res.ok) {
		const errorBody = await res.text();
		console.error("Nonce API Error Response:", errorBody);
		throw new Error(`Failed to fetch nonce: ${res.statusText}`);
	}

	const { nonce } = (await res.json()) as WalletNonceResponse;
	if (!nonce) {
		throw new Error('Nonce not received from API');
	}
	return nonce;
}

// Displays loading spinner
function LoadingIcon() {
	return (
		<div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white'></div>
	);
}

// Tooltip for displaying full address
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
			// Optional: Add feedback like a toast message
		}
	};

	return (
		<>
			{show && !!label && (
				<div
					className='absolute right-0 top-full z-10 mt-2 flex w-max items-center rounded bg-gray-700 p-2 font-mono text-xs text-white shadow-lg' // Adjusted styling
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
				>
					<span>{label}</span>
					<button
						onClick={copyToClipboard}
						className='ml-2 rounded bg-gray-600 p-1 transition-colors duration-150 ease-in-out hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 active:bg-gray-400' // Adjusted styling
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


// --- Main Component ---

export default function MuqaConnectButton({
	children,
	...props
}: PropsWithChildren<ButtonProps>): JSX.Element {
	// Wagmi hook for general connection status and address display
	const account = useAccount();
	// Wagmi hook for disconnecting
	const { disconnect } = useDisconnect();
	// NextAuth hook for session management
	const { status: sessionStatus } = useSession();
	// Local state for tooltip visibility
	const [showTooltip, setShowTooltip] = useState(false);
	// Local state for loading during the auth process
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	// Translation hook
	const t = useTranslations('auth');

	// Determines the button label based on connection and session status
	const getLabel = () => {
		const address = truncate(account.address);
		if (sessionStatus === 'loading' || isAuthLoading) return t('connecting'); // Show generic loading
		if (sessionStatus === 'authenticated') return `${t('disconnect')} ${address}`;
		if (account.isConnecting || account.isReconnecting) return t('connecting');
		return t('connect');
	};

	const label = getLabel();

	// Tooltip handlers
	const onMouseEnter = () => setShowTooltip(!!account?.address && true);
	const onMouseLeave = () => setShowTooltip(false);

	// --- Sign-In Logic using Direct Cometh SDK Calls ---
	async function signInWithWeb3() {
		setIsAuthLoading(true);
		let walletAddress: Address | null = null;
		let smartAccountClient: any = null; // Use 'any' for flexibility or define a specific type

		try {
			// --- Login Flow Attempt ---
			// Tries to retrieve an existing wallet address using a passkey.
			try {
				console.log("Attempting login: retrieving address via passkey...");
				const retrievedAddress = await retrieveAccountAddressFromPasskeys(
					comethConfig.apiKey,
					comethConfig.chain
				);

				if (retrievedAddress) {
					walletAddress = retrievedAddress as Address;
					console.log("Login: Retrieved Wallet Address:", walletAddress);

					// If address found, initialize the client for the existing account (two-step process)
					console.log("Login: Initializing SmartAccount client for existing address...");
					const smartAccount = await createSafeSmartAccount({
						apiKey: comethConfig.apiKey,
						chain: comethConfig.chain,
						smartAccountAddress: walletAddress, // Provide the retrieved address
					});

					// Optional: Setup Paymaster for gasless transactions
					const paymasterClient = await createComethPaymasterClient({
						transport: http(comethConfig.paymasterUrl),
						chain: comethConfig.chain,
					});

					smartAccountClient = createSmartAccountClient({
						account: smartAccount,
						chain: comethConfig.chain,
						bundlerTransport: http(comethConfig.bundlerUrl),
						paymaster: paymasterClient, // Include paymaster if configured
					});
					console.log("Login: SmartAccountClient obtained for existing account.");

				} else {
					console.log("Login: No existing passkey selected or found. Proceeding to account creation.");
					// If no address retrieved, fall through to the creation flow below.
				}

			} catch (loginError) {
				// Log error and fall through to creation flow.
				console.warn("Login attempt failed, proceeding to account creation:", loginError);
			}

			// --- Account Creation Flow (if login didn't succeed) ---
			// This block executes if the login attempt failed or was skipped.
			if (!walletAddress || !smartAccountClient) {
				console.log("Attempting account creation...");
				// Create a new smart account and get its predicted address and client instance.
				const smartAccount = await createSafeSmartAccount({
					apiKey: comethConfig.apiKey,
					chain: comethConfig.chain,
					// No smartAccountAddress is provided for creation.
				});
				walletAddress = smartAccount.address as Address;
				console.log("Creation: Smart Account instance created.");
				console.log("Creation: Wallet Address:", walletAddress);

				// Optional: Setup Paymaster
				const paymasterClient = await createComethPaymasterClient({
					transport: http(comethConfig.paymasterUrl),
					chain: comethConfig.chain,
				});

				smartAccountClient = createSmartAccountClient({
					account: smartAccount,
					chain: comethConfig.chain,
					bundlerTransport: http(comethConfig.bundlerUrl),
					paymaster: paymasterClient, // Include paymaster if configured
				});
				console.log('Creation: SmartAccountClient initialized.');
			}

			// Ensure we have the address and client before proceeding
			if (!walletAddress || !smartAccountClient) {
				throw new Error(
					'Failed to obtain wallet address or smart account client.',
				);
			}

			// Step 4: Fetch Nonce from Backend
			console.log('Fetching nonce for address:', walletAddress);
			const nonce = await getNonce(walletAddress);
			console.log('Nonce received:', nonce);

			// Step 5: Sign Nonce using the obtained SmartAccountClient
			console.log('Signing nonce...');
			const messageToSign = nonce; // Sign the raw nonce value
			const signedNonce = await smartAccountClient.signMessage({
				message: messageToSign,
			});
			console.log('Nonce signed:', signedNonce);

			// Step 6: Call NextAuth signIn with Credentials
			// Sends address, signed nonce, and original nonce (challenge) to the backend authorize function.
			console.log('Calling NextAuth signIn...');
			const result = await signIn('credentials', {
				address: walletAddress,
				signedNonce,
				challenge: nonce, // Pass the original nonce as 'challenge'
				redirect: false, // Prevent NextAuth automatic redirection
			});

			console.log('NextAuth signIn response:', result);

			// Handle NextAuth sign-in response
			if (result?.error) {
				throw new Error(`NextAuth sign-in failed: ${result.error}`);
			} else if (result?.ok) {
				console.log('NextAuth Sign-In Successful');
				// The useSession hook will automatically update the session state.
			}

		} catch (error: any) {
			console.error('Error during sign-in process:', error);
			// TODO: Implement user-friendly error handling (e.g., toast notification)
			// Example: toast({ variant: 'destructive', title: 'Sign-in failed', description: error.message });
		} finally {
			setIsAuthLoading(false); // Stop loading indicator
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
			signInWithWeb3();
		}
	};

	// --- Render Component ---
	return (
		<div className='relative'>
			<Button
				onClick={handleAction}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				// Disable button during authentication, session loading, or Wagmi connection processes
				disabled={
					sessionStatus === 'loading' ||
					isAuthLoading ||
					account.isConnecting ||
					account.isReconnecting
				}
				{...props} // Pass other button props like className, variant, etc.
			>
				{/* Show loading icon if authenticating or connecting */}
				{(isAuthLoading ||
					account.isConnecting ||
					account.isReconnecting ||
					sessionStatus === 'loading') && <LoadingIcon />}
				{/* Display button text */}
				{children || label}
			</Button>
			{/* Tooltip to show full address on hover */}
			<AddressTooltip
				show={showTooltip}
				label={account.address} // Display address from useAccount for UI
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			/>
		</div>
	);
}
