'use client';
import '@rainbow-me/rainbowkit/styles.css';

import { getChains } from '@b0rza/gitcoin-chain-data';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import type { Chain } from 'viem/chains';
import * as wagmiChains from 'viem/chains';
import { Config, WagmiProvider } from 'wagmi';

import { customChains } from '../../config/index.js';

const gitcoinChains = getChains();

export const supportedChains = [...gitcoinChains, ...customChains];

console.log(supportedChains);

export const chains = Object.values(wagmiChains)
  .filter((chain) => {
    if (typeof chain === 'object' && 'id' in chain) {
      return supportedChains.map((c) => c.id).includes(chain.id);
    }
    return false;
  }) as unknown as [Chain, ...Chain[]];

const defaultConfig = getDefaultConfig({
  appName: 'MUQA initiative',
  projectId: 'ffa6468a2accec2f1e59502fae10c166',
  chains,
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({
  children,
  config = defaultConfig,
}: PropsWithChildren<{ config?: Config }>) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
