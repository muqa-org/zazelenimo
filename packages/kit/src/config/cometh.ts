import { arbitrumSepolia, avalancheFuji, Chain, optimismSepolia, polygon } from 'viem/chains';
import yn from 'yn';

import { ChainTypes} from './chainTypes';

type BaseConfig = {
  chainType: ChainTypes,
  chain: Chain,
  apiKey: string | undefined,
  tenderlyRpc: string | undefined,
};

type ComethConfig = {
  chainType: ChainTypes,
  chain: Chain,
  apiKey: string,
  transportUrl: string | undefined,
};

const assertEnv = (val: string | undefined) => {
  if (!val) throw new Error(`ENV not set: ${val}`);
  return val;
}

const configs: BaseConfig[] = [
  {
    chainType: 'POLYGON',
    chain: polygon,
    apiKey: process.env.NEXT_PUBLIC_POLYGON_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_POLYGON_TENDERLY_RPC,
  },
  {
    chainType: 'ARBITRUM_SEPOLIA',
    chain: arbitrumSepolia,
    apiKey: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_TENDERLY_RPC,
  },
  {
    chainType: 'AVALANCHE_FUJI',
    chain: avalancheFuji,
    apiKey: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_TENDERLY_RPC,
  },
  {
    chainType: 'OPTIMISM_SEPOLIA',
    chain: optimismSepolia,
    apiKey: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_COMETH_API_KEY,
    tenderlyRpc: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_TENDERLY_RPC,
  }
];

function getConfig(): ComethConfig {
  const chainType = assertEnv(process.env.NEXT_PUBLIC_CHAIN) as ChainTypes;
  const chainConfig = configs.find(config => config.chainType === chainType);

  if (!chainConfig) {
    throw new Error(`No Cometh configuration found for chain: ${chainType}`);
  }

  const { apiKey, chain, tenderlyRpc } = chainConfig;

  return {
    chainType,
    chain,
    apiKey: assertEnv(apiKey),
    transportUrl: yn(process.env.NEXT_PUBLIC_USE_TENDERLY)
      ? assertEnv(tenderlyRpc)
      : undefined,
  };
}

export const comethConfig = getConfig();
