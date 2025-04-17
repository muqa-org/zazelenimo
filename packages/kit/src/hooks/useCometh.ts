'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnectorClient } from 'wagmi';
// Use any type for the client for now due to potential type mismatches
// import type { SmartAccountClient } from '@cometh/connect-sdk-4337';

/**
 * A custom hook to get the Cometh smart account client instance
 * managed by the Wagmi connector.
 *
 * @returns An object containing the Cometh smart account client and connection status.
 */
export function useCometh() {
  const account = useAccount();
  // Get the client instance directly from the active connector via Wagmi
  const { data: client } = useConnectorClient<any>(); // Use 'any' for client type

  const [comethClient, setComethClient] = useState<any | null>(null);
  const [comethWalletAddress, setComethWalletAddress] = useState<
    `0x${string}` | null
  >(null);

  useEffect(() => {
    // Check if the connected client is from Cometh and update state
    // Note: We check the client's type or properties if possible,
    // or rely on the connector ID if available.
    // Here, we simply assume if connected via wagmi and our connector, it's the cometh client.
    if (account.isConnected && client) {
      setComethClient(client);
      // Assuming the client has an 'account' property with the address
      // Adjust based on the actual structure provided by useConnectorClient
      const address = client.account?.address ?? account.address;
      if (address) {
        setComethWalletAddress(address);
      } else {
        setComethWalletAddress(null);
      }
    } else {
      setComethClient(null);
      setComethWalletAddress(null);
    }
  }, [account.isConnected, client, account.address]);

  return {
    client: comethClient, // This is the SmartAccountClient instance
    walletAddress: comethWalletAddress, // The address of the smart account
    isConnected: account.isConnected,
    status: account.status,
    // address: account.address // This might be the EOA if not using Cometh, use walletAddress for the smart account
  };
}
