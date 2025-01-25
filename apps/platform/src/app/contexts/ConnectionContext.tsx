import { createContext, useContext, ReactNode, useState } from 'react';

interface ConnectionContextType {
  pendingConnectionId: string | null;
  setPendingConnection: (id: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [pendingConnectionId, setPendingConnection] = useState<string | null>(null);

  return (
    <ConnectionContext.Provider value={{ pendingConnectionId, setPendingConnection }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}
