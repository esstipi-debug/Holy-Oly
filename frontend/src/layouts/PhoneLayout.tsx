import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface PhoneLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const athleteNav: NavItem[] = [
  { to: '/home', label: 'Inicio', icon: '🏠' },
  { to: '/session', label: 'Entrenar', icon: '🏋️' },
  { to: '/performance', label: 'Stats', icon: '📊' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
];

const coachNav: NavItem[] = [
  { to: '/coach', label: 'Equipo', icon: '👥' },
  { to: '/coach/assign', label: 'Asignar', icon: '🗂️' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
];

const PhoneLayout: React.FC<PhoneLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const items = !user ? [] : user.role === 'athlete' ? athleteNav : coachNav;

  return (
    <div className="min-h-screen bg-[#0D0D18] flex items-center justify-center p-4">
      <div className="phone-frame">
        <div className="h-[44px] px-7 flex items-center justify-between text-slate-400 text-xs font-semibold select-none">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-4 rounded-full border border-slate-700" />
            <div className="w-5 h-2.5 bg-holy-primary rounded-[2px]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {items.length > 0 && (
          <nav className="h-[76px] bg-holy-surface border-t border-slate-800/50 flex items-center justify-around pb-4">
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isActive
                          ? 'bg-holy-primary/10 border border-holy-primary/20'
                          : 'bg-slate-800'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-holy-primary' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default PhoneLayout;
