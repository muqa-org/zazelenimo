'use client';

import { 
  createSafeSmartAccount, 
  createSmartAccountClient,
  createComethPaymasterClient
} from '@cometh/connect-sdk-4337';
import { http } from 'viem';

import { comethConfig } from './comethConfig.js';

const { apiKey, chain, bundlerUrl, paymasterUrl } = comethConfig;

/**
 * Initializes a Cometh Smart Account client using the 4337 SDK.
 * 
 * @param walletAddress - Optional wallet address to connect to an existing account
 * @returns A smart account client that can be used to send transactions
 */
export async function initializeComethSmartAccount(walletAddress?: string) {
  // Create the smart account
  const smartAccount = await createSafeSmartAccount({
    apiKey,
    chain,
    smartAccountAddress: walletAddress
  });

  // Create the paymaster client for gasless transactions
  const paymasterClient = await createComethPaymasterClient({
    transport: http(paymasterUrl),
    chain
  });

  // Create the smart account client
  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain,
    bundlerTransport: http(bundlerUrl),
    paymaster: paymasterClient
  });

  return smartAccountClient;
}