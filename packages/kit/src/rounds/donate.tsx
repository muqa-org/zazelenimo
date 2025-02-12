'use client';
import { getChainById } from '@b0rza/gitcoin-chain-data';
import { PropsWithChildren, useMemo } from 'react';

import { Button, comethConfig } from '..';
import { useRoundById } from '../hooks/useRounds';
import { useStrategyAddon } from '../strategies';
import { Donation } from '../strategies/quadratic-funding/qf.types';

const roundId = process.env.NEXT_PUBLIC_ROUND_ID ?? '3';
const { chain } = comethConfig;

// TODO: Remove this function once USDC contract address is fixed
const getTokenByChainIdAndAddress = (chainId: number, address: string) => {
  const chainData = getChainById(chainId);
  if (chainId === 43113) {
    const originalUsdc = chainData.tokens.find((it) => it.code === 'USDC');
    chainData.tokens.push({
      code: 'USDC Fixed',
      icon: originalUsdc?.icon,
      address: '0x5425890298aed601595a70AB815c96711a31Bc65',
      decimals: 6,
      canVote: true,
      priceSource: {
        chainId: 1,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      },
      permitVersion: '2',
      redstoneTokenId: 'USDC Fixed',
    })
  }
  return chainData?.tokens.find((token) => token.address.toLocaleLowerCase() === address.toLocaleLowerCase());
};

type AllocateProps = {
  donations: Donation[];
  children?: React.ReactNode;
};

export function Donate({ donations, children }: PropsWithChildren<AllocateProps>): JSX.Element {
	const { data: round } = useRoundById(roundId, { chainId: chain.id });
  const strategyAddon = useStrategyAddon('allocate', round);

  const isEnabled = useMemo(() => {
    return donations.length && donations.every((donation) => donation.amount > 0);
  }, [donations]);

  return (
    <section>
      <div className="mb-2 flex justify-center">
        <Button
          className={`flex flex-row items-center justify-between rounded-md px-5 py-3 text-base ${
            isEnabled
              ? 'bg-green text-white hover:opacity-85'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          isLoading={strategyAddon?.call?.isPending}
          disabled={!isEnabled}
          onClick={() => {
            const token = getTokenByChainIdAndAddress(chain.id, round?.matching?.token!);
            const callArgs = [round, token, donations];
            console.log(callArgs);
            strategyAddon?.call?.mutate(callArgs);
          }}
        >
          {children}
        </Button>
      </div>
    </section>
  );
}
