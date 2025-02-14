import { Application } from '../..';

export type CartAllocation = {
  project: FundedApplication,
  amount: number,
};

export type Donation = {
  recipientAddress: `0x${string}`;
  amount: bigint;
}

export type TokenMetadata = {
  name: string;
  address: `0x${string}`;
  nonce: bigint;
}

export type FundedApplication = Application & {
  targetAmount: number;
  fundedAmount: number;
  fundedPercentage: number;
  neighborhood: string;
}
