'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
// Comment out the incorrect import and use any type for now
// import type { SmartAccountClient } from '@cometh/connect-sdk-4337';

import { initializeComethSmartAccount } from '../config/comethSmartAccount.js';

/**
 * A custom hook to manage Cometh smart account and client.
 *
 * @remarks
 * This hook handles the creation and management of Cometh smart account and client.
 * It uses the 4337 SDK to initialize the smart account with the correct chain and API settings.
 *
 * @returns An object containing the Cometh smart account client and wallet.
 */
export function useCometh() {
  const account = useAccount();
  const [comethClient, setComethClient] = useState<any | null>(null);
  const [comethWallet, setComethWallet] = useState<any | null>(null);

  useEffect(() => {
    async function initializeAccount() {
      try {
        if (!account.isConnected) {
          setComethClient(null);
          setComethWallet(null);
          return;
        }

        // Initialize smart account client using the config
        const smartAccountClient = await initializeComethSmartAccount(
          account.address
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
