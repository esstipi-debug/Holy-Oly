import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center">
              <span className="text-4xl">👋</span>
              <h2 className="text-white text-3xl font-black mt-4">¡Bienvenido!</h2>
              <p className="text-slate-500 text-sm mt-2">Vamos a configurar tu perfil de atleta de élite.</p>
            </div>
            <div className="space-y-4">
              <Input label="¿Cómo te llaman?" placeholder="Tu nombre" />
              <Input label="Fecha de Nacimiento" type="date" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <span className="text-4xl">📏</span>
              <h2 className="text-white text-2xl font-black mt-4">Datos Biométricos</h2>
              <p className="text-slate-500 text-sm mt-2">Necesarios para el modelo Banister de fatiga.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Input label="Peso (KG)" type="number" placeholder="85" />
               <Input label="Altura (CM)" type="number" placeholder="180" />
            </div>
            <div className="space-y-2">
               <p className="text-xs font-bold text-slate-500 uppercase ml-1">Nivel de Experiencia</p>
               <div className="grid grid-cols-3 gap-2">
                  {['Basico', 'Inter', 'Elite'].map(L => (
                    <button key={L} className="py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:border-holy-primary hover:text-white transition-all uppercase">
                       {L}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <span className="text-4xl">🚀</span>
              <h2 className="text-white text-3xl font-black mt-4">Todo Listo</h2>
              <p className="text-slate-500 text-sm mt-2">Tu entrenador verá tus datos y te asignará un macrociclo en breve.</p>
            </div>
            <Card variant="glass" className="border-holy-primary/30 p-8 text-center bg-holy-primary/5">
               <div className="w-16 h-16 rounded-full bg-holy-primary/20 border-2 border-holy-primary flex items-center justify-center text-holy-primary text-2xl mx-auto mb-4">
                  ✓
               </div>
               <p className="text-white font-bold italic">PERFIL COMPLETADO</p>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#07070F] px-8 py-12">
      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-12">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-holy-primary' : 'w-2 bg-slate-800'}`} />
        ))}
      </div>

      <div className="flex-1">
        {renderStep()}
      </div>

      <footer className="mt-auto">
        {step < 3 ? (
          <Button fullWidth variant="primary" size="lg" onClick={() => setStep(step + 1)}>
            CONTINUAR →
          </Button>
        ) : (
          <Button fullWidth variant="gold" size="lg">ENTRAR AL DASHBOARD</Button>
        )}
        {step > 1 && step < 3 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="w-full text-slate-600 text-[10px] font-bold uppercase mt-6 hover:text-white transition-colors"
          >
            ATRÁS
          </button>
        )}
      </footer>
    </div>
  );
};

export default Onboarding;
