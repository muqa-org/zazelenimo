'use client';

import { ComethWallet } from '@cometh/connect-sdk';
import { getConnectViemAccount } from '@cometh/connect-sdk-viem';
import { useState, useEffect } from 'react';
import { WalletClient } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';

import { ComethConnector } from '../config';

/**
 * A custom hook to manage Cometh wallet and client.
 *
 * @remarks
 * This hook handles the creation and management of Cometh wallet and client.
 * It's important to note that we need to explicitly assign the account to the client
 * because it doesn't get set automatically when using the Cometh connector.
 * This ensures that the account information is correctly associated with the client.
 *
 * @returns An object containing the Cometh client, wallet, and connector.
 */
export function useCometh() {
  const account = useAccount();
  const connector = account.connector as ComethConnector;
  const { data: walletClient } = useWalletClient();

  const [comethClient, setComethClient] = useState<WalletClient | null>();
  const [comethWallet, setComethWallet] = useState<ComethWallet | null>();

  async function createComethClient() {
    if (!walletClient) return;

    if (account.isConnected && connector) {
      const wallet = await connector.getComethWallet();
      const comethAccount = getConnectViemAccount(wallet);

      setComethWallet(wallet);
      // We need to explicitly assign the account because it doesn't get set automatically for some reason
      setComethClient({
        ...walletClient,
        account: comethAccount,
      });
    } else {
      setComethClient(walletClient);
    }
  }

  useEffect(() => {
    createComethClient();
  }, [account.isConnected, connector, walletClient]);

  return { client: comethClient, wallet: comethWallet, connector };
}
