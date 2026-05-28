import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete, type NewAthleteInput } from '../context/AthleteContext';
import '../styles/v2/new-athlete.css';

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

  return (
    <div className="na-root">

      {/* HEADER */}
      <div className="na-header">
        <span className="na-eyebrow"><span className="pip" />Coach · Box Comando</span>
        <h1 className="na-title">Nuevo atleta</h1>
        <span className="na-sub">Datos básicos · Asignás macro después</span>
      </div>

      {/* FORM */}
      <div className="na-form">

        <div className="na-field">
          <p className="na-label">Nombre completo<span className="req">*</span></p>
          <input
            className="na-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. María González"
          />
        </div>

        <div className="na-field">
          <p className="na-label">Email<span className="req">*</span></p>
          <input
            className="na-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="atleta@ejemplo.com"
          />
        </div>

        <div className="na-row">
          <div className="na-field">
            <p className="na-label">Edad<span className="req">*</span></p>
            <input
              className="na-input"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
            />
          </div>
          <div className="na-field">
            <p className="na-label">Género<span className="req">*</span></p>
            <div className="na-seg">
              {(['M', 'F'] as const).map(g => (
                <button
                  key={g}
                  className="na-seg-btn"
                  data-active={gender === g}
                  onClick={() => { setGender(g); setWeightClass(''); }}
                >{g}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="na-field">
          <p className="na-label">Categoría de peso<span className="req">*</span></p>
          <div className="na-chips scroll-x-no-bar">
            {classes.map(c => (
              <button
                key={c}
                className="na-chip"
                data-active={weightClass === c}
                onClick={() => setWeightClass(c)}
              >{c} kg</button>
            ))}
          </div>
        </div>

        <div className="na-field">
          <p className="na-label">Peso corporal actual (kg)<span className="req">*</span></p>
          <input
            className="na-input"
            type="number"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
            placeholder="72.5"
            step="0.1"
          />
        </div>

        {error && (
          <div className="na-error">{error}</div>
        )}

        <p className="na-note">
          Después de guardar te vamos a llevar a asignar un macrociclo. Los maxes y métricas de fatiga se completan al primer entrenamiento.
        </p>
      </div>

      {/* CTA · 76 nav + safe-area iOS */}
      <div className="na-cta-bar">
        <button
          className="na-cancel"
          onClick={() => navigate('COACH_DASH')}
        >Cancelar</button>
        <button
          className="na-submit"
          onClick={handleSubmit}
          disabled={!valid}
        >Crear + asignar macro</button>
      </div>
    </div>
  );
};

export default NewAthlete;
