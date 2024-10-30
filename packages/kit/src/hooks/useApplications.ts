'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useWalletClient } from 'wagmi';

import { useAPI } from '..';
import { API, Application, ApplicationInput } from '../api/types';

const defaultQuery = {
  where: {},
  skip: 0,
  take: 12,
  orderBy: { createdAt: 'asc' } as const,
};
export function useApplications<T>(
  query: Parameters<API['applications']>[number] = defaultQuery,
  transformer: (applications: Application[]) => T[] = (it) => it as T[],
) {
  const api = useAPI();
  return useQuery({
    queryKey: ['applications', query],
    queryFn: async () => api.applications(query).then(transformer),
  });
}

type ApplicationByID = Parameters<API['applicationById']>;
export function useApplicationById(
  id: ApplicationByID[0],
  opts?: ApplicationByID[1],
) {
  const api = useAPI();
  return useQuery({
    queryKey: ['application', { id, opts }],
    queryFn: async () => api.applicationById(id, opts),
    enabled: Boolean(id),
  });
}
export function useCreateApplication() {
  const api = useAPI();
  const { data: client } = useWalletClient();
  return useMutation({
    mutationFn: (data: ApplicationInput) =>
      api.createApplication(data, client!),
    onSuccess: () => {}, // TODO: add toast
    onError: () => {},
  });
}
