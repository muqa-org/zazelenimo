'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateConnectorFn, useAccount, useClient, useConnections, useWalletClient } from 'wagmi';

import { comethConnector, useAPI } from '..';
import { API, AllocateInput, RoundInput, RoundsQuery } from '../api/types';
import { useToast } from '../ui/use-toast';
import { ComethWallet } from '@cometh/connect-sdk';
import { COMETH_API_KEY, connectAdaptor } from '../auth';
import { getConnectViemAccount, getConnectViemClient } from '@cometh/connect-sdk-viem';
import { parseAccount } from 'viem/utils';

const defaultQuery = {
  where: {},
  skip: 0,
  take: 12,
  // orderBy: { createdAt: "asc" } as const,
};

export function useRounds(query: RoundsQuery = defaultQuery) {
  const api = useAPI();
  console.log('use rounds', query);
  return useQuery({
    queryKey: ['rounds', query],
    queryFn: async () => api.rounds(query),
  });
}

type RoundParams = Parameters<API['roundById']>;
export function useRoundById(id: RoundParams[0], opts?: RoundParams[1]) {
  const api = useAPI();
  return useQuery({
    queryKey: ['round', { id, opts }],
    queryFn: async () => api.roundById(id, opts),
    enabled: Boolean(id),
  });
}

export function useCreateRound() {
  const account = useAccount();
  const api = useAPI();
  const { toast } = useToast();
  const { data: client } = useWalletClient();
  return useMutation({
    mutationFn: (data: RoundInput) => api.createRound(data, client!, account),
    onSuccess: () => toast({ title: 'Round created!' }),
    onError: (err) => toast({ variant: 'destructive', title: err.toString() }),
  });
}
