import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import type { SmartAccount } from '@cometh/connect-sdk-4337';
import type { SmartAccountClient } from '@cometh/connect-sdk-4337/clients';

import { initializeSmartAccount } from '../config';

/**
 * A custom hook to manage Cometh smart account and client.
 *
 * @remarks
 * This hook handles the creation and management of Cometh smart account and client.
 * It uses the configuration from comethPublicClient and smartAccountClient to properly
 * initialize the 4337 smart account with the correct chain and API settings.
 *
 * @returns An object containing the Cometh smart account client and wallet.
 */
export function useCometh() {
  const account = useAccount();
  const [comethClient, setComethClient] = useState<SmartAccountClient | null>(null);
  const [comethWallet, setComethWallet] = useState<SmartAccount | null>(null);

  useEffect(() => {
    async function initializeAccount() {
      try {
        // Initialize smart account client using the config
        const smartAccountClient = await initializeSmartAccount(
          account.isConnected ? account.address : undefined
        );

        // Get the smart account instance from the client
        const smartAccount = smartAccountClient.account;

        setComethClient(smartAccountClient);
        setComethWallet(smartAccount);

      } catch (error) {
        console.error('Error initializing Cometh account:', error);
      }
    }

    initializeAccount();
  }, [account.isConnected, account.address]);

  return {
    client: comethClient,
    wallet: comethWallet,
    isConnected: account.isConnected,
    status: account.status,
    address: account.address
  };
}
