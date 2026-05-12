import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete, type NewAthleteInput } from '../context/AthleteContext';

const WEIGHT_CLASSES_M = ['55', '61', '67', '73', '81', '89', '96', '102', '109', '+109'];
const WEIGHT_CLASSES_F = ['45', '49', '55', '59', '64', '71', '76', '81', '87', '+87'];

const NewAthlete: React.FC = () => {
  const { navigate } = useNav();
  const { addAthlete, selectAthlete } = useAthlete();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [weightClass, setWeightClass] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  const classes = gender === 'M' ? WEIGHT_CLASSES_M : WEIGHT_CLASSES_F;

  const valid = name.trim() && email.trim() && Number(age) > 0 && weightClass && Number(bodyWeight) > 0;

  const handleSubmit = () => {
    setError(null);
    if (!valid) {
      setError('Completá los campos obligatorios.');
      return;
    }
    if (!email.includes('@')) {
      setError('Email inválido.');
      return;
    }
    const input: NewAthleteInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      age: Number(age),
      gender,
      weight_class: weightClass,
      body_weight: Number(bodyWeight),
    };
    const profile = addAthlete(input);
    selectAthlete(profile.id);
    navigate('ASSIGN_MACRO');
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'var(--surface)', border: '1px solid var(--card-border)',
    borderRadius: 12, fontSize: 14, color: 'var(--text)',
    fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
    textTransform: 'uppercase', color: 'var(--text-secondary)',
    marginBottom: 6, marginLeft: 4,
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 170 }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>
          Nuevo atleta
        </h1>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
          Datos básicos · Asignás macro después
        </p>
      </div>

      {/* FORM */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <p style={labelStyle}>Nombre completo *</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. María González"
            style={fieldStyle}
          />
        </div>

        <div>
          <p style={labelStyle}>Email *</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="atleta@ejemplo.com"
            style={fieldStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <p style={labelStyle}>Edad *</p>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
              style={fieldStyle}
            />
          </div>
          <div>
            <p style={labelStyle}>Género *</p>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 12 }}>
              {(['M', 'F'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => { setGender(g); setWeightClass(''); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 9,
                    background: gender === g ? 'var(--primary)' : 'transparent',
                    color: gender === g ? 'var(--primary-text)' : 'var(--text-secondary)',
                    border: 'none', fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{g}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p style={labelStyle}>Categoría de peso *</p>
          <div
            className="scroll-x-no-bar"
            style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}
          >
            {classes.map(c => {
              const active = weightClass === c;
              return (
                <button
                  key={c}
                  onClick={() => setWeightClass(c)}
                  style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 999,
                    background: active ? 'var(--text)' : 'var(--surface)',
                    color: active ? 'var(--bg)' : 'var(--text-secondary)',
                    border: `1px solid ${active ? 'var(--text)' : 'var(--card-border)'}`,
                    fontSize: 12, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{c} kg</button>
              );
            })}
          </div>
        </div>

        <div>
          <p style={labelStyle}>Peso corporal actual (kg) *</p>
          <input
            type="number"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
            placeholder="72.5"
            step="0.1"
            style={fieldStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444', fontSize: 12, fontWeight: 700,
          }}>{error}</div>
        )}

        <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>
          Después de guardar te vamos a llevar a asignar un macrociclo. Los maxes y métricas de fatiga se completan al primer entrenamiento.
        </p>
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute', bottom: 84, left: 16, right: 16,
        zIndex: 40, display: 'flex', gap: 8,
      }}>
        <button
          onClick={() => navigate('COACH_DASH')}
          style={{
            flex: 1, padding: '13px 0', borderRadius: 14,
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--card-border)',
            fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Cancelar</button>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          style={{
            flex: 2, padding: '13px 0', borderRadius: 14,
            background: valid ? 'var(--cta-bg)' : 'var(--surface)',
            color: valid ? 'var(--cta-text)' : 'var(--text-secondary)',
            border: valid ? 'none' : '1px solid var(--card-border)',
            fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: valid ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            opacity: valid ? 1 : 0.6,
          }}
        >Crear + asignar macro</button>
      </div>
    </div>
  );
};

export default NewAthlete;
