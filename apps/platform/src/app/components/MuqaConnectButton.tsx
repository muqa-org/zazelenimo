'use client';

import { comethConnector, useCometh } from '@allo/kit'; // Import useCometh
import { signIn, signOut, useSession } from 'next-auth/react'; // Import useSession
import { useTranslations } from 'next-intl';
import { PropsWithChildren, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';

import { Button, ButtonProps } from './Button';
import { WalletNonceResponse } from '../api/auth/web3/nonce/route';

const TRUNCATE_LENGTH = 20;
const TRUNCATE_OFFSET = 3;

const truncate = (str?: `0x${string}`) =>
	str && str.length > TRUNCATE_LENGTH
		? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
		: `${str}`;

function getLabel() {
	const t = useTranslations('auth');
	const { isConnected, isConnecting, isReconnecting } = useAccount();
	const account = useAccount();

	let label = t('connect');
	const address = truncate(account.address);

	if (isConnecting) label = t('connecting');
	else if (isReconnecting) label = t('reconnect');
	else if (isConnected) label = `${t('disconnect')} ${address}`;

	return label;
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
			)}
		</>
	);
}

function LoadingIcon() {
	const { isConnecting, isReconnecting } = useAccount();
	const isLoading = isConnecting || isReconnecting;

	return (
		<>
			{isLoading && (
				<div className='border-primary mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-t-2'></div>
			)}
		</>
	);
}

async function getNonce(address: `0x${string}`): Promise<string> {
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
		throw new Error('Failed to fetch nonce');
	}

	const { nonce } = (await res.json()) as WalletNonceResponse;
	if (!nonce) {
		throw new Error('Nonce not received from API');
	}
	return nonce;
}

export default function MuqaConnectButton({
	children,
	...props
}: PropsWithChildren<ButtonProps>): JSX.Element {
	const account = useAccount();
	const { connectAsync } = useConnect();
	const { disconnect } = useDisconnect();
	const { signMessageAsync } = useSignMessage();
	const { data: session, status: sessionStatus } = useSession(); // Use session status
	const { client: comethClient } = useCometh(); // Get the initialized Cometh client
	const [showTooltip, setShowTooltip] = useState(false);

	// Adjust label based on session status as well
	const label = getLabel();

	const onMouseEnter = () => setShowTooltip(!!account?.address && true);
	const onMouseLeave = () => setShowTooltip(false);

	async function signInWithWeb3() {
		try {
			// 1. Connect wallet if not already connected
			let address = account.address;
			if (!account.isConnected) {
				console.log('Connecting wallet...');
				const result = await connectAsync({ connector: comethConnector });
				address = result.accounts[0];
				if (!address) throw new Error('No address returned from connector');
				console.log('Wallet connected:', address);
			} else {
				console.log('Wallet already connected:', address);
			}

			// Ensure address is available
			if (!address) {
				console.error('Address is still undefined after connection attempt.');
				return; // Exit if address couldn't be obtained
			}
			// 2. Fetch Nonce from backend
			console.log('Fetching nonce for address:', address);
			const nonce = await getNonce(address);
			console.log('Nonce received:', nonce);

			// 3. Sign Nonce
			// IMPORTANT: Use the Cometh Client (SmartAccountClient) to sign
			if (!comethClient) {
				console.error('Cometh client not available for signing.');
				// Optionally, you could try to re-initialize or wait for it
				return;
			}
			console.log('Signing nonce...');
			// Use signMessage on the smart account client instance
			const signedNonce = await comethClient.signMessage({ message: nonce });
			console.log('Nonce signed:', signedNonce);

			// 4. Sign in with NextAuth credentials provider
			console.log('Calling NextAuth signIn...');
			const signInResponse = await signIn('credentials', {
				address,
				signedNonce,
				redirect: false, // Important: prevent NextAuth from redirecting
			});

			console.log('NextAuth signIn response:', signInResponse);

			if (signInResponse?.error) {
				console.error('NextAuth Sign-In Error:', signInResponse.error);
				// Handle sign-in error (e.g., show a toast notification)
			} else if (signInResponse?.ok) {
				console.log('NextAuth Sign-In Successful');
				// Optional: Force a session refresh if needed, though useSession should update
				// window.location.reload(); // Or use router.refresh() in Next.js 13+ App Router
			}
		} catch (error) {
			console.error('Error during sign-in process:', error);
			// Handle errors (e.g., show a toast notification to the user)
		}
	}

	async function signOutWithWeb3() {
		try {
			console.log('Signing out...');
			await signOut({ redirect: false }); // Sign out from NextAuth
			disconnect(); // Disconnect wagmi
			console.log('Signed out and disconnected.');
		} catch (error) {
			console.error('Error disconnecting wallet:', error);
		}
	}

	// Decide onClick action based on NextAuth session status primarily
	const handleAction = () => {
		if (sessionStatus === 'authenticated') {
			signOutWithWeb3();
		} else {
			signInWithWeb3();
		}
	};

	return (
		<div className='relative'>
			{/* Disable button while session is loading or wallet is connecting */}
			<Button
				onClick={handleAction}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				disabled={
					sessionStatus === 'loading' ||
					account.isConnecting ||
					account.isReconnecting
				}
				{...props}
			>
				<LoadingIcon />
				{/* Show loading state if session is loading */}
				{sessionStatus === 'loading' ? 'Loading...' : children || label}
			</Button>
			<AddressTooltip
				show={showTooltip}
				label={account.address}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			/>
		</div>
	);
}
