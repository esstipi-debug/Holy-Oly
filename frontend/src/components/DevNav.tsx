import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '../routes';
import { useAuth } from '../auth/AuthContext';

const groups: Array<'Public' | 'Athlete' | 'Coach'> = ['Public', 'Athlete', 'Coach'];

const DevNav: React.FC = () => {
  const location = useLocation();
  const { user, logout, mockLogin } = useAuth();

  return (
    <>
      <div className="hidden 2xl:flex fixed right-10 top-10 bottom-10 w-64 bg-holy-surface/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex-col gap-6 overflow-y-auto z-50 shadow-2xl">
        <div>
          <h2 className="text-white text-xs font-black italic mb-1">PEAK QUAL EXPLORER</h2>
          <p className="text-holy-primary text-[9px] font-bold uppercase tracking-widest">Dev navigation</p>
          {user ? (
            <p className="text-slate-500 text-[9px] mt-2">
              {user.email} · <span className="text-holy-primary">{user.role}</span>
              <button onClick={logout} className="ml-2 underline">salir</button>
            </p>
          ) : (
            <div className="mt-2 flex gap-1">
              <button onClick={() => mockLogin('athlete')} className="flex-1 text-[9px] font-bold uppercase bg-holy-primary/10 text-holy-primary border border-holy-primary/30 rounded px-2 py-1 hover:bg-holy-primary/20">Mock atleta</button>
              <button onClick={() => mockLogin('coach')} className="flex-1 text-[9px] font-bold uppercase bg-holy-cyan/10 text-holy-cyan border border-holy-cyan/30 rounded px-2 py-1 hover:bg-holy-cyan/20">Mock coach</button>
            </div>
          )}
        </div>

        {groups.map(group => (
          <div key={group} className="space-y-2">
            <h3 className="text-slate-600 text-[9px] font-black uppercase tracking-tighter border-b border-white/5 pb-1">{group}</h3>
            <div className="flex flex-col gap-1">
              {routes.filter(r => r.group === group).map(r => {
                const active = location.pathname === r.path;
                return (
                  <Link
                    key={r.path}
                    to={r.path}
                    className={`text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                      active ? 'bg-holy-primary/10 text-holy-primary border border-holy-primary/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="2xl:hidden fixed bottom-4 left-4 right-4 flex gap-2 z-50 overflow-x-auto bg-black/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        {routes.map(r => {
          const active = location.pathname === r.path;
          return (
            <Link
              key={r.path}
              to={r.path}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black ${
                active ? 'bg-holy-primary text-white' : 'bg-white/5 text-slate-500'
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default DevNav;
