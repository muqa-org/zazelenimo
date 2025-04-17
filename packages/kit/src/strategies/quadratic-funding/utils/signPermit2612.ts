import { Hex, WalletClient } from 'viem';

import { TokenMetadata } from '../qf.types';

type SignPermitProps = {
  walletClient: WalletClient;

  // Token to be spent
  tokenMetadata: TokenMetadata;

  // Address of the spender
  spenderAddress: Hex;

  // Expiration date of the permit
  deadline: bigint;

  // Chain ID
  chainId: number;

  // Optional version of the permit
  permitVersion?: string;
};

type Eip2612Props = SignPermitProps & {
  // Amount of tokens to be spent
  value: bigint;
};

/**
 * Signs a permit for EIP-2612 compliant tokens.
 *
 * This function generates a signature for permitting token spending without a separate approval transaction.
 * It constructs the necessary data structures and calls the wallet's signTypedData method.
 *
 * Note: The signTypedData method doesn't work with the Cometh wallet, but is left here for future refactoring.
 * Currently, this function will not work as expected with Cometh wallet integration.
 *
 * @param {Eip2612Props} props - The properties required for signing the permit.
 * @returns {Promise<{signature: string, permit: object}>} The signature and permit object.
 */
export const signPermit2612 = async ({
  walletClient,
  tokenMetadata,
  spenderAddress,
  value,
  deadline,
  chainId,
  permitVersion,
}: Eip2612Props) => {
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const ownerAddress = walletClient.account!.address!;

  const signature = await walletClient.signTypedData({
    account: ownerAddress,
    message: {
      owner: ownerAddress,
      spender: spenderAddress,
      value,
      nonce: tokenMetadata.nonce,
      deadline,
    },
    domain: {
      name: tokenMetadata.name,
      version: permitVersion ?? '1',
      chainId: chainId,
      verifyingContract: tokenMetadata.address,
    },
    primaryType: 'Permit',
    types,
  });

  const permit = {
    deadline,
    nonce: tokenMetadata.nonce,
    permitted: {
      token: tokenMetadata.address,
      amount: value,
    },
  };

  return { signature, permit };
};
