'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type LevelFilter = 'N4-N5' | 'N3' | 'N2' | 'N1' | 'ALL';

interface LevelContextType {
  level: LevelFilter;
  setLevel: (level: LevelFilter) => void;
}

const LevelContext = createContext<LevelContextType>({
  level: 'ALL',
  setLevel: () => {},
});

const STORAGE_KEY = 'nihongo_level';

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<LevelFilter>('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['N4-N5', 'N3', 'N2', 'N1', 'ALL'].includes(stored)) {
      setLevelState(stored as LevelFilter);
    }
    setMounted(true);
  }, []);

  const setLevel = useCallback((newLevel: LevelFilter) => {
    setLevelState(newLevel);
    localStorage.setItem(STORAGE_KEY, newLevel);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <LevelContext.Provider value={{ level, setLevel }}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  return useContext(LevelContext);
}
