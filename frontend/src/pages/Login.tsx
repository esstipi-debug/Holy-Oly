import React from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const Login: React.FC = () => {
  return (
    <div className="h-full flex flex-col px-8 py-12 justify-center">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-holy-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-holy-primary/30">
          <span className="text-3xl">🏋️</span>
        </div>
        <h1 className="text-white text-3xl font-black italic tracking-tighter">HOLY OLY</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Smart Training, Zero Burnout</p>
      </div>

      <Card variant="solid" className="space-y-4">
        <Input 
          label="Email" 
          type="email" 
          placeholder="atleta@holyoly.com" 
        />
        <Input 
          label="Contraseña" 
          type="password" 
          placeholder="••••••••" 
        />
        
        <div className="pt-4">
          <Button fullWidth variant="primary" size="lg">ENTRAR</Button>
        </div>
      </Card>

      <div className="mt-8 text-center space-y-4">
        <p className="text-slate-600 text-xs">
          ¿No tienes cuenta? <span className="text-holy-primary font-bold cursor-pointer">Únete al club</span>
        </p>
        <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">v1.0.0-alpha</p>
      </div>
    </div>
  );
};

export default Login;
