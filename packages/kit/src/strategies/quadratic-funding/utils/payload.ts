import {
  DonationVotingMerkleDistributionStrategy,
  TransactionData,
} from '@allo-team/allo-v2-sdk';
import { getAddress } from '@allo-team/allo-v2-sdk/dist/Allo/allo.config.js';
import {
  Allocation,
  Permit2Data,
  PermitType,
} from '@allo-team/allo-v2-sdk/dist/strategies/DonationVotingMerkleDistributionStrategy/types.js';
import { Chain, encodeFunctionData, WalletClient } from 'viem';

import { signPermit2612 } from './signPermit2612.js';
import { Round } from '../../../api/types.js';
import { comethConfig } from '../../../config/index.js';
import { TokenMetadata } from '../qf.types.js';

/**
 * Generates an approval transaction for ERC20 tokens.
 *
 * This function creates a TransactionData object that represents an ERC20 approval transaction.
 * It's used to allow a spender to spend a certain amount of tokens on behalf of the token owner.
 *
 * @param spender - The address of the account or contract that will be approved to spend the tokens.
 * @param tokenAddress - The address of the ERC20 token contract.
 * @param amount - The amount of tokens to approve for spending.
 * @returns A Promise that resolves to a TransactionData object representing the approval transaction.
 */
export async function generateApprovalTransaction(
  spender: `0x${string}`,
  tokenAddress: `0x${string}`,
  amount: bigint,
): Promise<TransactionData> {
  return {
    to: tokenAddress,
    data: encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      args: [spender, amount],
    }),
    value: '0',
  };
}

export async function generateAllocateTransaction(
  round: Round,
  recipientId: `0x${string}`,
  amount: bigint,
) {
  // Create a strategy instance for the round
  const strategy = new DonationVotingMerkleDistributionStrategy({
    chain: round.chainId,
    rpc: comethConfig.chain.rpcUrls.default.http[0] || '',
    address: getAddress({ id: round.chainId } as Chain),
    poolId: BigInt(round.id),
  });

  const allocation: Allocation = {
    recipientId,
    permitType: PermitType.Permit,
    permit2Data: generatePermitlessPayload(round.matching.token, amount),
  };

  return strategy.getAllocateData(allocation);
}

/**
 * Generates a Permit2 Allo strategy payload when no permit is required.
 *
 * This function creates a Permit2Data object with default values for scenarios where
 * a permit is not necessary, typically because an approval transaction has been executed beforehand.
 * It's used in the DonationVotingMerkleDistributionDirectTransferStrategy when
 * explicit permission is not needed due to prior approval.
 *
 * @param tokenMetadata - The metadata of the token being transferred.
 * @param amount - The amount of tokens to be transferred.
 * @returns A Permit2Data object with default values for a transaction that doesn't require a permit.
 */
export function generatePermitlessPayload(
  tokenAddress: `0x${string}`,
  amount: bigint,
): Permit2Data {
  return {
    permit: {
      deadline: BigInt(0),
      nonce: BigInt(0),
      permitted: {
        token: tokenAddress,
        amount,
      },
    },
    signature: '0x',
  };
}

/**
 * Generates a Permit2 Allo strategy payload for token allocation in a quadratic funding round.
 *
 * This function creates a Permit2Data object by signing a permit using EIP-2612 standard.
 * It sets the deadline based on the round's end time or a default of 30 minutes,
 * and uses the round's strategy address as the spender.
 *
 * @param walletClient - The wallet client used for signing the permit.
 * @param round - The quadratic funding round details.
 * @param tokenMetadata - Metadata of the token being allocated.
 * @param amount - The amount of tokens to be allocated.
 * @returns A Promise resolving to a Permit2Data object containing the signature and permit.
 */
export async function generatePermitPayload(
  walletClient: WalletClient,
  round: Round,
  tokenMetadata: TokenMetadata,
  amount: bigint,
): Promise<Permit2Data> {
  const deadline = round.phases.roundEnd
    ? new Date(round.phases.roundEnd).getTime()
    : Date.now() + 30 * 60 * 1000; // 30 minutes

  const spenderAddress = round.strategy;

  const { signature, permit } = await signPermit2612({
    walletClient,
    tokenMetadata,
    spenderAddress,
    value: amount,
    deadline: BigInt(deadline),
    chainId: round.chainId,
  });

  return { signature, permit };
}
