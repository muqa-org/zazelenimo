'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useEffect, useState } from 'react';

import { Button, ButtonProps } from './Button';
import { PropsWithChildren } from 'react';
import { useTranslations } from 'next-intl';
import { signIn, signOut } from 'next-auth/react';
import { WalletNonceResponse } from '../api/auth/web3/nonce/route';
import { comethConnector } from '@allo/kit';

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
		// Return a fallback function that returns the key
		return (key: string) => key;
	}
}

function getLabel(isClient: boolean, account: ReturnType<typeof useAccount>) {
	// Only try to use translations on the client side
	if (!isClient) return 'Connect';

	const t = useTranslationsSafe('auth');
	const { isConnected, isConnecting, isReconnecting } = account;

	let label = t('connect');
	const address = truncate(account.address);

	if (isConnecting) label = t('connecting');
	else if (isReconnecting) label = t('reconnect');
	else if (isConnected) label = `${t('disconnect')} ${address}`;

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
	// On the server or when not loading, return null
	// This ensures consistent rendering between server and client
	if (typeof window === 'undefined') return null;

	const { isConnecting, isReconnecting } = account;
	const isLoading = isConnecting || isReconnecting;

	if (!isLoading) return null;

	return (
		<div className='border-primary mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-t-2'></div>
	);
}

async function getNonce(address: `0x${string}`) {
	const body = JSON.stringify({ address });
	const headers = {
		'Content-Type': 'application/json',
	};

	const res = await fetch('/api/auth/web3/nonce', {
		method: 'POST',
		headers,
		body,
	});

	const { nonce } = (await res.json()) as WalletNonceResponse;
	return nonce;
}

export default function MuqaConnectButton({
	children,
	...props
}: PropsWithChildren<ButtonProps>): JSX.Element {
	// Always call hooks at the top level
	const [isClient, setIsClient] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);

	// Call all wagmi hooks at the top level
	const account = useAccount();
	const { connectAsync } = useConnect();
	const { disconnect } = useDisconnect();
	const { signMessageAsync } = useSignMessage();

	// Set up client-side detection
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Clear error when connection status changes
	useEffect(() => {
		if (account.isConnected) {
			setConnectionError(null);
		}
	}, [account.isConnected]);

	// Get the label based on client state and account data
	const label = isClient ? getLabel(isClient, account) : 'Connect';

	// Define event handlers
	const onMouseEnter = () => setShowTooltip(!!account?.address && true);
	const onMouseLeave = () => setShowTooltip(false);

	async function signInWithWeb3() {
		try {
			setConnectionError(null);
			console.log('Attempting to connect with Cometh...');

			// Clear the disconnection flag since user is explicitly connecting
			try {
				localStorage.removeItem('cometh_user_disconnected');
			} catch (error) {
				console.error('Error clearing disconnect flag:', error);
			}

			// Connect using our custom Cometh connector
			// This will check for existing passkeys first before prompting to create a new one
			const result = await connectAsync({ connector: comethConnector });
			const address = result.accounts[0];

			if (!address) {
				const error = 'No address returned from connector';
				console.error(error);
				setConnectionError(error);
				throw new Error(error);
			}

			console.log('Successfully connected with address:', address);

			// The smart account is already initialized in the connector
			// No need to initialize it again

			// If you need to authenticate with your backend:
			// const nonce = await getNonce(address);
			// const signedNonce = await signMessageAsync({ message: nonce });
			// await signIn('credentials', { address, signedNonce, redirect: false });
		} catch (error) {
			console.error('Error connecting wallet:', error);
			// Set error message for user feedback
			setConnectionError(
				error instanceof Error ? error.message : 'Failed to connect wallet',
			);
		}
	}

	async function signOutWithWeb3() {
		try {
			setConnectionError(null);
			console.log('Disconnecting wallet...');

			// Set the disconnection flag to prevent automatic reconnection
			try {
				localStorage.setItem('cometh_user_disconnected', 'true');
			} catch (error) {
				console.error('Error setting disconnect flag:', error);
			}

			// Disconnect from the wallet
			disconnect();

			// Sign out from the backend if needed
			await signOut();

			console.log('Successfully disconnected wallet');
		} catch (error) {
			console.error('Error disconnecting wallet:', error);
			setConnectionError(
				error instanceof Error ? error.message : 'Failed to disconnect wallet',
			);
		}
	}

	function onClick() {
		// Only allow connection/disconnection on the client side
		if (!isClient) return;

		return account.isConnected ? signOutWithWeb3() : signInWithWeb3();
	}

	// Only render LoadingIcon on the client side
	const showLoadingIcon =
		isClient && (account.isConnecting || account.isReconnecting);

	// Only show tooltip on the client side when we have an address
	const shouldShowTooltip = isClient && showTooltip && !!account?.address;

	return (
		<div className='relative'>
			<Button
				onClick={onClick}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				{...props}
			>
				{showLoadingIcon && <LoadingIcon account={account} />}
				{children || label}
			</Button>
			{shouldShowTooltip && account.address && (
				<AddressTooltip
					label={account.address}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
				/>
			)}
			{connectionError && isClient && (
				<div className='absolute right-0 top-12 mt-2 w-max rounded bg-red-500 p-2 text-sm text-white'>
					{connectionError}
				</div>
			)}
		</div>
	);
}
