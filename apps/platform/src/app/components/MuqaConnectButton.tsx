'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';

import { Button, ButtonProps } from './Button';
import { PropsWithChildren, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn, signOut } from 'next-auth/react';
import { WalletNonceResponse } from '../api/auth/web3/nonce/route';
import { comethConnector } from '@allo/kit/wagmi/connectors/cometh';

const TRUNCATE_LENGTH = 20;
const TRUNCATE_OFFSET = 3;

const truncate = (str?: `0x${string}`) => str && str.length > TRUNCATE_LENGTH
  ? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
  : `${str}`;

function getLabel() {
  const t = useTranslations('auth');
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const account = useAccount()

  let label = t('connect');
  const address = truncate(account.address);

  if (isConnecting) label = t('connecting');
  else if (isReconnecting) label = t('reconnect');
  else if (isConnected) label = `${t('disconnect')} ${address}`;

  return label;
}

function AddressTooltip({ show, label, onMouseEnter, onMouseLeave }: {
  show: boolean,
  label?: `0x${string}`,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void
}) {
  const copyToClipboard = () => {
    if (label) {
      navigator.clipboard.writeText(label);
    }
  };

  return (
    <>
    {show && !!label && (
      <div className="absolute top-8 right-0 mt-2 w-max p-2 bg-gray-700 font-mono text-white text-sm rounded flex items-center"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <span>{label}</span>
        <button
          onClick={copyToClipboard}
          className="ml-2 p-1 bg-gray-600 hover:bg-gray-500 rounded active:bg-gray-400 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400"
          title="Copy to clipboard"
        >
          <span className="transform inline-block transition-transform duration-150 ease-in-out active:scale-90">
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
    {isLoading && <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-primary rounded-full"></div>}
    </>
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

  const { nonce } = await res.json() as WalletNonceResponse;
  return nonce;
}

export default function MuqaConnectButton({ children, ...props }: PropsWithChildren<ButtonProps>): JSX.Element {
  const account = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [showTooltip, setShowTooltip] = useState(false);
  const label = getLabel();

  const onMouseEnter = () => setShowTooltip(!!account?.address && true);
  const onMouseLeave = () => setShowTooltip(false);

  async function signInWithWeb3() {
    try {
      // Connect using our custom Cometh connector
      const result = await connectAsync({ connector: comethConnector });
      const address = result.accounts[0];

      if (!address) {
        throw new Error('No address returned from connector');
      }

      // The smart account is already initialized in the connector
      // No need to initialize it again
      
      // Get nonce and sign it (if needed)
      // const nonce = await getNonce(address);
      // const signedNonce = await signMessageAsync({ message: nonce });
      // await signIn('credentials', { address, signedNonce, redirect: false });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }

  async function signOutWithWeb3() {
    try {
      disconnect();
      await signOut();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  function onClick() {
    return account.isConnected
      ? signOutWithWeb3()
      : signInWithWeb3();
  }

  return (
    <div className='relative'>
      <Button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...props}
      >
        <LoadingIcon />
        {children || label}
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
