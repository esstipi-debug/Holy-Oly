import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const Profile: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#07070F]">
      <div className="px-6 py-10 flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="text-center mb-10">
           <div className="w-24 h-24 rounded-[32px] bg-slate-800 border-4 border-holy-bg shadow-2xl mx-auto mb-4 overflow-hidden">
              <div className="w-full h-full bg-holy-primary/20 flex items-center justify-center text-4xl">🦍</div>
           </div>
           <h1 className="text-white text-2xl font-black italic">Juan Pérez</h1>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Suscripción: HOLY PRO</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <Card variant="solid" className="text-center group cursor-pointer hover:border-holy-primary/40">
              <span className="text-2xl mb-1 block">🏆</span>
              <p className="text-white text-xs font-bold">Logros</p>
              <p className="text-slate-600 text-[9px] font-black uppercase">12 Desbloqueados</p>
           </Card>
           <Card variant="solid" className="text-center group cursor-pointer hover:border-holy-gold/40">
              <span className="text-2xl mb-1 block">💳</span>
              <p className="text-white text-xs font-bold">Pagos</p>
              <p className="text-slate-600 text-[9px] font-black uppercase">PRO Expira en 12d</p>
           </Card>
        </div>

        {/* Settings List */}
        <div className="space-y-3 mb-12">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">Configuración</h3>
           
           {[
             { id: 'biometrics', label: 'Datos Biométricos', icon: '⚖️' },
             { id: 'equipment', label: 'Equipo Disponible', icon: '🏋️' },
             { id: 'coach', label: 'Mi Entrenador', icon: '🕴️' },
             { id: 'units', label: 'Unidades (KG / LBS)', icon: '📐' },
             { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
           ].map((item) => (
             <div key={item.id} className="flex justify-between items-center p-4 bg-holy-surface rounded-2xl border border-slate-800/50 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                   <span className="text-lg">{item.icon}</span>
                   <p className="text-white text-sm font-bold group-hover:text-holy-primary transition-colors">{item.label}</p>
                </div>
                <span className="text-slate-600">→</span>
             </div>
           ))}
        </div>

        <Button variant="danger" fullWidth className="opacity-50 hover:opacity-100">CERRAR SESIÓN</Button>
      </div>
    </div>
  );
};

export default Profile;
