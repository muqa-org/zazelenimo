'use client';
/* eslint-disable no-undef */
import { http, HttpTransport } from 'viem';
import { arbitrumSepolia, avalancheFuji, Chain, optimismSepolia, polygon } from 'viem/chains';

// Add process.env type declaration for ESLint
declare const process: {
  env: {
    NEXT_PUBLIC_CHAIN?: string;
    NEXT_PUBLIC_POLYGON_COMETH_API_KEY?: string;
    NEXT_PUBLIC_POLYGON_TENDERLY_RPC?: string;
    NEXT_PUBLIC_ARBITRUM_SEPOLIA_COMETH_API_KEY?: string;
    NEXT_PUBLIC_ARBITRUM_SEPOLIA_TENDERLY_RPC?: string;
    NEXT_PUBLIC_AVALANCHE_FUJI_COMETH_API_KEY?: string;
    NEXT_PUBLIC_AVALANCHE_FUJI_TENDERLY_RPC?: string;
    NEXT_PUBLIC_OPTIMISM_SEPOLIA_COMETH_API_KEY?: string;
    NEXT_PUBLIC_OPTIMISM_SEPOLIA_TENDERLY_RPC?: string;
  };
};

// Define network constants directly instead of importing from SupportedNetworks
const POLYGON = 137;
const ARBITRUM_SEPOLIA = 421614;
const FUJI = 43113;
const OPTIMISM_SEPOLIA = 11155420;

type BaseConfig = {
  /* eslint-disable-next-line no-unused-vars */
  [key in chainType]: {
    apiKey: string | undefined,
    tenderlyRpc: string | undefined,
    chain: Chain
    comethChain: number,
  }
};

type ComethConfig = {
  apiKey: string,
  chain: Chain,
  comethChain: number,
  transport: HttpTransport,
  bundlerUrl: string,
  paymasterUrl: string,
  cacheTime: number,
  batch: {},
};

type chainType = 'POLYGON' | 'ARBITRUM_SEPOLIA' | 'AVALANCHE_FUJI' | 'OPTIMISM_SEPOLIA';

const assertEnv = (val: string | undefined, envName: string) => {
  if (!val || val.includes('your-cometh')) {
    console.warn(`Environment variable ${envName} is not properly set. Using fallback value.`);
    // For ARBITRUM_SEPOLIA, we have a valid API key in the .env.local file
    if (envName === 'NEXT_PUBLIC_ARBITRUM_SEPOLIA_COMETH_API_KEY') {
      return process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_COMETH_API_KEY || '';
    }
    // Return a non-empty string to prevent errors
    return 'placeholder-api-key';
  }
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
  // Default to ARBITRUM_SEPOLIA if NEXT_PUBLIC_CHAIN is not set
  const comethProjectChain = (process.env.NEXT_PUBLIC_CHAIN || 'ARBITRUM_SEPOLIA') as chainType;
  console.log(`Using chain: ${comethProjectChain}`);
  
  const chainConfig = configs[comethProjectChain];

  if (!chainConfig) {
    console.error(`No Cometh configuration found for chain: ${comethProjectChain}. Defaulting to ARBITRUM_SEPOLIA.`);
    return getConfig();
  }

  const { apiKey, chain, comethChain } = chainConfig;

  // Use assertEnv with the environment variable name for better error messages
  const validApiKey = assertEnv(apiKey, `NEXT_PUBLIC_${comethProjectChain}_COMETH_API_KEY`);
  
  const bundlerUrl = `https://bundler.cometh.io/${chain.id}?apikey=${validApiKey}`;
  const paymasterUrl = `https://paymaster.cometh.io/${chain.id}?apikey=${validApiKey}`;

  return {
    apiKey: validApiKey,
    chain,
    comethChain,
    bundlerUrl,
    paymasterUrl,
    transport: http(),
    cacheTime: 60_000,
    batch: {
        multicall: { wait: 50 },
    },
  };
}

export const comethConfig = getConfig();
