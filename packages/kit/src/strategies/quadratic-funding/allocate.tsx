'use client';
import { TransactionData } from '@allo-team/allo-v2-sdk';
import { TToken } from '@b0rza/gitcoin-chain-data';
import { parseUnits } from 'viem';
// Comment out the incorrect import and use any type for now
// import type { SmartAccountClient } from '@cometh/connect-sdk-4337';

import { Donation } from './qf.types.js';
import {
  generateAllocateTransaction,
  generateApprovalTransaction,
} from './utils/payload.js';
import { Round } from '../../api/types.js';

/**
 * Handles allocation of funds to recipients in a quadratic funding round
 *
 * @param round - The round to allocate funds in
 * @param token - The token to use for allocation
 * @param donations - The donations to allocate
 * @param client - The Cometh smart account client
 * @returns The transaction hash
 */
export const call = async (
  round: Round,
  token: TToken,
  donations: Donation[],
  client: any, // Changed from SmartAccountClient to any
) => {
  const transactions: TransactionData[] = [];

  for (const donation of donations) {
    const amount = parseUnits(donation.amount.toString(), token.decimals);

    const approvalTxData = await generateApprovalTransaction(
      round.strategy,
      token.address,
      amount,
    );
    const allocateTxData = await generateAllocateTransaction(
      round,
      donation.recipientAddress,
      amount,
    );

    transactions.push(approvalTxData, allocateTxData);
  }

  return sendBatchTransactions(client, transactions);
};

/**
 * Sends a batch of transactions using the Cometh smart account client
 *
 * @param client - The Cometh smart account client
 * @param txData - The transaction data to send
 * @returns The transaction hash
 */
async function sendBatchTransactions(client: any, txData: TransactionData[]) {
  const logNamespace = 'sendBatchTransactions';

  try {
    // Convert the transactions to the format expected by the client
    const transactions = txData.map((tx) => ({
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value: BigInt(0),
    }));

    // Send the batch of transactions
    console.log(
      `${logNamespace} sending batch of ${transactions.length} transactions`,
    );
    const txHash = await client.sendTransactions({ transactions });
    console.log(`${logNamespace} txHash`, txHash);

    // Wait for the transaction receipt
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    console.log(`${logNamespace} receipt`, receipt);

    return txHash;
  } catch (error) {
    console.error(`${logNamespace} error:`, error);
    throw error;
  }
}
