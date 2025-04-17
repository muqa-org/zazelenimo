import { StrategyExtension } from '..';
import { call as allocateCall } from './allocate';
import { supportedChains } from '../..';

export const quadraticFunding: StrategyExtension = {
  name: 'Quadratic Funding',
  type: 'quadraticFunding',
  // Deployed strategy contract address for networks
  contracts: supportedChains.reduce(
    (acc, x) => ({ ...acc, [x.id]: x.contracts.quadraticFunding }),
    {},
  ),
  components: {
    allocate: {
      call: allocateCall,
    },
  },
};
