'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { PropsWithChildren, createContext, useContext } from 'react';
import { WalletClient, getAddress } from 'viem';

import { allo2API } from './providers/allo2';
import { easyRpgfAPI } from './providers/easy-rpgf';
import { grantsStackAPI } from './providers/grants-stack';
import {
  API,
  RoundsQuery,
  QueryOpts,
  RoundInput,
  TransactionInput,
  ApplicationsQuery,
  ProjectsQuery,
} from './types';
import { StrategyExtensions } from '../strategies';
import { directGrants } from '../strategies/direct-grants';
import { quadraticFunding } from '../strategies/quadratic-funding';
import { Toaster } from '../ui/toaster';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
  });
}

const Context = createContext(
  {} as { api: API; strategies: StrategyExtensions },
);
const defaultApi: API = {
  rounds: async (query: RoundsQuery) => [],
  roundById: async (id: string, opts?: QueryOpts) => undefined,
  createRound: async (data: RoundInput) =>
    Promise.reject(new Error('Not Implemented: Create Round')),
  projects: async (query: ProjectsQuery) => [],
  projectById: async (id: string, opts?: QueryOpts) => undefined,
  applications: async (query: ApplicationsQuery) => [],
  applicationById: async (id: string, opts?: QueryOpts) => undefined,
  allocate: async () => Promise.reject(new Error('Not Implemented: Allocate')),
  createProject: async () =>
    Promise.reject(new Error('Not Implemented: createProject')),
  createApplication: async () =>
    Promise.reject(new Error('Not Implemented: createApplication')),
  distribute: async () =>
    Promise.reject(new Error('Not Implemented: Distribute')),
  ballot: async () => Promise.reject(new Error('Not Implemented: Ballot')),
  saveBallot: async () =>
    Promise.reject(new Error('Not Implemented: Ballot Save')),
  addToBallot: async () =>
    Promise.reject(new Error('Not Implemented: Ballot Add')),
  upload: async () =>
    Promise.reject(new Error('Not Implemented: Upload Metadata')),
  sendTransaction,
  ...grantsStackAPI,
  ...allo2API,
};

export async function sendTransaction(
  tx: TransactionInput,
  signer: WalletClient,
) {
  if (!signer?.account) throw new Error('Signer missing');
  const address = getAddress(signer.account?.address);

  return signer.sendTransaction({
    ...tx,
    value: BigInt(tx.value),
    account: address,
    chain: signer.chain,
  });
}

export const providers = {
  grantsStackAPI,
  easyRpgfAPI,
  allo2API,
};

export const strategies = {
  directGrants,
  quadraticFunding,
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function ApiProvider({
  children,
  api,
  ...props
}: PropsWithChildren<{
  api?: Partial<API>;
  strategies?: StrategyExtensions;
}>) {
  const queryClient = getQueryClient();
  const value = {
    api: { ...defaultApi, ...api },
    strategies: { ...strategies, ...props.strategies },
  };

  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <Context.Provider value={value}>
          {children}
          <Toaster />
        </Context.Provider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export function useAPI() {
  return useContext(Context).api;
}

export function useStrategies() {
  return useContext(Context).strategies;
}
