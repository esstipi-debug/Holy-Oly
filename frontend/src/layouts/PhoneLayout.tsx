import React from 'react';

interface PhoneLayoutProps {
  children: React.ReactNode;
}

const PhoneLayout: React.FC<PhoneLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0D0D18] flex items-center justify-center p-4">
      <div className="phone-frame">
        {/* Status Bar */}
        <div className="h-[44px] px-7 flex items-center justify-between text-slate-400 text-xs font-semibold select-none">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-4 rounded-full border border-slate-700" />
            <div className="w-5 h-2.5 bg-holy-primary rounded-[2px]" />
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Bottom Navigation */}
        <nav className="h-[76px] bg-holy-surface border-t border-slate-800/50 flex items-center justify-around pb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-lg bg-holy-primary/10 border border-holy-primary/20" />
            <span className="text-[10px] text-holy-primary font-bold">Inico</span>
          </div>
          <div className="flex flex-col items-center gap-1 transition-opacity opacity-40 hover:opacity-100">
            <div className="w-6 h-6 rounded-lg bg-slate-800" />
            <span className="text-[10px] text-slate-500 font-bold">Entrenar</span>
          </div>
          <div className="flex flex-col items-center gap-1 transition-opacity opacity-40 hover:opacity-100">
            <div className="w-6 h-6 rounded-lg bg-slate-800" />
            <span className="text-[10px] text-slate-500 font-bold">Perfil</span>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default PhoneLayout;
