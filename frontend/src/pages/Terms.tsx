import React from 'react';
import { useNav } from '../context/NavigationContext';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#00E5FF', marginBottom: 10 }}>
      {title}
    </h2>
    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
      {children}
    </div>
  </div>
);

const Terms: React.FC = () => {
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
          <h1 style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.01em', margin: 0 }}>Términos y Condiciones</h1>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: 2 }}>Última actualización: Mayo 2026</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 48px', flex: 1, overflowY: 'auto' }}>

        <Section title="1. Aceptación">
          <p>Al registrarte o usar Holy Oly o Volta ("el Servicio"), aceptás estos Términos y Condiciones. Si no aceptás, no podés usar el Servicio. Operado por Peak Qual SpA, Chile.</p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Holy Oly</strong> es una plataforma de seguimiento de entrenamiento de halterofilia olímpica para atletas y coaches.</p>
          <p><strong style={{ color: '#fff' }}>Volta</strong> es una plataforma de seguimiento de CrossFit y entrenamiento funcional para atletas y coaches.</p>
          <p style={{ marginTop: 8 }}>Ambas plataformas incluyen seguimiento de sesiones, análisis de progreso, recomendaciones de entrenamiento generadas por IA (motor WISE), y herramientas de comunicación coach-atleta.</p>
        </Section>

        <Section title="3. Aviso médico importante">
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 10,
          }}>
            <p style={{ color: '#fca5a5', fontWeight: 700, marginBottom: 6 }}>⚠ Las sugerencias de entrenamiento generadas por WISE NO son consejo médico.</p>
            <p>El Servicio proporciona herramientas de planificación y seguimiento deportivo. Cualquier sugerencia de entrenamiento, carga, intensidad o nutrición es orientativa y no reemplaza la evaluación de un profesional de la salud o un entrenador certificado. Consultá a un médico antes de iniciar cualquier programa de entrenamiento intensivo.</p>
          </div>
        </Section>

        <Section title="4. Cuentas de usuario">
          <p style={{ marginBottom: 8 }}>Sos responsable de mantener la confidencialidad de tu contraseña. No podés compartir tu cuenta ni usarla para actividades ilegales.</p>
          <p>Los coaches son responsables de las instrucciones que dan a sus atletas a través de la plataforma.</p>
        </Section>

        <Section title="5. Planes y pagos">
          <p style={{ marginBottom: 8 }}>El Servicio ofrece un período de prueba gratuito (trial). Después del trial, se requiere suscripción paga para acceso completo.</p>
          <p style={{ marginBottom: 8 }}>Los pagos se procesan mediante Mercado Pago. Los precios están en pesos chilenos (CLP) e incluyen IVA cuando corresponde.</p>
          <p>No hay reembolsos por períodos parciales de suscripción, excepto en casos de falla técnica imputable al Servicio.</p>
        </Section>

        <Section title="6. Contenido del usuario">
          <p style={{ marginBottom: 8 }}>Tus datos de entrenamiento son tuyos. Nos otorgás una licencia limitada para procesarlos con el único fin de prestarte el Servicio (generar análisis, sugerencias, estadísticas).</p>
          <p>No podés cargar contenido ilegal, ofensivo, o que infrinja derechos de terceros.</p>
        </Section>

        <Section title="7. Uso permitido">
          <p style={{ marginBottom: 8 }}>Podés usar el Servicio para tu entrenamiento personal o, si sos coach, para el seguimiento de tus atletas registrados.</p>
          <p>No podés: intentar acceder a datos de otros usuarios, hacer reverse engineering de la aplicación, usar bots o scripts automatizados, o revender el Servicio.</p>
        </Section>

        <Section title="8. Limitación de responsabilidad">
          <p style={{ marginBottom: 8 }}>El Servicio se proporciona "tal cual" (as-is). No garantizamos disponibilidad 24/7 ni ausencia de errores.</p>
          <p style={{ marginBottom: 8 }}>Peak Qual SpA no es responsable por lesiones físicas derivadas del seguimiento de planes de entrenamiento, ya sea generados por IA o por coaches humanos usando la plataforma.</p>
          <p>Nuestra responsabilidad máxima en cualquier caso está limitada al monto pagado por suscripción en los últimos 3 meses.</p>
        </Section>

        <Section title="9. Suspensión y terminación">
          <p style={{ marginBottom: 8 }}>Podemos suspender cuentas que violen estos términos, previo aviso cuando sea posible.</p>
          <p>Podés eliminar tu cuenta en cualquier momento desde Perfil → Eliminar cuenta. La eliminación es permanente.</p>
        </Section>

        <Section title="10. Jurisdicción">
          <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa se someterá a los tribunales ordinarios de justicia de la ciudad de Santiago, Chile.</p>
        </Section>

        <Section title="11. Contacto">
          <p>Para consultas legales: hola@peakqual.app</p>
        </Section>

      </div>
    </div>
  );
};

export default Terms;
