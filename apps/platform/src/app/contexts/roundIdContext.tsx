'use client';

import { createContext, useContext, useState } from 'react';

const defaultId = process.env.NEXT_PUBLIC_ROUND_ID || '';

const RoundIdContext = createContext<{
  roundId: string;
  setRoundId: (id: string) => void;
}>({
  roundId: defaultId,
  setRoundId: () => {},
});

function RoundIdProvider({ children }: { children: React.ReactNode }) {
  const [roundId, setRoundId] = useState(defaultId);

  return (
    <RoundIdContext.Provider value={{ roundId, setRoundId }}>
      {children}
    </RoundIdContext.Provider>
  );
}

function useRoundId() {
  const context = useContext(RoundIdContext);
  if (!context) {
    throw new Error('useRoundId must be used within a RoundIdProvider');
  }
  return context;
}

export { RoundIdProvider, useRoundId };
