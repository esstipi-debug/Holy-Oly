# Batch v4 · Bloque 1 · Auth & Onboarding (5 prompts)

> Pegar primero `00_CONTEXTO_COMPARTIDO.md` y luego uno de estos prompts.

---

## Prompt 1 · Landing (selector producto)

```
Diseña una LANDING page mobile-first para Peak Qual cuando el usuario abre
la app sin sesión y SIN deep-link de producto. Su rol: dejar que ELIJA
producto antes de loguear/registrar.

ESTRUCTURA EN 4 ZONAS:

ZONA A · LOGO HERO (top, 30vh)
- Logo Peak Qual centrado (placeholder "PEAK QUAL")
- Tagline animada fade-in: "Smart Training · Zero Burnout"
- Indicador minimal de scroll

ZONA B · 2 PRODUCT CARDS (centro, 50vh)
Card "HOLY OLY" (gradiente rojo · tier rojo halterofilia)
- Icono kettlebell + barra olímpica SVG
- Título "HOLY OLY"
- Sub "Halterofilia Olímpica"
- Bullets 3 líneas: "Snatch & C&J · macrocyclos · discos por nivel"
- CTA chevron `→`

Card "VOLTA" (gradiente cyan · neón)
- Icono lightning + kettle
- Título "VOLTA"
- Sub "CrossFit · WODs · benchmarks"
- Bullets: "Mayhem warmup · doble sesión · timer live"
- CTA chevron `→`

Card "AXON" (locked · gris)
- Badge "PRÓXIMAMENTE · HYROX"
- No tappable

ZONA C · CTA SECUNDARIO (bottom, 10vh)
- Link sobrio "Ya tenés cuenta · iniciar sesión"
- Discreto · subrayado tactical

ZONA D · FOOTER LEGAL (bottom edge)
- "Privacidad · Términos · v1.0.0-alpha"

INTERACCIONES:
- Tap card producto → guarda product:current en localStorage + navigate(LOGIN)
- Tap "Ya tenés cuenta" → navigate(LOGIN) directo
- Long-press card → preview screenshot del home de ese producto

ANIMACIONES:
- Cards entrada cascada 200ms stagger
- Hover/long-press: glow color producto + scale 1.02
- Background grid pattern sutil con drift lento

ESTADOS:
- Loading inicial: skeleton + spinner mini
- Después de tap: transition fade + slide

OUTPUT:
- LandingV3.tsx
- Mock: ningún data fetch (solo navigation)
- Tokens dark + neón cyan/red
- Tono copy: "elegí tu disciplina" NO "bienvenido al mundo de"

REFERENCIAS:
- Apple Fitness onboarding · 2 sport selection
- Strava signup product picker
- FIFA modo carrera main menu
```

---

## Prompt 2 · Login

```
Diseña la pantalla LOGIN mobile-first cuando atleta/coach ya tiene cuenta.

Mantiene contexto de producto (Holy Oly o Volta seteado en Landing).

ESTRUCTURA EN 3 ZONAS:

ZONA A · HEADER (top 80px)
- Logo producto seleccionado (HO 🏋️ o VOLTA ⚡) discreto
- Tag "INICIAR SESIÓN" mono pequeño
- Botón "‹" volver a Landing arriba izq

ZONA B · FORM (centro vertical centered)
- Card glass dark con bordes hairline
- 2 inputs:
  · Email · placeholder "tu@email.com"
  · Contraseña · type password · toggle 👁 reveal
- Cada input: floating label estilo Material
- Estado focus: glow cyan
- Estado error: glow red + helper text

- CTA primario full width
  · "ENTRAR →" (verde lime neón si HO · cyan si Volta)
  · Loading state: spinner inline + texto "Verificando..."

- Link secundario
  · "Olvidé mi contraseña"
- Link terciario
  · "Crear cuenta nueva" → navigate(REGISTER)

ZONA C · DEMO MODE (solo si ?demo=1 en URL)
- Banner discreto bottom
- Botón "Entrar en modo Demo (sin backend)"
- Estilo opt-in · NO destacado

ZONA D · BACKEND STATUS BANNER (si backendAlive === false)
- Banner amber arriba del form
- "⚠ Servidor no disponible · podés usar modo Demo"

ESTADOS:
- 401: error inline "Email o contraseña inválidos"
- Network error: toast bottom "Sin conexión · reintentar"
- Success: redirect a último view + product home

ACCESIBILIDAD:
- Tab order: email → password → toggle → submit → links
- Enter submit form
- Autocomplete tokens (email · current-password)

OUTPUT:
- LoginV3.tsx
- Props: { onSuccess: () => void }
- API: POST /v1/auth/login { email, password }
- Mock fallback: error 401 si backend no responde
```

---

## Prompt 3 · Register (atleta)

```
Diseña pantalla REGISTER mobile-first para crear cuenta atleta nueva.

Coach NO se registra acá (acceso por invitación admin).

ESTRUCTURA:

ZONA A · HEADER
- Logo producto + tag "CREAR CUENTA DE ATLETA"
- Back chevron a Landing

ZONA B · PRODUCT SWITCHER (sticky top después header)
- Toggle horizontal 2 opciones glass:
  · HOLY OLY · Halterofilia
  · VOLTA · CrossFit
- Visual: cambia gradiente + colores acentos en form below

ZONA C · FORM (4 inputs + checkbox)
- Nombre completo
- Email
- Contraseña (mín 6 · indicador strength inline)
- Confirmar contraseña (validación match en blur)
- Checkbox "Acepto Términos · Privacidad" (link inline a esas pantallas)
- Banner discreto bottom:
  "Si sos coach · contactanos admin@holyoly.app"

ZONA D · CTA + Link
- CTA "CREAR CUENTA →" full width neón producto
- Link "Ya tenés cuenta? · iniciar sesión"

VALIDACIONES INLINE (no submit hasta válido):
- Email formato regex
- Password mín 6 + 1 número
- Match passwords
- Checkbox checked

ESTADOS:
- Loading: spinner CTA "Creando cuenta..."
- Success: navigate ONBOARDING wizard
- 409 email ya existe: error inline + link "iniciar sesión con este email"

OUTPUT:
- RegisterV3.tsx
- API: POST /v1/auth/register { email, password, name, product }
- Mock: success siempre si backend down
```

---

## Prompt 4 · Onboarding Wizard (4 pasos)

```
Diseña un ONBOARDING WIZARD fullscreen mobile-first 4 steps para atleta nuevo.

OBJETIVO: capturar datos críticos para personalizar plan + readiness baseline.

STRUCTURE:

HEADER STICKY (todos los steps):
- Logo Peak Qual mini
- Progress dots 4 (active glow neón)
- Botón "Atrás" chevron desde step 2+
- Botón "Saltar" texto · desde step 3 (con confirmación)

STEP 1 · DATOS BÁSICOS
- Headline: "Empecemos por lo básico"
- Inputs:
  · Cómo te llaman (default desde Register)
  · Fecha nacimiento (date picker)
  · Género · 3 chips (Masculino · Femenino · Prefiero no decir)
- Si Femenino seleccionado: toggle opt-in
  "Quiero tracking hormonal · ciclo menstrual"
  + tooltip privacy "Datos sensibles · podés desactivar después"
- CTA bottom "Continuar →"

STEP 2 · CUERPO
- Headline: "Tu cuerpo hoy"
- Altura (slider visual 140-220cm con valor central grande)
- Peso (slider 40-180kg + toggle kg/lbs)
- Composición corporal (slider opcional · default "Promedio")

STEP 3 · NIVEL EXPERIENCIA
- Headline: "Hace cuánto entrenás?"
- 4 cards tap-select:
  · Principiante (< 6 meses)
  · Intermedio (6m - 2 años)
  · Avanzado (2-5 años)
  · RX / Élite (> 5 años · competís)
- Si Holy Oly seleccionado · pregunta extra opcional:
  · "¿Conocés tu 1RM en Snatch?" → slider 20-200kg
  · "¿Y en Clean & Jerk?" → slider 20-250kg
- Si Volta seleccionado:
  · "¿Tu Fran time actual?" → minutos:segundos picker (opcional)

STEP 4 · OBJETIVO + COACH
- Headline: "Qué buscás?"
- 3 chips multi-select objetivos:
  · Performance · más fuerte/rápido
  · Composición corporal
  · Salud general · longevidad
- Toggle "¿Tenés coach asignado?" → si sí:
  · Input código coach 6 dígitos
- CTA principal: "EMPEZAR MI JOURNEY 🚀" (sin emoji decorativo · sólo si Boss aprueba)
  Mejor: "EMPEZAR" + neón producto + chevron →

NAVEGACIÓN:
- Swipe horizontal cambia step
- Dots top tappables (solo steps completados)
- Bottom CTA fix "Continuar" (cambia a "Empezar" en step 4)

ANIMACIONES:
- Slide horizontal entre steps · 250ms ease-out
- Inputs validación inline microanimation
- Final step: confetti minimal (3 partículas)

OUTPUT:
- OnboardingV3.tsx
- API: POST /v1/users/onboarding (payload completo al final)
- Mock fallback: localStorage save + navigate HOME
```

---

## Prompt 5 · Premium paywall

```
Diseña PREMIUM PAYWALL mobile-first para mostrar planes y triggear checkout
MercadoPago.

PRODUCTO: app freemium · 4 tiers (FREE · BASIC · PRO · ELITE)
AUDIENCIA: atleta convencido de upgrade · NO marketing agresivo

ESTRUCTURA:

ZONA A · HERO HEADER (parallax 200px)
- Background gradient amber-violet
- Logo + tag "PEAK QUAL · PREMIUM"
- Badge "30 días gratis" si first-time

ZONA B · TOGGLE FACTURACIÓN (sticky after header)
- 2 chips lado a lado:
  · Mensual
  · Anual (badge "-20% · 2 meses gratis")
- Selected glow neón

ZONA C · 4 PLAN CARDS (vertical stack)
Cada card:
- Header color (free=gris · basic=verde · pro=amarillo · elite=violeta gradient)
- Nombre plan + precio grande tabular
- Sub: "$X/mes" o "$Y/año"
- Bullets features (3-5 c/u)
- CTA por card:
  · FREE: "Plan actual" (disabled si current)
  · BASIC: "Empezar BASIC" (verde)
  · PRO: "Suscribirme PRO" (amber · destacado)
  · ELITE: "Solicitar acceso" (violet · opens contact)

Plan PRO destacado:
- Borde glow amber
- Badge "MÁS POPULAR" top corner

ZONA D · COMPARATIVA (collapsible footer)
- Tabla densa con todas las features × 4 tiers
- Check ✓ / cruz · / texto corto
- Expandible "Ver comparativa completa"

ZONA E · FAQ + LEGAL (bottom)
- 4-5 preguntas frecuentes acordeón
- "Cancelá cuando quieras · sin contratos"
- Link "Soporte · admin@holyoly.app"

INTERACCIONES:
- Tap CTA plan → POST /v1/payments/intents · redirect a init_point MP
- Loading mid-CTA: spinner + "Conectando a MercadoPago..."
- Error: toast bottom retry

ESTADOS:
- Usuario YA premium: banner top "Suscripción activa · gestionar"
- Backend MP down: disable CTAs + "Pagos temporalmente no disponibles"
- Trial expirado: badge red "Trial venció · upgrade ahora"

OUTPUT:
- PreMiumV3.tsx
- API:
  · GET /v1/payments/plans
  · POST /v1/payments/intents { plan }
- Mock: 4 planes hardcoded con precios CLP
- Tono copy: NO "deslócate · sé élite" · SÍ "más herramientas, mejor coaching"
```

---

## Notas de implementación de este bloque

- **Orden sugerido pedido a Claude Design:** 1 · 2 · 3 · 4 · 5 (auth flow natural)
- **Componente reutilizable:** Card glass dark con bordes hairline · base para Login y Register
- **Después de portar:** validar flujo end-to-end Landing → Register → Onboarding → Home
