import PhoneLayout from './layouts/PhoneLayout';

function App() {
  return (
    <PhoneLayout>
      <div className="px-6 py-4">
        <header className="mb-8">
          <h1 className="text-white text-2xl font-black">HolyOly</h1>
          <p className="text-holy-primary text-xs font-bold uppercase tracking-widest mt-1">
            Beccttor Platform
          </p>
        </header>

        <main className="space-y-6">
          <div className="glass-card p-6 border-holy-primary/20">
            <h2 className="text-white font-bold text-lg mb-2">Bienvenido, Atleta</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Estamos configurando tu entorno de alto rendimiento. Fase 2 en curso.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-holy-primary w-2/5" />
              </div>
              <span className="text-[10px] font-black text-holy-primary">PROGRESS_40%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 text-center group cursor-pointer hover:border-holy-secondary/50">
              <p className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏋️</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Training</p>
            </div>
            <div className="glass-card p-4 text-center group cursor-pointer hover:border-holy-cyan/50">
              <p className="text-2xl mb-1 group-hover:scale-110 transition-transform">🧪</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Analysis</p>
            </div>
          </div>

          <div className="glass-card p-5 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm">Próxima Sesión</h3>
              <span className="text-[10px] bg-holy-gold/20 text-holy-gold px-2 py-0.5 rounded-full font-bold">MAÑANA</span>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl">🚀</div>
              <div>
                <p className="text-slate-200 text-sm font-bold">Snatch + Overhead Squat</p>
                <p className="text-slate-500 text-xs mt-0.5">Focus: Speed & Stability</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PhoneLayout>
  );
}

export default App;
