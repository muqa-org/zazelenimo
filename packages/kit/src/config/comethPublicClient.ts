'use client';
import { SupportedNetworks } from '@cometh/connect-sdk';
import { http, HttpTransport } from 'viem';
import { arbitrumSepolia, avalancheFuji, Chain, optimismSepolia, polygon } from 'viem/chains';

const { ARBITRUM_SEPOLIA, OPTIMISM_SEPOLIA, FUJI, POLYGON } = SupportedNetworks;

type BaseConfig = {
  [_key in chainType]: {
    apiKey: string | undefined,
    tenderlyRpc: string | undefined,
    chain: Chain
    comethChain: SupportedNetworks,
  }
};

type ComethConfig = {
  apiKey: string,
  chain: Chain,
  comethChain: SupportedNetworks,
  transport: HttpTransport,
  bundlerUrl: string,
  cacheTime: number,
  batch: {},
};

type chainType = 'POLYGON' | 'ARBITRUM_SEPOLIA' | 'AVALANCHE_FUJI' | 'OPTIMISM_SEPOLIA';

const assertEnv = (val: string | undefined) => {
  if (!val) throw new Error(`ENV not set: ${val}`);
  return val;
}

const configs: BaseConfig = {
  'POLYGON': {
    apiKey: process.env.NEXT_PUBLIC_POLYGON_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_POLYGON_TENDERLY_RPC,
    chain: polygon,
    comethChain: POLYGON,
  },
  'ARBITRUM_SEPOLIA': {
    apiKey: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_TENDERLY_RPC,
    chain: arbitrumSepolia,
    comethChain: ARBITRUM_SEPOLIA,
  },
  'AVALANCHE_FUJI': {
    apiKey: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_TENDERLY_RPC,
    chain: avalancheFuji,
    comethChain: FUJI,
  },
  'OPTIMISM_SEPOLIA': {
    apiKey: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_TENDERLY_RPC,
    chain: optimismSepolia,
    comethChain: OPTIMISM_SEPOLIA,
  }
}

function getConfig(): ComethConfig {
  const comethProjectChain = assertEnv(process.env.NEXT_PUBLIC_CHAIN) as chainType;
  const chainConfig = configs[comethProjectChain];

  if (!chainConfig) {
    throw new Error(`No Cometh configuration found for chain: ${comethProjectChain}`);
  }

  const { apiKey, chain, comethChain } = chainConfig;

  const bundlerUrl = 'https://bundler.cometh.io/'+chain.id+'?apikey='+apiKey;

  return {
    apiKey: assertEnv(apiKey),
    chain,
    comethChain,
    bundlerUrl,
    transport: http(),
    cacheTime: 60_000,
    batch: {
        multicall: { wait: 50 },
    },
  };
}

export const publicClient = getConfig();
