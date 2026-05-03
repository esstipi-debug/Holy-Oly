import React, { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';

interface LocationState { from?: { pathname?: string } }

const Login: React.FC = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    const from = (location.state as LocationState | null)?.from?.pathname;
    return <Navigate to={from || '/'} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email, password);
      navigate(u.role === 'coach' || u.role === 'admin' ? '/coach' : '/home', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="h-full flex flex-col px-8 py-12 justify-center">
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
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-red-400 text-xs font-bold">{error}</p>
        )}

        <div className="pt-4">
          <Button fullWidth variant="primary" size="lg" type="submit" disabled={submitting}>
            {submitting ? 'ENTRANDO…' : 'ENTRAR'}
          </Button>
        </div>
      </Card>

      <div className="mt-8 text-center space-y-4">
        <p className="text-slate-600 text-xs">
          ¿No tienes cuenta? <span className="text-holy-primary font-bold cursor-pointer">Únete al club</span>
        </p>
        <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">v1.0.0-alpha</p>
      </div>
    </form>
  );
};

export default Login;
