import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useNav } from '../context/NavigationContext';

interface Pill {
  title: string;
  body: string;
  xp: number;
}

const PILLS: Pill[] = [
  {
    title: 'EL "HOOK GRIP" Y LA ESTABILIDAD DEL CODO',
    body: 'El agarre de gancho no solo asegura la barra; activa la cadena cinética del brazo para evitar el "arm-bend" prematuro en el segundo tirón.',
    xp: 50,
  },
  {
    title: 'TRIPLE EXTENSIÓN: TIMING ES TODO',
    body: 'Caderas, rodillas y tobillos extienden en secuencia rápida. Si la cadera abre antes que la rodilla termine, perdés potencia vertical.',
    xp: 50,
  },
  {
    title: 'LA POSICIÓN OVERHEAD',
    body: 'Bloqueo activo con escápulas elevadas y cabeza neutra. Si te falta movilidad torácica, ningún snatch va a ser estable.',
    xp: 50,
  },
];

const KnowledgePills: React.FC = () => {
  const { navigate } = useNav();
  const [idx, setIdx] = useState(0);
  const pill = PILLS[idx];
  const isLast = idx === PILLS.length - 1;

  const next = () => {
    if (isLast) navigate('HOME');
    else setIdx(idx + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#07070F] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30" />

      {/* Progress bars */}
      <div className="absolute top-12 left-6 right-6 flex gap-1.5 z-50">
        {PILLS.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: i < idx ? '100%' : i === idx ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Tap zones */}
      <button
        onClick={() => idx > 0 && setIdx(idx - 1)}
        className="absolute left-0 top-0 bottom-32 w-1/3 z-20"
        style={{ background: 'transparent', border: 'none', cursor: idx > 0 ? 'pointer' : 'default' }}
        aria-label="Anterior"
      />
      <button
        onClick={next}
        className="absolute right-0 top-0 bottom-32 w-1/3 z-20"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        aria-label="Siguiente"
      />

      <div className="px-8 py-20 flex-1 flex flex-col justify-end relative z-20 pb-40">
        <Badge variant="gold" className="mb-4 self-start">PÍLDORA {idx + 1}/{PILLS.length}</Badge>
        <h1 className="text-white text-3xl font-black italic tracking-tighter leading-none mb-6">
          {pill.title}
        </h1>
        <p className="text-slate-300 text-base leading-relaxed mb-8">
          {pill.body}
        </p>

        <Card variant="solid" className="bg-white/5 border-white/10 backdrop-blur-md flex items-center gap-4 py-4 px-6">
          <div className="w-10 h-10 rounded-full bg-holy-primary/20 flex items-center justify-center text-holy-primary font-black">
            +{pill.xp}
          </div>
          <div>
            <p className="text-white text-xs font-black uppercase">RECOMPENSA DE LECTURA</p>
            <p className="text-slate-500 text-[10px] font-bold">XP acreditada al finalizar</p>
          </div>
        </Card>
      </div>

      <footer className="absolute bottom-10 left-8 right-8 z-30 space-y-3">
        <Button fullWidth variant="primary" size="lg" onClick={next}>
          {isLast ? 'FINALIZAR · RECLAMAR XP →' : 'SIGUIENTE TIP →'}
        </Button>
        <button
          className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest"
          onClick={() => navigate('HOME')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >CERRAR PÍLDORA</button>
      </footer>
    </div>
  );
};

export default KnowledgePills;
