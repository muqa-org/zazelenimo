'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { comethConnector } from './config';
import { Button } from './ui/button';

const TRUNCATE_LENGTH = 20;

const truncate = (str: string) =>
  str.length > TRUNCATE_LENGTH ? `${str.slice(0, TRUNCATE_LENGTH)}...` : str;

export function ComethButton(): JSX.Element {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const account = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  let label = 'Connect';

  if (isConnecting) label = 'Connecting';
  else if (isReconnecting) label = 'REConnecting';
  else if (isConnected) label = `Disconnect ${account.address}`;
  else label = 'Connect';

  const onClick =
    account.status === 'disconnected'
      ? () => connect({ connector: comethConnector })
      : () => disconnect();

  return (
    <>
      <Button isLoading={account.isConnecting} onClick={onClick}>
        {truncate(label)}
      </Button>
    </>
  );
}
