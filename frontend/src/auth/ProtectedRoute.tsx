import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../lib/api';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D0D18]">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cargando…</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
