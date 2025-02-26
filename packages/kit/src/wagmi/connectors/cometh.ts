'use client';

import { 
  createSafeSmartAccount, 
  createSmartAccountClient,
  createComethPaymasterClient
} from '@cometh/connect-sdk-4337';
import { getConnectViemAccount } from '@cometh/connect-sdk-viem';
import { http } from 'viem';
import { createConnector } from 'wagmi';

import { comethConfig } from '../../config/comethConfig.js';

const { apiKey, chain, bundlerUrl, paymasterUrl } = comethConfig;

// Define a minimal interface for what we need from the account
interface ComethAccount {
  address: `0x${string}`;
}

// Initialize the smart account client early to avoid "No provider available" error
let globalSmartAccountClient: any | undefined;
let globalViemAccount: ComethAccount | undefined;

// Function to initialize the smart account if not already done
async function initializeSmartAccount() {
  if (globalSmartAccountClient) return { smartAccountClient: globalSmartAccountClient, viemAccount: globalViemAccount };
  
  try {
    console.log('Initializing Cometh smart account...');
    
    // Create safe smart account - make sure to await this!
    const smartAccount = await createSafeSmartAccount({
      apiKey,
      chain,
    });
    
    console.log('Smart account created successfully');

    // Create paymaster client for gasless transactions
    const paymasterClient = await createComethPaymasterClient({
      transport: http(paymasterUrl),
      chain,
    });

    // Create smart account client
    globalSmartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl),
      paymaster: paymasterClient
    });

    // We need to handle the type conversion carefully due to SDK compatibility issues
    // The SDK expects a ComethWallet type but we have a SafeSmartAccount
    // We'll extract the address directly from the smart account
    const accountAddress = smartAccount.address;
    
    if (!accountAddress || typeof accountAddress !== 'string') {
      throw new Error('Failed to get account address from smart account');
    }
    
    // Create a simple account object with just the address
    globalViemAccount = { address: accountAddress as `0x${string}` };
    
    console.log('Account initialized with address:', accountAddress);
    
    return { smartAccountClient: globalSmartAccountClient, viemAccount: globalViemAccount };
  } catch (error) {
    console.error('Error initializing Cometh smart account:', error);
    throw error;
  }
}

/**
 * Cometh Connect connector for Wagmi
 * Provides a way to connect to Cometh Smart Accounts through Wagmi
 */
export const comethConnector = createConnector((config) => {
  return {
    id: 'cometh',
    name: 'Cometh Connect',
    type: 'cometh',
    
    async connect({ chainId } = {}) {
      try {
        console.log('Connecting to Cometh...');
        const { smartAccountClient, viemAccount } = await initializeSmartAccount();
        
        if (!viemAccount) {
          throw new Error('Failed to initialize Cometh account');
        }
        
        const address = viemAccount.address;
        console.log('Connected to Cometh with address:', address);

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
      // We don't reset the global variables to maintain the provider
      return;
    },

    async getAccounts() {
      // Return the smart account address if connected
      if (!globalViemAccount) {
        // Try to initialize if not already done
        const { viemAccount } = await initializeSmartAccount().catch(() => ({ viemAccount: undefined }));
        if (!viemAccount) {
          throw new Error('No account connected');
        }
        return [viemAccount.address];
      }
      return [globalViemAccount.address];
    },

    async getChainId() {
      // Return the chain ID
      return chain.id;
    },

    async getProvider() {
      // Return the provider
      if (!globalSmartAccountClient) {
        console.log('No provider available, initializing...');
        // Try to initialize if not already done
        const { smartAccountClient } = await initializeSmartAccount();
        if (!smartAccountClient) {
          throw new Error('No provider available');
        }
        return smartAccountClient;
      }
      return globalSmartAccountClient;
    },

    async isAuthorized() {
      // Check if we have an active session
      try {
        if (!globalViemAccount) {
          // Try to initialize if not already done
          const { viemAccount } = await initializeSmartAccount().catch(() => ({ viemAccount: undefined }));
          return !!viemAccount;
        }
        return true;
      } catch {
        return false;
      }
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.disconnect();
    },

    onChainChanged(chainId) {
      // Handle chain changes if needed
    },

    onDisconnect() {
      this.disconnect();
    },
  };
}); 