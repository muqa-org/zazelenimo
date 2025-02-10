'use client';

import { CreateConfigParameters, http } from 'wagmi';

import { comethConfig } from './comethPublicClient';
import { comethConnector } from '../wagmi/connectors/cometh';

const { chain } = comethConfig;

export const wagmiConfig: CreateConfigParameters = {
  chains: [chain],
  connectors: [comethConnector],
  transports: {
    [chain.id]: http(comethConfig.transportUrl)
  },
}
