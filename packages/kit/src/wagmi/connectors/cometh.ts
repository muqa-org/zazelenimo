"use client";

import {
  createSafeSmartAccount,
  createSmartAccountClient,
  createComethPaymasterClient,
  retrieveAccountAddressFromPasskeys,
} from "@cometh/connect-sdk-4337";
import { getConnectViemAccount } from "@cometh/connect-sdk-viem";
import { http } from "viem";
import { createConnector } from "wagmi";

import { comethConfig } from "../../config/comethConfig.js";

const { apiKey, chain, bundlerUrl, paymasterUrl } = comethConfig;

// Define a minimal interface for what we need from the account
interface ComethAccount {
  address: `0x${string}`;
}

// Define a session interface to track authentication state
interface ComethSession {
  address: string;
  authenticated: boolean;
  expiresAt: number; // Timestamp when the session expires
}

// Initialize the smart account client early to avoid "No provider available" error
let globalSmartAccountClient: any | undefined;
let globalViemAccount: ComethAccount | undefined;

// Session duration in milliseconds (default: 1 hour)
const SESSION_DURATION = 60 * 60 * 1000;

// Helper function to get the current session
function getSession(): ComethSession | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionData = localStorage.getItem("cometh_session");
    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as ComethSession;

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      // Session expired, clear it
      localStorage.removeItem("cometh_session");
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
}

// Helper function to save the session
function saveSession(address: string, authenticated: boolean) {
  if (typeof window === "undefined") return;

  try {
    const session: ComethSession = {
      address,
      authenticated,
      expiresAt: Date.now() + SESSION_DURATION,
    };

    localStorage.setItem("cometh_session", JSON.stringify(session));
    console.log(
      "Session saved with expiration:",
      new Date(session.expiresAt).toLocaleString(),
    );
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

// Helper function to clear the session
function clearSession() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("cometh_session");
    console.log("Session cleared");
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

// Function to authenticate with passkey and verify the address
async function authenticateWithPasskey(): Promise<string | null> {
  try {
    console.log("Authenticating with passkey...");

    // Use retrieveAccountAddressFromPasskeys to prompt the user to authenticate with their passkey
    const retrievedWalletAddress = await retrieveAccountAddressFromPasskeys(
      apiKey,
      chain,
    );

    if (retrievedWalletAddress) {
      console.log(
        "Successfully authenticated with passkey, address:",
        retrievedWalletAddress,
      );

      // Here you would typically verify this address against your database
      // For now, we'll just save the authenticated session
      saveSession(retrievedWalletAddress, true);

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
  if (globalSmartAccountClient)
    return {
      smartAccountClient: globalSmartAccountClient,
      viemAccount: globalViemAccount,
    };

  try {
    // Check if user has explicitly disconnected
    if (typeof window !== "undefined") {
      try {
        const userDisconnected =
          localStorage.getItem("cometh_user_disconnected") === "true";
        if (userDisconnected) {
          console.log(
            "User has explicitly disconnected, not initializing smart account",
          );
          throw new Error("User has explicitly disconnected");
        }
      } catch (error) {
        console.error("Error checking disconnect flag:", error);
      }
    }

    console.log("Initializing Cometh smart account...");

    // Check for an authenticated session first
    const session = getSession();
    if (session && session.authenticated) {
      console.log("Found authenticated session with address:", session.address);

      // Create a smart account with the authenticated address
      try {
        const smartAccount = await createSafeSmartAccount({
          apiKey,
          chain,
          smartAccountAddress: session.address,
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
        globalViemAccount = { address: session.address as `0x${string}` };

        console.log(
          "Account initialized with authenticated session address:",
          session.address,
        );

        return {
          smartAccountClient: globalSmartAccountClient,
          viemAccount: globalViemAccount,
        };
      } catch (error) {
        console.error("Error initializing with session address:", error);
        // Clear the invalid session
        clearSession();
        // Continue to check for existing passkeys
      }
    }

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

        // Note: We don't save a session here because the user hasn't authenticated
        // with their passkey yet. They've only been detected to have a passkey.

        console.log("Account initialized with address:", accountAddress);

        return {
          smartAccountClient: globalSmartAccountClient,
          viemAccount: globalViemAccount,
        };
      } else {
        console.log("No existing passkey found during initialization");
        throw new Error("No existing passkey found");
      }
    } catch (error) {
      console.log("No existing passkeys found during initialization:", error);
      // We don't want to create a new passkey during automatic initialization
      // So we'll throw an error to indicate that no passkeys exist
      throw new Error("No existing passkeys found");
    }
  } catch (error) {
    console.error("Error initializing Cometh smart account:", error);
    throw error;
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

    async connect({ chainId } = {}) {
      try {
        // Don't try to connect during server-side rendering
        if (typeof window === "undefined") {
          console.log("Server-side rendering detected, skipping connection");
          return {
            accounts: [],
            chainId: chain.id,
            chain: {
              id: chain.id,
              unsupported: false,
            },
          };
        }

        console.log("Connecting to Cometh...");

        // Clear the disconnection flag since user is explicitly connecting
        try {
          localStorage.removeItem("cometh_user_disconnected");
        } catch (error) {
          console.error("Error clearing disconnect flag:", error);
        }

        // When explicitly connecting, we should authenticate with passkey
        if (!globalSmartAccountClient) {
          console.log("Authenticating with passkey...");

          try {
            // First authenticate with passkey to get a verified wallet address
            const authenticatedAddress = await authenticateWithPasskey();

            if (authenticatedAddress) {
              console.log(
                "Successfully authenticated with address:",
                authenticatedAddress,
              );

              // Now that we have the authenticated address, create the smart account with it
              const authenticatedSmartAccount = await createSafeSmartAccount({
                apiKey,
                chain,
                smartAccountAddress: authenticatedAddress,
                shouldPromptForPasskey: false, // Don't prompt again, we already authenticated
              });

              // Create paymaster client for gasless transactions
              const paymasterClient = await createComethPaymasterClient({
                transport: http(paymasterUrl),
                chain,
              });

              // Create smart account client with authenticated account
              globalSmartAccountClient = createSmartAccountClient({
                account: authenticatedSmartAccount,
                chain,
                bundlerTransport: http(bundlerUrl),
                paymaster: paymasterClient,
              });

              // Set up the viem account
              globalViemAccount = {
                address: authenticatedAddress as `0x${string}`,
              };

              console.log("Successfully connected with authenticated address");
            } else {
              // Authentication failed, try to create a new passkey
              console.log("Authentication failed, creating a new passkey...");

              // Create new passkey
              const newSmartAccount = await createSafeSmartAccount({
                apiKey,
                chain,
                shouldPromptForPasskey: true, // Explicitly prompt for passkey creation
              });

              console.log(
                "New passkey created with address:",
                newSmartAccount.address,
              );

              // Create paymaster client for gasless transactions
              const paymasterClient = await createComethPaymasterClient({
                transport: http(paymasterUrl),
                chain,
              });

              // Create smart account client with new account
              globalSmartAccountClient = createSmartAccountClient({
                account: newSmartAccount,
                chain,
                bundlerTransport: http(bundlerUrl),
                paymaster: paymasterClient,
              });

              // Set up the viem account
              const accountAddress = newSmartAccount.address;
              globalViemAccount = {
                address: accountAddress as `0x${string}`,
              };

              // Save the authenticated session
              saveSession(accountAddress, true);
              console.log("New passkey created and session saved");
            }
          } catch (error) {
            console.error("Error during authentication:", error);

            // If authentication fails, fallback to creating a new passkey
            console.log("Falling back to creating a new passkey...");

            const smartAccount = await createSafeSmartAccount({
              apiKey,
              chain,
              shouldPromptForPasskey: true, // Explicitly prompt for passkey creation
            });

            console.log("Smart account created successfully");

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
            const accountAddress = smartAccount.address;

            if (!accountAddress || typeof accountAddress !== "string") {
              throw new Error(
                "Failed to get account address from smart account",
              );
            }

            // Create a simple account object with just the address
            globalViemAccount = { address: accountAddress as `0x${string}` };

            // Save the authenticated session
            saveSession(accountAddress, true);
            console.log("New passkey created and session saved");
          }
        } else {
          console.log("Using existing smart account client");
        }

        if (!globalViemAccount) {
          throw new Error("Failed to initialize Cometh account");
        }

        const address = globalViemAccount.address;
        console.log("Connected to Cometh with address:", address);

        return {
          accounts: [address],
          chainId: chain.id,
          chain: {
            id: chain.id,
            unsupported: false,
          },
        };
      } catch (error) {
        console.error("Error connecting Cometh:", error);
        throw error;
      }
    },

    async disconnect() {
      // Don't try to disconnect during server-side rendering
      if (typeof window === "undefined") {
        console.log("Server-side rendering detected, skipping disconnection");
        return;
      }

      console.log("Disconnecting from Cometh...");

      // Clean up global state to prevent automatic reconnection
      globalSmartAccountClient = undefined;
      globalViemAccount = undefined;

      // Clear the authenticated session
      clearSession();

      // Add a flag to localStorage to indicate user has explicitly disconnected
      // This will prevent automatic reconnection attempts
      try {
        localStorage.setItem("cometh_user_disconnected", "true");
      } catch (error) {
        console.error("Error setting disconnect flag:", error);
      }

      console.log("Disconnected from Cometh");
      return;
    },

    async getAccounts() {
      // Return the smart account address if connected
      if (!globalViemAccount) {
        // Don't try to initialize during server-side rendering
        if (typeof window === "undefined") {
          console.log(
            "Server-side rendering detected, returning empty accounts",
          );
          return [];
        }

        // Check if user has explicitly disconnected
        try {
          const userDisconnected =
            localStorage.getItem("cometh_user_disconnected") === "true";
          if (userDisconnected) {
            console.log(
              "User has explicitly disconnected, returning empty accounts",
            );
            return [];
          }
        } catch (error) {
          console.error("Error checking disconnect flag:", error);
        }

        // Try to initialize if not already done and we're on the client
        try {
          const { viemAccount } = await initializeSmartAccount().catch(() => ({
            viemAccount: undefined,
          }));
          if (!viemAccount) {
            return [];
          }
          return [viemAccount.address];
        } catch (error) {
          console.log("Error getting accounts:", error);
          return [];
        }
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
        // Don't try to initialize during server-side rendering
        if (typeof window === "undefined") {
          // Return a minimal mock provider instead of throwing an error
          console.log(
            "Server-side rendering detected, returning mock provider",
          );
          return {
            // Minimal mock implementation to prevent errors during SSR
            request: async () => null,
            getChainId: async () => chain.id,
          };
        }

        // Check if user has explicitly disconnected
        try {
          const userDisconnected =
            localStorage.getItem("cometh_user_disconnected") === "true";
          if (userDisconnected) {
            console.log(
              "User has explicitly disconnected, returning mock provider",
            );
            return {
              // Minimal mock implementation to prevent errors when disconnected
              request: async () => null,
              getChainId: async () => chain.id,
            };
          }
        } catch (error) {
          console.error("Error checking disconnect flag:", error);
        }

        console.log("No provider available, attempting to initialize...");

        // Check for an authenticated session
        const session = getSession();
        if (session && session.authenticated) {
          console.log(
            "Found valid authenticated session, initializing provider with address:",
            session.address,
          );

          try {
            // Create a smart account with the authenticated address
            const smartAccount = await createSafeSmartAccount({
              apiKey,
              chain,
              smartAccountAddress: session.address,
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
            globalViemAccount = { address: session.address as `0x${string}` };

            return globalSmartAccountClient;
          } catch (error) {
            console.error("Error initializing provider with session:", error);
            // Clear the invalid session
            clearSession();
            // Continue to check for existing passkeys
          }
        }

        // Try to initialize if not already done, but don't throw if it fails during reconnection
        try {
          // Check for existing passkeys without prompting
          const smartAccount = await createSafeSmartAccount({
            apiKey,
            chain,
            shouldPromptForPasskey: false,
          });

          if (smartAccount && smartAccount.address) {
            console.log(
              "Found existing passkey during reconnection:",
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

            // Set up the viem account
            const accountAddress = smartAccount.address;
            globalViemAccount = { address: accountAddress as `0x${string}` };

            return globalSmartAccountClient;
          } else {
            console.log("No existing passkey found during reconnection");
            // Return a minimal mock provider instead of throwing an error
            return {
              // Minimal mock implementation to prevent errors during reconnection
              request: async () => null,
              getChainId: async () => chain.id,
            };
          }
        } catch (error) {
          console.error("Error getting provider during reconnection:", error);
          // Return a minimal mock provider instead of throwing an error
          return {
            // Minimal mock implementation to prevent errors during reconnection
            request: async () => null,
            getChainId: async () => chain.id,
          };
        }
      }
      return globalSmartAccountClient;
    },

    async isAuthorized() {
      try {
        // Don't try to check authorization during server-side rendering
        if (typeof window === "undefined") {
          console.log(
            "Server-side rendering detected, skipping authorization check",
          );
          return false;
        }

        // Check if user has explicitly disconnected
        try {
          const userDisconnected =
            localStorage.getItem("cometh_user_disconnected") === "true";
          if (userDisconnected) {
            console.log(
              "User has explicitly disconnected, not attempting to reconnect",
            );
            return false;
          }
        } catch (error) {
          console.error("Error checking disconnect flag:", error);
        }

        // If we already have a smart account client, we're authorized
        if (globalSmartAccountClient && globalViemAccount) {
          console.log("Already authorized with existing smart account client");
          return true;
        }

        // Check for an authenticated session
        const session = getSession();
        if (session && session.authenticated) {
          console.log("Found valid authenticated session, user is authorized");
          return true;
        }

        console.log("Checking for existing passkeys without prompting...");

        // We'll use a try-catch to handle the case where no passkeys exist
        // This way we won't prompt for passkey creation during authorization checks
        try {
          // Try to initialize without prompting for passkey creation
          const smartAccount = await createSafeSmartAccount({
            apiKey,
            chain,
            shouldPromptForPasskey: false,
          });

          // If we get here and have an address, we have an existing passkey
          if (smartAccount && smartAccount.address) {
            console.log(
              "Found existing passkey with address:",
              smartAccount.address,
            );

            // Note: We don't save a session here because the user hasn't authenticated
            // with their passkey yet. They've only been detected to have a passkey.
            // They will need to authenticate during connect().

            return true;
          } else {
            console.log("No existing passkey found during authorization check");
            return false;
          }
        } catch (error) {
          console.log(
            "No existing passkeys found during authorization check:",
            error,
          );
          return false;
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        return false;
      }
    },

    onAccountsChanged(accounts) {
      // Don't try to handle account changes during server-side rendering
      if (typeof window === "undefined") return;

      if (accounts.length === 0) this.disconnect();
    },

    onChainChanged(chainId) {
      // Don't try to handle chain changes during server-side rendering
      if (typeof window === "undefined") return;

      // Handle chain changes if needed
    },

    onDisconnect() {
      // Don't try to handle disconnection during server-side rendering
      if (typeof window === "undefined") return;

      this.disconnect();
    },

    async reconnect() {
      try {
        // Don't try to reconnect during server-side rendering
        if (typeof window === "undefined") {
          console.log("Server-side rendering detected, skipping reconnection");
          return {
            accounts: [],
            chainId: chain.id,
            chain: {
              id: chain.id,
              unsupported: false,
            },
          };
        }

        // Check if user has explicitly disconnected
        try {
          const userDisconnected =
            localStorage.getItem("cometh_user_disconnected") === "true";
          if (userDisconnected) {
            console.log(
              "User has explicitly disconnected, not attempting to reconnect",
            );
            return {
              accounts: [],
              chainId: chain.id,
              chain: {
                id: chain.id,
                unsupported: false,
              },
            };
          }
        } catch (error) {
          console.error("Error checking disconnect flag:", error);
        }

        console.log("Attempting to reconnect to Cometh...");

        // Check if we already have a client
        if (globalSmartAccountClient && globalViemAccount) {
          console.log("Using existing smart account client for reconnection");
          return {
            accounts: [globalViemAccount.address],
            chainId: chain.id,
            chain: {
              id: chain.id,
              unsupported: false,
            },
          };
        }

        // Check for an authenticated session
        const session = getSession();
        if (session && session.authenticated) {
          console.log(
            "Found valid authenticated session, reconnecting with address:",
            session.address,
          );

          try {
            // Create a smart account with the authenticated address
            const smartAccount = await createSafeSmartAccount({
              apiKey,
              chain,
              smartAccountAddress: session.address,
              shouldPromptForPasskey: false, // Don't prompt for passkey during reconnection
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
            const accountAddress = smartAccount.address;
            globalViemAccount = { address: accountAddress as `0x${string}` };

            return {
              accounts: [accountAddress],
              chainId: chain.id,
              chain: {
                id: chain.id,
                unsupported: false,
              },
            };
          } catch (error) {
            console.error("Error reconnecting with session:", error);
            // Clear the invalid session
            clearSession();
            // Continue to check for existing passkeys
          }
        }

        // Try to initialize without prompting for passkey creation
        try {
          // Check for existing passkeys without prompting
          const smartAccount = await createSafeSmartAccount({
            apiKey,
            chain,
            shouldPromptForPasskey: false,
          });

          if (smartAccount && smartAccount.address) {
            console.log(
              "Found existing passkey during reconnection:",
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

            // Set up the viem account
            const accountAddress = smartAccount.address;
            globalViemAccount = { address: accountAddress as `0x${string}` };

            // Note: We don't save a session here because the user hasn't authenticated
            // with their passkey yet. They've only been detected to have a passkey.

            return {
              accounts: [accountAddress],
              chainId: chain.id,
              chain: {
                id: chain.id,
                unsupported: false,
              },
            };
          } else {
            console.log("No existing passkey found during reconnection");
            return {
              accounts: [],
              chainId: chain.id,
              chain: {
                id: chain.id,
                unsupported: false,
              },
            };
          }
        } catch (error) {
          console.error("Error during reconnection:", error);
          // Return empty accounts instead of throwing
          return {
            accounts: [],
            chainId: chain.id,
            chain: {
              id: chain.id,
              unsupported: false,
            },
          };
        }
      } catch (error) {
        console.error("Error in reconnect method:", error);
        // Return empty accounts instead of throwing
        return {
          accounts: [],
          chainId: chain.id,
          chain: {
            id: chain.id,
            unsupported: false,
          },
        };
      }
    },
  };
});
