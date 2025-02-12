'use client';

import { ApiProvider, ComethProvider, strategies } from '@allo/kit';
import { SessionProvider } from "next-auth/react";
import { RoundIdProvider } from './contexts/roundIdContext';

export function MuqaSessionProvider({
	children,
	session,
}: Readonly<{
	children: React.ReactNode;
	session: any;
}>) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

export function AlloKitProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const api = {
    upload: async (data: any) =>
      fetch(`/api/ipfs`, { method: 'POST', body: data })
        .then((r) => r.json())
        .then((r) => r.cid),
  }
  return (
    <ApiProvider strategies={strategies} api={api}>
      <RoundIdProvider>
        <ComethProvider>{children}</ComethProvider>
      </RoundIdProvider>
    </ApiProvider>
  );
}
