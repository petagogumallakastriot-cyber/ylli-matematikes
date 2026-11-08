import { createContext, useContext, type ReactNode } from 'react';
import { useClerk } from '@clerk/react';

/** The portable PIN-only build never mounts Clerk or contacts its proxy. */
export const pinOnly = import.meta.env.VITE_PIN_ONLY === 'true';
const LegacyClerk = createContext<ReturnType<typeof useClerk> | null>(null);

export function LegacyClerkBridge({ children }: { children: ReactNode }) {
  const clerk = useClerk();
  return <LegacyClerk.Provider value={clerk}>{children}</LegacyClerk.Provider>;
}

export const useLegacyClerk = () => useContext(LegacyClerk);
