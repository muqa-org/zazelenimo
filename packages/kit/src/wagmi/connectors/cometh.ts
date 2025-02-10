import { createSafeSmartAccount, createSmartAccountClient } from '@cometh/connect-sdk-4337';
import { http } from 'viem';
import { createConnector } from 'wagmi';

import { publicClient } from '../../config/comethPublicClient';

const { apiKey, chain, bundlerUrl } = publicClient;

export const comethConnector = createConnector((config) => ({
  id: 'cometh',
  name: 'Cometh',
  type: 'cometh',
  
  async connect({ chainId } = {}) {
    try {
      // Create safe smart account
      const smartAccount = await createSafeSmartAccount({
        apiKey,
        chain,
        publicClient: config.publicClient
      });

      // Create smart account client
      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain,
        bundlerTransport: http(bundlerUrl)
      });

      const address = smartAccount.address;

      return {
        accounts: [address],
        chainId: chain.id,
        chain: {
          id: chain.id,
          unsupported: false
        }
      };
    } catch (error) {
      console.error('Error connecting Cometh:', error);
      throw error;
    }
  },

  async disconnect() {
    // Clean up any state if needed
  },

  async getAccounts() {
    // Return the smart account address if connected
    if (!this.data?.account) {
      throw new Error('No account connected');
    }
    return [this.data.account.address];
  },

  async isAuthorized() {
    // Check if we have an active session
    try {
      const accounts = await this.getAccounts();
      return !!accounts.length;
    } catch {
      return false;
    }
  },

  onAccountsChanged(accounts) {
    if (accounts.length === 0) this.disconnect();
  },

  onChainChanged(chain) {
    // Handle chain changes if needed
  },

  onDisconnect() {
    this.disconnect();
  },
})); 