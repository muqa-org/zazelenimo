'use client';

import { CreateConfigParameters } from 'wagmi';

import { comethConfig } from './comethConfig.js';
import { comethConnector } from '../wagmi/connectors/cometh.js';

const { chain, transport } = comethConfig;

/**
 * Wagmi configuration for Cometh Connect
 * Sets up the chains, connectors, and transports for Wagmi
 */
export const wagmiConfig: CreateConfigParameters = {
  chains: [chain],
  connectors: [comethConnector],
  transports: {
    [chain.id]: transport,
  },
};
