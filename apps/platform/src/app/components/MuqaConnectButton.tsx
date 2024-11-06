'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { Button, ButtonProps } from './Button';
import { comethConnector, useCometh } from '@allo/kit';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn, signOut, useSession } from 'next-auth/react';
import { WalletNonceResponse } from '../api/auth/web3/nonce/route';
import { ProfileEditModal, ProfileEditModalProps } from './auth/profile';
import { ProfileField, UserProfile } from '@/lib/next-auth/types';
import { getMissingFlowFields } from '@/lib/next-auth/validators';

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
  const { isConnecting } = useAccount();

  return (
    <>
    {isConnecting && <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-primary rounded-full"></div>}
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

type MuqaConnectButtonProps = ButtonProps & {
  flow: 'proposer' | 'donator' | undefined,
  onSave?: (data: Partial<UserProfile>) => Promise<boolean>,
}

export default function MuqaConnectButton({ children, flow, ...buttonProps }: PropsWithChildren<MuqaConnectButtonProps>): JSX.Element {
  const account = useAccount();
  const { wallet } = useCometh();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showTooltip, setShowTooltip] = useState(false);
  const label = getLabel();
  const [profileProps, setProfileProps] = useState<ProfileEditModalProps | null>(null);
	const { data: session } = useSession();


  const onMouseEnter = () => setShowTooltip(!!account?.address && true);
  const onMouseLeave = () => setShowTooltip(false);

  async function signInWithWeb3() {
    const address = account.address;
    // const address = '0xFA3D3936D7839c17b3cE899D94f4990750663d0E';
    const nonce = await getNonce(address!);
    const signedNonce = await wallet!.signMessage(nonce).catch(err => {
      console.error('Error signing nonce', err);
      return disconnect();
    });
    return signIn('credentials', { address, signedNonce, redirect: false });
  }

  async function signOutWithWeb3() {
    disconnect();
    await signOut();
  }

  async function onClick() {
    if (account.isConnected) {
      return signOutWithWeb3();
    }

    return connect({ connector: comethConnector });
  }

  useEffect(() => {
    if (account.isConnected && wallet && session) {
      signInWithWeb3();
    }
  }, [wallet]);

  useEffect(() => {
    if (!flow || !account.isConnected || !session) return;

    const user = session.user as UserProfile;
    const missingFields = getMissingFlowFields(user, flow);
    if (missingFields.length > 0) {
      showProfileModal(user, missingFields);
    }
  }, [account.isConnected, session]);

  async function showProfileModal(user: UserProfile, missingFields: ProfileField[]) {
    setProfileProps({
      user,
      missingFields,
      onSave: async (data: Partial<UserProfile>) => {
        console.log('UPDATING USER', data);
        return true;
      },
      onClose: () => setProfileProps(null),
      open: true,
    });
  }

  return (
     <div className='relative'>
      <Button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...buttonProps}
      >
        <LoadingIcon />
        {children || label}
      </Button>
      <AddressTooltip
        show={showTooltip}
        label={account.address}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave} />
      {profileProps && <ProfileEditModal {...profileProps} />}
     </div>
  )
}
