import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

type Tab = 'programming' | 'templates' | 'analytics';

const templates = [
  { id: 1, name: 'Fuerza 12 sem', weeks: 12, focus: 'Fuerza máxima', sessions: 4 },
  { id: 2, name: 'Volumen 8 sem', weeks: 8, focus: 'Hipertrofia / base', sessions: 5 },
  { id: 3, name: 'Peaking 6 sem', weeks: 6, focus: 'Pico competitivo', sessions: 4 },
  { id: 4, name: 'Técnica 4 sem', weeks: 4, focus: 'Corrección técnica', sessions: 3 },
];

const athletes = ['Ana García', 'Carlos Ruiz', 'Miguel Torres', 'Laura Pérez', 'Sergio Díaz'];

const CoachTools: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('programming');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');

  const toggleAthlete = (name: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAssign = () => {
    if (!selectedTemplate || selectedAthletes.length === 0 || !startDate) return;
    alert(`Macrociclo asignado a ${selectedAthletes.length} atletas`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'programming', label: 'Programación' },
    { id: 'templates', label: 'Templates' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#07070F]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/coach')}
          className="w-9 h-9 rounded-xl bg-[#111118] border border-[#1E1E32] flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          ←
        </button>
        <div>
          <h1 className="text-white text-xl font-black">Coach Tools</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase">Herramientas del coach</p>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="px-6 mb-4">
        <div className="flex bg-[#111118] rounded-2xl p-1 border border-[#1E1E32]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase transition ${
                tab === t.id ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {/* Tab: Programación masiva */}
        {tab === 'programming' && (
          <div className="space-y-5">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase mb-3">Seleccionar atletas</p>
              <div className="space-y-2">
                {athletes.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAthlete(a)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition ${
                      selectedAthletes.includes(a)
                        ? 'bg-green-600/10 border-green-600/40 text-white'
                        : 'bg-[#111118] border-[#1E1E32] text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-semibold">{a}</span>
                    {selectedAthletes.includes(a) && <span className="text-green-400 text-xs font-black">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase mb-3">Macrociclo</p>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selectedTemplate === t.id
                        ? 'bg-green-600/10 border-green-600/40'
                        : 'bg-[#111118] border-[#1E1E32]'
                    }`}
                  >
                    <p className="text-white text-xs font-bold">{t.name}</p>
                    <p className="text-slate-500 text-[10px]">{t.weeks} semanas</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase mb-3">Fecha de inicio</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#111118] border border-[#1E1E32] rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-600/50"
              />
            </div>

            <Button
              fullWidth
              variant="primary"
              size="lg"
              onClick={handleAssign}
              disabled={!selectedTemplate || selectedAthletes.length === 0 || !startDate}
            >
              Asignar a {selectedAthletes.length || '?'} atleta{selectedAthletes.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Tab: Templates */}
        {tab === 'templates' && (
          <div className="space-y-4">
            {templates.map((t) => (
              <Card key={t.id} variant="solid" padding="md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">{t.name}</h3>
                  <Badge variant="success">{t.weeks} sem</Badge>
                </div>
                <p className="text-slate-500 text-[11px] mb-1">Foco: {t.focus}</p>
                <p className="text-slate-500 text-[11px]">{t.sessions} sesiones / semana</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" className="text-green-400 flex-1" onClick={() => setTab('programming')}>
                    Usar template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tab: Analytics */}
        {tab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Card variant="solid" padding="md" className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase">Adherencia</p>
                <p className="text-white text-3xl font-black">87%</p>
                <p className="text-green-400 text-[10px] font-bold">+3% esta semana</p>
              </Card>
              <Card variant="solid" padding="md" className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase">Carga prom.</p>
                <p className="text-white text-3xl font-black">6.2</p>
                <p className="text-slate-500 text-[10px]">RPE promedio</p>
              </Card>
              <Card variant="solid" padding="md" className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase">En riesgo</p>
                <p className="text-red-400 text-3xl font-black">2</p>
                <p className="text-slate-500 text-[10px]">atletas</p>
              </Card>
              <Card variant="solid" padding="md" className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase">Activos hoy</p>
                <p className="text-white text-3xl font-black">14</p>
                <p className="text-slate-500 text-[10px]">de 18</p>
              </Card>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase mb-3">Atletas en riesgo</p>
              <div className="space-y-3">
                {['Ana García', 'Carlos Ruiz'].map((name) => (
                  <Card key={name} variant="solid" padding="md" className="flex items-center justify-between border-red-500/20 bg-red-500/5">
                    <div>
                      <p className="text-white text-sm font-bold">{name}</p>
                      <p className="text-red-400 text-[10px]">Fatiga elevada · Injury Shield activo</p>
                    </div>
                    <Badge variant="danger">ALTO</Badge>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachTools;
