"use client";

import {
  createSafeSmartAccount,
  createSmartAccountClient,
  createComethPaymasterClient,
  retrieveAccountAddressFromPasskeys,
} from "@cometh/connect-sdk-4337";
import { http } from "viem";
import { createConnector } from "wagmi";

import { comethConfig } from "../../config/comethConfig.js";

const { apiKey, chain, bundlerUrl, paymasterUrl } = comethConfig;

// Initialize the smart account client early to avoid "No provider available" error
let globalSmartAccountClient: any | undefined;
let globalViemAccount: { address: `0x${string}` } | undefined;

// Check if we're running on the server
const isServer = typeof window === "undefined";

// Function to authenticate with passkey and verify the address
async function authenticateWithPasskey(): Promise<string | null> {
  // Don't attempt to authenticate with passkeys on the server
  if (isServer) {
    console.log("Skipping passkey authentication on server");
    return null;
  }

  try {
    console.log("Authenticating with passkey...");

    // Add a timeout to prevent hanging if passkey authentication fails
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log("Passkey authentication timed out");
        resolve(null);
      }, 10000); // 10 second timeout
    });

    // Use retrieveAccountAddressFromPasskeys to prompt the user to authenticate with their passkey
    const retrievePromise = retrieveAccountAddressFromPasskeys(
      apiKey,
      chain,
    ).catch((error) => {
      console.error("Error in retrieveAccountAddressFromPasskeys:", error);
      return null;
    });

    // Race the timeout against the actual authentication
    const retrievedWalletAddress = await Promise.race([
      retrievePromise,
      timeoutPromise,
    ]);

    if (retrievedWalletAddress) {
      console.log(
        "Successfully authenticated with passkey, address:",
        retrievedWalletAddress,
      );
      return retrievedWalletAddress;
    } else {
      console.log("Failed to authenticate with passkey");
      return null;
    }
  } catch (error) {
    console.error("Error authenticating with passkey:", error);
    return null;
  }
}

// Function to initialize the smart account if not already done
async function initializeSmartAccount() {
  // Don't attempt to initialize smart account on the server
  if (isServer) {
    console.log("Skipping smart account initialization on server");
    return { smartAccountClient: null, viemAccount: null };
  }

  if (globalSmartAccountClient)
    return {
      smartAccountClient: globalSmartAccountClient,
      viemAccount: globalViemAccount,
    };

  try {
    console.log("Initializing Cometh smart account...");

    // First check for existing passkeys without prompting
    console.log("Checking for existing passkeys without prompting...");

    // We'll use a try-catch to handle the case where no passkeys exist
    // This way we won't prompt for passkey creation during automatic initialization
    try {
      const smartAccount = await createSafeSmartAccount({
        apiKey,
        chain,
        // Check for existing passkeys first without prompting
        shouldPromptForPasskey: false,
      });

      // If we get here and have an address, we have an existing passkey
      if (smartAccount && smartAccount.address) {
        console.log(
          "Found existing passkey with address:",
          smartAccount.address,
        );

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
          paymaster: paymasterClient,
        });

        // We need to handle the type conversion carefully due to SDK compatibility issues
        // The SDK expects a ComethWallet type but we have a SafeSmartAccount
        // We'll extract the address directly from the smart account
        const accountAddress = smartAccount.address;

        if (!accountAddress || typeof accountAddress !== "string") {
          throw new Error("Failed to get account address from smart account");
        }

        // Create a simple account object with just the address
        globalViemAccount = { address: accountAddress as `0x${string}` };

        console.log("Account initialized with address:", accountAddress);

        return {
          smartAccountClient: globalSmartAccountClient,
          viemAccount: globalViemAccount,
        };
      }
    } catch (error) {
      console.error("Error checking for existing passkeys:", error);
      // Continue to explicit connection flow
    }

    // If we get here, we don't have an existing passkey or session
    // We'll return null and let the connect method handle the explicit connection
    return { smartAccountClient: null, viemAccount: null };
  } catch (error) {
    console.error("Error initializing smart account:", error);
    return { smartAccountClient: null, viemAccount: null };
  }
}

/**
 * Cometh Connect connector for Wagmi
 * Provides a way to connect to Cometh Smart Accounts through Wagmi
 */
export const comethConnector = createConnector((config) => {
  return {
    id: "cometh",
    name: "Cometh Connect",
    type: "cometh",
    icon: "https://connect.cometh.io/favicon.ico",

    async connect({ chainId } = {}) {
      // Don't attempt to connect on the server
      if (isServer) {
        console.log("Skipping connection on server");
        return { accounts: [], chainId: Number(chain.id) };
      }

      console.log("Connecting to Cometh...");

      try {
        // First try to initialize with existing passkeys
        const { smartAccountClient, viemAccount } =
          await initializeSmartAccount();

        // If we already have a smart account client and viem account, we're already connected
        if (smartAccountClient && viemAccount) {
          console.log("Already connected with address:", viemAccount.address);
          return {
            accounts: [viemAccount.address],
            chainId: Number(chain.id),
          };
        }

        // If we get here, we need to create a new passkey or authenticate with an existing one
        console.log(
          "No existing connection, creating new passkey or authenticating...",
        );

        // First try to authenticate with an existing passkey
        const existingAddress = await authenticateWithPasskey();
        if (existingAddress) {
          console.log("Authenticated with existing passkey:", existingAddress);

          try {
            // Create a smart account with the authenticated address
            const smartAccount = await createSafeSmartAccount({
              apiKey,
              chain,
              smartAccountAddress: existingAddress,
              shouldPromptForPasskey: false, // Don't prompt for passkey during initialization
            });

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
              paymaster: paymasterClient,
            });

            // Set up the viem account
            globalViemAccount = { address: existingAddress as `0x${string}` };

            console.log(
              "Connected with existing passkey address:",
              existingAddress,
            );

            return {
              accounts: [existingAddress as `0x${string}`],
              chainId: Number(chain.id),
            };
          } catch (error) {
            console.error(
              "Error creating smart account with existing passkey:",
              error,
            );
            // Continue to new passkey creation as fallback
          }
        }

        // If we get here, we need to create a new passkey
        console.log("No existing passkey found, creating new passkey...");

        try {
          // Add a timeout to prevent hanging if passkey creation fails
          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => {
              reject(new Error("Passkey creation timed out"));
            }, 15000); // 15 second timeout
          });

          // Create a new smart account with a new passkey
          const createAccountPromise = createSafeSmartAccount({
            apiKey,
            chain,
            shouldPromptForPasskey: true, // Prompt for passkey creation
          });

          // Race the timeout against the actual account creation
          const smartAccount = await Promise.race([
            createAccountPromise,
            timeoutPromise,
          ]);

          if (!smartAccount || !smartAccount.address) {
            throw new Error("Failed to create smart account");
          }

          const accountAddress = smartAccount.address;
          console.log("Created new passkey with address:", accountAddress);

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
            paymaster: paymasterClient,
          });

          // Set up the viem account
          globalViemAccount = { address: accountAddress as `0x${string}` };

          console.log("Connected with new passkey address:", accountAddress);

          return {
            accounts: [accountAddress as `0x${string}`],
            chainId: Number(chain.id),
          };
        } catch (error) {
          console.error("Error creating new passkey:", error);
          throw new Error(
            `Failed to create passkey: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } catch (error) {
        console.error("Error connecting to Cometh:", error);
        throw error;
      }
    },

    async disconnect() {
      // Don't attempt to disconnect on the server
      if (isServer) {
        console.log("Skipping disconnection on server");
        return;
      }

      console.log("Disconnecting from Cometh...");

      // Reset the global variables
      globalSmartAccountClient = undefined;
      globalViemAccount = undefined;

      console.log("Successfully disconnected from Cometh");
    },

    async getAccounts(): Promise<readonly `0x${string}`[]> {
      // Don't attempt to get accounts on the server
      if (isServer) {
        console.log("Skipping getAccounts on server");
        return [];
      }

      try {
        // If we already have a viem account, return its address
        if (globalViemAccount) {
          return [globalViemAccount.address];
        }

        // Otherwise, try to initialize the smart account
        const { viemAccount } = await initializeSmartAccount();
        if (viemAccount) {
          return [viemAccount.address];
        }

        // If we get here, we don't have any accounts
        return [];
      } catch (error) {
        console.error("Error getting accounts:", error);
        return [];
      }
    },

    async getChainId() {
      return Number(chain.id);
    },

    async getProvider() {
      // Don't attempt to get provider on the server
      if (isServer) {
        console.log("Skipping getProvider on server");
        return null;
      }

      try {
        // If we already have a smart account client, return it
        if (globalSmartAccountClient) {
          return globalSmartAccountClient;
        }

        // Otherwise, try to initialize the smart account
        const { smartAccountClient } = await initializeSmartAccount();
        if (smartAccountClient) {
          return smartAccountClient;
        }

        // If we get here, we don't have a provider
        throw new Error("No provider available");
      } catch (error) {
        console.error("Error getting provider:", error);
        throw error;
      }
    },

    async isAuthorized() {
      // Don't attempt to check authorization on the server
      if (isServer) {
        console.log("Skipping isAuthorized on server");
        return false;
      }

      try {
        // If we already have a viem account, we're authorized
        if (globalViemAccount) {
          return true;
        }

        // Otherwise, try to initialize the smart account without prompting
        const { viemAccount } = await initializeSmartAccount();
        return !!viemAccount;
      } catch (error) {
        console.error("Error checking authorization:", error);
        return false;
      }
    },

    onAccountsChanged(accounts) {
      // Don't attempt to handle account changes on the server
      if (isServer) return;

      // Cast the accounts to the expected type
      const typedAccounts = accounts.map((account) => account as `0x${string}`);
      config.emitter.emit("change", { accounts: typedAccounts });
    },

    onChainChanged(chainId) {
      // Don't attempt to handle chain changes on the server
      if (isServer) return;

      config.emitter.emit("change", { chainId: Number(chainId) });
    },

    onDisconnect() {
      // Don't attempt to handle disconnect on the server
      if (isServer) return;

      config.emitter.emit("disconnect");
    },

    async reconnect() {
      // Don't attempt to reconnect on the server
      if (isServer) {
        console.log("Skipping reconnect on server");
        return { accounts: [], chainId: Number(chain.id) };
      }

      try {
        // Try to initialize the smart account without prompting
        const { viemAccount } = await initializeSmartAccount();
        if (viemAccount) {
          return {
            accounts: [viemAccount.address],
            chainId: Number(chain.id),
          };
        }

        // If we get here, we couldn't reconnect
        return { accounts: [], chainId: Number(chain.id) };
      } catch (error) {
        console.error("Error reconnecting:", error);
        return { accounts: [], chainId: Number(chain.id) };
      }
    },

    // Add signMessage method to handle personal_sign requests
    async signMessage({ message }: { message: string }) {
      // Don't attempt to sign messages on the server
      if (isServer) {
        console.log("Skipping signMessage on server");
        return "0x"; // Return empty signature instead of throwing an error
      }

      try {
        console.log("Signing message with Cometh:", message);

        // Initialize smart account if not already initialized
        const { smartAccountClient, viemAccount } =
          await initializeSmartAccount();

        if (!smartAccountClient || !viemAccount) {
          throw new Error("No smart account available for signing");
        }

        // Use the smart account client to sign the message
        const signature = await smartAccountClient.signMessage({
          message,
          account: viemAccount,
        });

        console.log("Message signed successfully:", signature);
        return signature;
      } catch (error) {
        console.error("Error signing message with Cometh:", error);
        throw error;
      }
    },
  };
});
