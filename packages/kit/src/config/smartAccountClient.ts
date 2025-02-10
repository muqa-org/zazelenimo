'use client';

import { createSafeSmartAccount, createSmartAccountClient } from '@cometh/connect-sdk-4337';
import { http } from 'viem';

import { publicClient } from './comethPublicClient';

const { apiKey, chain, bundlerUrl} = publicClient;

export async function initializeSmartAccount(walletAddress?: string) {
    const smartAccount = await createSafeSmartAccount({
      apiKey,
      publicClient,
      chain,
      smartAccountAddress: walletAddress,
    });

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    });

    return smartAccountClient;
  }