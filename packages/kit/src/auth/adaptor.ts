import { ConnectAdaptor } from '@cometh/connect-sdk';

import { comethConfig, networkConfig } from '../config';

export const connectAdaptor = new ConnectAdaptor({
  chainId: networkConfig.network,
  apiKey: comethConfig.apiKey,
});
