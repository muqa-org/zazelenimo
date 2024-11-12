'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { AddressTooltip } from './AddressTooltip';
import { Button, ButtonProps } from '../Button';
import { comethConnector, useCometh } from '@allo/kit';
import { PropsWithChildren, useEffect, useState, useRef, forwardRef } from 'react';
import { getSession, signIn, signOut, useSession } from 'next-auth/react';
import { useConnection } from '../../contexts/ConnectionContext';
import { v4 as uuidv4 } from 'uuid';
import { getLabel, getNonce } from './utils';
import { LoadingIcon } from './LoadingIcon';


type MuqaConnectButtonProps = ButtonProps & {
  afterSignIn?: () => unknown,
  ref?: React.Ref<HTMLButtonElement>
}

const MuqaConnectButton = forwardRef<HTMLButtonElement, MuqaConnectButtonProps>(
  ({
    children,
    type,
    afterSignIn,
    ...buttonProps
  }: PropsWithChildren<MuqaConnectButtonProps>,
  ref: React.Ref<HTMLButtonElement>
): JSX.Element => {
  const account = useAccount();
  const { wallet } = useCometh();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const [showTooltip, setShowTooltip] = useState(false);
  const label = getLabel();
	const { data: session } = useSession();
  const { pendingConnectionId, setPendingConnection } = useConnection();

  // Create a unique ID for this component instance
  const instanceId = useRef(uuidv4());

  const onMouseEnter = () => setShowTooltip(!!account?.address && true);
  const onMouseLeave = () => setShowTooltip(false);

  async function signInWithWeb3(address: `0x${string}`) {
    // const address = '0xFA3D3936D7839c17b3cE899D94f4990750663d0E';
    const nonce = await getNonce(address!);
    const signedNonce = await wallet!.signMessage(nonce).catch(err => {
      console.error('Error signing nonce', err);
      console.error(err);
      return disconnect();
    });
    return signIn('credentials', { address, signedNonce, redirect: false });
  }

  async function signOutWithWeb3() {
    disconnect();
    await signOut()
  }

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (afterSignIn) {
      e.preventDefault();
    }

    if (account.isConnected) {
      return signOutWithWeb3();
    }

    setPendingConnection(instanceId.current);
    await connectAsync({ connector: comethConnector });
  }

  useEffect(() => {
    console.log('pendingConnectionId', pendingConnectionId);
    if (instanceId.current !== pendingConnectionId) return;

    // Only proceed if this is the most recent connection attempt
    if (!account.isConnected || session?.user) return;

    console.log('signing in with web3', instanceId.current);

    setPendingConnection(null);
    signInWithWeb3(account.address!).then(() => {
      afterSignIn ? getSession().then(afterSignIn) : {}
    });
  }, [wallet]);



  useEffect(() => {
    console.log(`Component instance ID: ${instanceId.current}`);
  }, []);

  return (
     <div className='relative'>
      <Button
        ref={ref}
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
     </div>
  )
});

MuqaConnectButton.displayName = 'MuqaConnectButton';

export default MuqaConnectButton
