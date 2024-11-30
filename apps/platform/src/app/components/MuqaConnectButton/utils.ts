import { WalletNonceResponse } from '@/app/api/auth/web3/nonce/route';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';

const TRUNCATE_LENGTH = 20;
const TRUNCATE_OFFSET = 3;

const truncate = (str?: `0x${string}`) => str && str.length > TRUNCATE_LENGTH
  ? `${str.slice(0, TRUNCATE_OFFSET + 2)}...${str.slice(-TRUNCATE_OFFSET)}`
  : `${str}`;

export function getLabel() {
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

export async function getNonce(address: `0x${string}`) {
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
