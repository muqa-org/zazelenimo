// This file is no longer needed with the 4337 SDK
// The authentication is handled by the comethConnector and comethSmartAccount
// This file is kept for backward compatibility but should be removed in the future

import { comethConfig } from '../config/comethConfig.js';

export const connectAdaptor = {
  chainId: comethConfig.comethChain,
  apiKey: comethConfig.apiKey,
};
