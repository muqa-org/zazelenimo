'use client';
import { TransactionData } from '@allo-team/allo-v2-sdk';
import { TToken } from '@b0rza/gitcoin-chain-data';
import { ComethProvider, ComethWallet } from '@cometh/connect-sdk';
import { parseUnits } from 'viem';

import { Donation } from './qf.types';
import { generateAllocateTransaction, generateApprovalTransaction } from './utils/payload';
import { Round } from '../../api/types';

export const call = async (
  round: Round,
  token: TToken,
  donations: Donation[],
  wallet: ComethWallet,
) => {
  const transactions: TransactionData[] = [];

  for (const donation of donations) {
    const amount = parseUnits(donation.amount.toString(), token.decimals);

    const approvalTxData = await generateApprovalTransaction(
      round.strategy,
      token.address,
      amount
    );
    const allocateTxData = await generateAllocateTransaction(
      round,
      donation.recipientAddress,
      amount
    );

    transactions.push(approvalTxData, allocateTxData);
  };

  return approveAndSendTransactions(wallet, transactions);
};

async function approveAndSendTransactions(wallet: ComethWallet, txData: TransactionData[]) {
  const logNamespace = 'approveAndSendTransaction';
  const provider = new ComethProvider(wallet!);

  const safeTx = await wallet!.sendBatchTransactions(txData);
  console.log(`${logNamespace} safeTx`, safeTx);

  const txPending = await provider.getTransaction(safeTx.safeTxHash, safeTx.relayId);
  console.log(`${logNamespace} txPending`, txPending);

  const txReceipt = await txPending.wait();
  console.log(`${logNamespace} txReceipt`, txReceipt);
}
