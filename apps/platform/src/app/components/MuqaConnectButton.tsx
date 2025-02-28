'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';

import { Button, ButtonProps } from './Button';
import { PropsWithChildren } from 'react';
import { useTranslations } from 'next-intl';
import { signIn, signOut, useSession } from 'next-auth/react';
import { comethConnector } from '@allo/kit';
import { useRouter } from 'next/navigation';

// Check if we're running on the server
const isServer = typeof window === 'undefined';

const TRUNCATE_LENGTH = 20;
const TRUNCATE_OFFSET = 3;

const truncate = (str?: `0x${string}`) =>
	str && str.length > TRUNCATE_LENGTH
		? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
		: `${str}`;

// Safely use translations with fallbacks
function useTranslationsSafe(namespace: string) {
	try {
		return useTranslations(namespace);
	} catch (error) {
		console.warn(
			`Translation namespace '${namespace}' not available, using fallbacks`,
		);
		// Return a fallback function that returns the key with default translations
		return (key: string) => {
			// Default translations for common button states
			const defaults: Record<string, string> = {
				connect: 'Connect',
				connecting: 'Connecting...',
				reconnect: 'Reconnect',
				disconnect: 'Disconnect',
				authenticate: 'Authenticate',
			};

			return defaults[key] || key;
		};
	}
}

// Function to get a nonce from the server
const getNonce = async (address: string): Promise<string> => {
	// Don't attempt to get nonce on the server
	if (isServer) {
		console.log('Skipping getNonce on server');
		throw new Error('Cannot get nonce on the server');
	}

	try {
		console.log('Getting nonce for address:', address);
		const response = await fetch('/api/auth/web3/nonce', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ address }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`Failed to get nonce: ${response.status} ${response.statusText}`,
				errorText,
			);
			throw new Error(
				`Failed to get nonce: ${response.status} ${response.statusText}`,
			);
		}

		const data = await response.json();
		if (!data.nonce) {
			console.error('No nonce returned from server:', data);
			throw new Error('No nonce returned from server');
		}
		return data.nonce;
	} catch (error) {
		console.error('Error getting nonce:', error);
		throw error;
	}
};

// Modified to not use hooks internally
function getButtonLabel(
	isClient: boolean,
	account: ReturnType<typeof useAccount>,
	session: ReturnType<typeof useSession>,
	t: (key: string) => string,
) {
	if (!isClient) return 'Connect';

	const { isConnected, isConnecting, isReconnecting } = account;
	const isAuthenticated = session.status === 'authenticated';

	let label = t('connect');
	const address = truncate(account.address);

	if (isConnecting) label = t('connecting');
	else if (isReconnecting) label = t('reconnect');
	else if (isConnected && isAuthenticated)
		label = `${t('disconnect')} ${address}`;
	else if (isConnected) {
		// Fallback if translation is missing
		try {
			label = `${t('authenticate')} ${address}`;
		} catch (error) {
			label = `Authenticate ${address}`;
		}
	}

	return label;
}

function AddressTooltip({
	label,
	onMouseEnter,
	onMouseLeave,
}: {
	label: `0x${string}`;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}) {
	const copyToClipboard = () => {
		// Skip clipboard operations on the server
		if (typeof navigator === 'undefined') return;

		navigator.clipboard.writeText(label);
	};

	return (
		<div
			className='absolute right-0 top-8 mt-2 flex w-max items-center rounded bg-gray-700 p-2 font-mono text-sm text-white'
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<span>{label}</span>
			<button
				onClick={copyToClipboard}
				className='ml-2 rounded bg-gray-600 p-1 transition-colors duration-150 ease-in-out hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 active:bg-gray-400'
				title='Copy to clipboard'
			>
				<span className='inline-block transform transition-transform duration-150 ease-in-out active:scale-90'>
					📋
				</span>
			</button>
		</div>
	);
}

function LoadingIcon({ account }: { account: ReturnType<typeof useAccount> }) {
	// Don't check for window here - this causes hydration mismatch
	const { isConnecting: accountConnecting, isReconnecting } = account;
	const isLoading = accountConnecting || isReconnecting;

	if (!isLoading) return null;

	return (
		<div className='border-primary mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-t-2'></div>
	);
}

export default function MuqaConnectButton({
	children,
	...props
}: PropsWithChildren<ButtonProps>): JSX.Element {
	// Always call hooks at the top level
	const [isClient, setIsClient] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectAttempts, setConnectAttempts] = useState(0);
	const router = useRouter();

	// Call all wagmi hooks at the top level
	const account = useAccount();
	const { connectAsync } = useConnect();
	const { disconnectAsync } = useDisconnect();
	const { signMessageAsync } = useSignMessage();
	const session = useSession();

	// Always call the translations hook, regardless of client state
	const t = useTranslationsSafe('auth');

	// Define event handlers - converted to useCallback to maintain consistent hook order
	const onMouseEnter = useCallback(
		() => setShowTooltip(!!account?.address && true),
		[account?.address],
	);
	const onMouseLeave = useCallback(() => setShowTooltip(false), []);

	// Set up client-side detection
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Clear error when connection status changes
	useEffect(() => {
		if (account.isConnected) {
			setConnectionError(null);
			setConnectAttempts(0);
		}
	}, [account.isConnected]);

	// Get the label using the translation function we've already called
	const label = getButtonLabel(isClient, account, session, t);

	const signInWithWeb3 = useCallback(async () => {
		// Don't attempt to sign in on the server
		if (isServer) {
			console.log('Skipping signInWithWeb3 on server');
			return;
		}

		try {
			setConnectionError(null);
			setIsConnecting(true);
			console.log('Attempting to connect with Cometh...');

			// Connect using our custom Cometh connector if not already connected
			if (!account.isConnected) {
				try {
					setConnectAttempts(prev => prev + 1);
					console.log(`Connection attempt ${connectAttempts + 1}`);

					const result = await connectAsync({ connector: comethConnector });
					const address = result.accounts[0];

					if (!address) {
						const error = 'No address returned from connector';
						console.error(error);
						setConnectionError(error);
						throw new Error(error);
					}

					console.log('Successfully connected with address:', address);
				} catch (error) {
					console.error('Error connecting with Cometh:', error);

					// Provide more specific error messages based on the error
					let errorMessage = 'Failed to connect wallet';
					if (error instanceof Error) {
						if (error.message.includes('timeout')) {
							errorMessage = 'Connection timed out. Please try again.';
						} else if (error.message.includes('passkey')) {
							errorMessage =
								'Passkey error. Please check your browser settings.';
						} else if (error.message.includes('disconnected')) {
							errorMessage = 'Connection was disconnected. Please try again.';
						} else {
							errorMessage = error.message;
						}
					}

					setConnectionError(errorMessage);
					setIsConnecting(false);
					return; // Exit early if connection fails
				}
			}

			// If already connected but not authenticated with NextAuth, authenticate with backend
			if (
				account.isConnected &&
				session.status !== 'authenticated' &&
				account.address
			) {
				try {
					// Get nonce from the server
					const nonce = await getNonce(account.address);
					console.log('Got nonce:', nonce);

					try {
						// Sign the nonce with the wallet
						console.log('Signing message:', nonce);
						const signedNonce = await signMessageAsync({ message: nonce });
						console.log('Signed nonce:', signedNonce);

						// Authenticate with the backend
						const result = await signIn('credentials', {
							address: account.address,
							signedNonce: signedNonce,
							redirect: false,
						});

						if (result?.error) {
							console.error('Authentication error:', result.error);
							setConnectionError(result.error);
						} else {
							console.log('Successfully authenticated with backend');
						}
					} catch (error) {
						console.error('Error signing message:', error);
						setConnectionError(
							error instanceof Error
								? `Signing error: ${error.message}`
								: 'Failed to sign message',
						);
					}
				} catch (error) {
					console.error('Error during authentication:', error);
					setConnectionError(
						error instanceof Error
							? `Authentication error: ${error.message}`
							: 'Failed to authenticate',
					);
				}
			}

			setIsConnecting(false);
		} catch (error) {
			console.error('Error connecting wallet:', error);
			// Set error message for user feedback
			setConnectionError(
				error instanceof Error ? error.message : 'Failed to connect wallet',
			);
			setIsConnecting(false);
		}
	}, [
		connectAsync,
		signMessageAsync,
		account,
		session.status,
		connectAttempts,
		setConnectionError,
	]);

	// Don't auto-connect on refresh
	useEffect(() => {
		// Skip on server
		if (isServer) return;

		// Only run this effect once
		if (isClient && !autoConnectAttempted) {
			setAutoConnectAttempted(true);

			// If we're already connected but not authenticated, try to authenticate
			if (
				account.isConnected &&
				session.status !== 'authenticated' &&
				account.address
			) {
				console.log(
					'Already connected but not authenticated, attempting to authenticate...',
				);
				signInWithWeb3();
			}
		}
	}, [
		isClient,
		autoConnectAttempted,
		account.isConnected,
		session.status,
		account.address,
		signInWithWeb3,
	]);

	const signOutWithWeb3 = useCallback(async () => {
		// Don't attempt to sign out on the server
		if (isServer) {
			console.log('Skipping signOutWithWeb3 on server');
			return;
		}

		try {
			console.log('Signing out...');
			setIsConnecting(true);

			// Sign out from NextAuth first
			await signOut({ redirect: false });

			// Then disconnect from wallet
			if (account.isConnected) {
				await disconnectAsync();
			}

			console.log('Successfully signed out');
			setIsConnecting(false);
		} catch (error) {
			console.error('Error signing out:', error);
			setConnectionError(
				error instanceof Error ? error.message : 'Failed to sign out',
			);
			setIsConnecting(false);
		}
	}, [disconnectAsync, account.isConnected]);

	// Handle button click based on connection state
	const handleClick = useCallback(() => {
		if (isConnecting) return; // Prevent multiple clicks while processing

		if (account.isConnected && session.status === 'authenticated') {
			signOutWithWeb3();
		} else {
			signInWithWeb3();
		}
	}, [
		account.isConnected,
		session.status,
		signInWithWeb3,
		signOutWithWeb3,
		isConnecting,
	]);

	// Only show tooltip on the client side when we have an address
	const shouldShowTooltip = isClient && showTooltip && !!account?.address;

	// Only show loading icon on client-side to prevent hydration mismatch
	const showLoadingIcon =
		isClient &&
		(account.isConnecting || account.isReconnecting || isConnecting);

	return (
		<div className='relative'>
			<Button
				onClick={handleClick}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				disabled={isConnecting}
				{...props}
			>
				{showLoadingIcon ? <LoadingIcon account={account} /> : null}
				{isConnecting ? t('connecting') : label}
			</Button>
			{shouldShowTooltip && account.address && (
				<AddressTooltip
					label={account.address}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
				/>
			)}
			{connectionError && (
				<div className='absolute right-0 top-full mt-2 rounded bg-red-100 p-2 text-sm text-red-700'>
					{connectionError}
					{connectAttempts > 0 && (
						<button
							onClick={signInWithWeb3}
							className='ml-2 font-semibold underline'
						>
							Retry
						</button>
					)}
				</div>
			)}
		</div>
	);
}
