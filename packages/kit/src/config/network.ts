'use client';

import { SupportedNetworks } from '@cometh/connect-sdk';

import { ChainTypes } from './chainTypes';
import { comethConfig } from './cometh';

type NetworkConfig = {
  chainType: ChainTypes,
  network: SupportedNetworks,
};

const configs: NetworkConfig[] = [
  {
    chainType: 'POLYGON',
    network: SupportedNetworks.POLYGON,
  },
  {
    chainType: 'ARBITRUM_SEPOLIA',
    network: SupportedNetworks.ARBITRUM_SEPOLIA,
  },
  {
    chainType: 'AVALANCHE_FUJI',
    network: SupportedNetworks.FUJI,
  },
  {
    chainType: 'OPTIMISM_SEPOLIA',
    network: SupportedNetworks.OPTIMISM_SEPOLIA,
  }
];

function getConfig() {
  const config = configs.find(config => config.chainType === comethConfig.chainType);

  if (!config) {
    throw new Error(`No network configuration found for chain: ${comethConfig.chainType}`);
  }

  return {
    network: config.network,
  }
}

export const networkConfig = getConfig();
