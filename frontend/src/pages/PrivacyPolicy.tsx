import React from 'react';
import { useNav } from '../context/NavigationContext';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#FFD700', marginBottom: 10 }}>
      {title}
    </h2>
    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
      {children}
    </div>
  </div>
);

const PrivacyPolicy: React.FC = () => {
  const { back } = useNav();

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#07070F',
      color: '#fff',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        background: '#07070F',
        zIndex: 10,
      }}>
        <button
          onClick={back}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.01em', margin: 0 }}>Política de Privacidad</h1>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: 2 }}>Última actualización: Mayo 2026</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 48px', flex: 1, overflowY: 'auto' }}>

        <Section title="1. Quiénes somos">
          <p>Holy Oly y Volta son aplicaciones de entrenamiento deportivo operadas por Peak Qual SpA, con domicilio en Chile. Contacto: hola@peakqual.app</p>
        </Section>

        <Section title="2. Qué datos recopilamos">
          <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Datos de cuenta:</strong> nombre, email, contraseña (hash bcrypt), producto elegido (Holy Oly / Volta), rol (atleta / coach).</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Datos de entrenamiento:</strong> resultados de WODs, baseline tests (1RM, tiempos de benchmark), macrociclos asignados, sesiones de entrenamiento, progresión de movimientos.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Datos de bienestar:</strong> check-ins de wellness (dolor muscular, fatiga, calidad de sueño, HRV), registrados voluntariamente por el atleta.</p>
          <p><strong style={{ color: '#fff' }}>Datos técnicos:</strong> dirección IP (solo para rate limiting en registro), logs de errores anónimos.</p>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <p>Usamos tus datos exclusivamente para:</p>
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>Prestarte el servicio de seguimiento de entrenamiento</li>
            <li style={{ marginBottom: 6 }}>Generar sugerencias de entrenamiento personalizadas (motor WISE, basado en tus propios datos)</li>
            <li style={{ marginBottom: 6 }}>Permitir que tu coach asignado vea tu progreso (si aplicable)</li>
            <li style={{ marginBottom: 6 }}>Mejorar los algoritmos de recomendación del sistema</li>
          </ul>
          <p style={{ marginTop: 8 }}>No vendemos tus datos a terceros. No usamos tus datos para publicidad.</p>
        </Section>

        <Section title="4. Terceros que acceden a tus datos">
          <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Mistral AI:</strong> Los textos de sugerencias de entrenamiento se generan usando la API de Mistral AI. Enviamos contexto mínimo (nivel, fatiga, objetivo). No enviamos nombre ni email. Consulta la política de Mistral AI en mistral.ai/privacy.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Mercado Pago:</strong> Los pagos de suscripción son procesados por Mercado Pago Chile. No almacenamos datos de tarjeta. Consulta la política de MP en mercadopago.cl.</p>
          <p><strong style={{ color: '#fff' }}>Render.com:</strong> Infraestructura de servidores (Estados Unidos). Datos almacenados en base de datos PostgreSQL alojada en Render.</p>
        </Section>

        <Section title="5. Tus derechos">
          <p style={{ marginBottom: 8 }}>Tienes derecho a:</p>
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: '#fff' }}>Acceso y portabilidad:</strong> Podés descargar todos tus datos desde Perfil → Exportar mis datos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: '#fff' }}>Rectificación:</strong> Contactanos en hola@peakqual.app para corregir datos incorrectos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: '#fff' }}>Eliminación:</strong> Podés eliminar tu cuenta y todos tus datos desde Perfil → Eliminar cuenta. La eliminación es permanente e irreversible.</li>
          </ul>
        </Section>

        <Section title="6. Retención de datos">
          <p>Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, eliminamos todos tus datos de nuestros servidores en un plazo máximo de 30 días (tiempo de backups). Los logs de errores anónimos se conservan por 90 días.</p>
        </Section>

        <Section title="7. Seguridad">
          <p>Utilizamos HTTPS (TLS 1.2+) en todas las comunicaciones. Las contraseñas se almacenan como hashes bcrypt. Los tokens de acceso expiran en 24 horas. Aplicamos rate limiting en el registro para prevenir abuso.</p>
        </Section>

        <Section title="8. Menores de edad">
          <p>La aplicación no está dirigida a personas menores de 14 años. Si tenés menos de 14 años, no podés registrarte sin el consentimiento de un adulto responsable.</p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>Notificaremos cambios significativos por email al menos 15 días antes de que entren en vigor. El uso continuado de la app tras ese período implica aceptación.</p>
        </Section>

        <Section title="10. Contacto">
          <p>Para consultas sobre privacidad: hola@peakqual.app</p>
        </Section>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
