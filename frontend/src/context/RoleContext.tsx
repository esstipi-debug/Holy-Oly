import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Role = 'atleta' | 'coach';

interface RoleContextType {
  role: Role;
  setRole: (r: Role) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | null>(null);
const STORAGE_KEY = 'role:current';

function readInitial(): Role {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored === 'coach' || stored === 'atleta') return stored;
  } catch { /* ignore */ }
  return 'atleta';
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, role); } catch { /* ignore */ }
  }, [role]);

  const setRole = useCallback((r: Role) => setRoleState(r), []);
  const toggleRole = useCallback(() => setRoleState((r) => r === 'atleta' ? 'coach' : 'atleta'), []);

  return (
    <RoleContext.Provider value={{ role, setRole, toggleRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
