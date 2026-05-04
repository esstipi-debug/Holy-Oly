# Instrucciones — Conectar wireframes y hacer funcionar los botones

**Objetivo:** que los wireframes HTML estáticos en `/wireframes/` se comporten como una app navegable real: cada botón / tab / icono lleva a la pantalla correcta. Sin React, sin servidor — solo HTML + JS vanilla.

**Estado actual:** los archivos están aislados. `wireframes/index.html` es solo una galería que abre cada uno en modal con iframe — los botones internos no hacen nada.

**Resultado esperado:** abrir cualquier wireframe (en pestaña o en el modal de la galería) y poder recorrer el flujo completo haciendo clic en sus CTAs.

---

## 1. Estrategia (3 patrones)

Cada elemento clicable cae en uno de estos 3 patrones. Aplicar el que corresponda.

### Patrón A — Link directo (la mayoría de casos)
Para botones que llevan a otra pantalla.

```html
<!-- Antes -->
<button class="btn-primary">EMPEZAR</button>

<!-- Después -->
<a href="B5_warmup_generator.html" class="btn-primary">EMPEZAR</a>
```

Si quieres mantener el `<button>` por estilos:
```html
<button class="btn-primary" onclick="go('B5_warmup_generator.html')">EMPEZAR</button>
```

### Patrón B — Back button (volver atrás)
Para flechas `←` que deben volver a la pantalla anterior.

```html
<a href="javascript:history.back()" class="back-btn">←</a>
```

Si la pantalla puede haberse abierto directo (no hay historial), añadir un fallback:
```html
<button class="back-btn" onclick="back('B1_dashboard_atleta.html')">←</button>
```

### Patrón C — Tabs y bottom-nav (navegación estructural)
Para la barra inferior que aparece en muchas pantallas (Inicio / Entrenar / Stats / Perfil).

Convertir cada item en `<a>` con la URL de la pantalla destino:
```html
<a href="B1_dashboard_atleta.html" class="nav-item">
  <div class="nav-icon">🏠</div>
  <span class="nav-label">Inicio</span>
</a>
```

---

## 2. Helper común (añadir a cada wireframe o a un `_nav.js`)

Crear `wireframes/_nav.js` con:

```js
// Navegación con awareness del modal padre
function go(url) {
  if (window.parent && window.parent !== window && window.parent.openModal) {
    // Estamos dentro del iframe de index.html → usar su modal
    window.parent.openModal(url, document.title);
  } else {
    location.href = url;
  }
}

function back(fallback) {
  if (window.parent && window.parent !== window && window.parent.closeModal) {
    window.parent.closeModal();
    return;
  }
  if (history.length > 1) history.back();
  else if (fallback) location.href = fallback;
}

// Permite que <a href="..."> también respete el modal
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('http')) return;
  if (window.parent && window.parent !== window && window.parent.openModal) {
    e.preventDefault();
    window.parent.openModal(href, document.title);
  }
});
```

Y en cada wireframe, antes del `</body>`:
```html
<script src="_nav.js"></script>
```

> **Por qué:** los wireframes a veces se ven en pestaña suelta y a veces dentro del iframe de `index.html`. Este helper detecta el caso y abre la siguiente pantalla en el modal correcto, no rompiendo la galería.

---

## 3. Mapa de navegación (qué botón → qué pantalla)

### A — Auth
| Pantalla | Elemento | Acción |
|---|---|---|
| `A1_A2_A3_auth.html` | botón "Entrar" | → `B1_dashboard_atleta.html` |
| `A1_A2_A3_auth.html` | "Únete al club" / Registrar | → `D1_onboarding_atleta.html` |
| `A1_A2_A3_auth.html` | "¿Olvidaste contraseña?" | → tab interna password (mantener) |

### B — Atleta (flujo principal)
| Pantalla | Elemento | Acción |
|---|---|---|
| `B1_dashboard_atleta.html` | CTA "Iniciar sesión hoy" | → `B4_session_summary.html` |
| `B1_dashboard_atleta.html` | OLY Index (74) | → `B11_oly_index.html` |
| `B1_dashboard_atleta.html` | Injury Shield card | → `B3_injury_shield.html` |
| `B1_dashboard_atleta.html` | Pulse Hub / "Ver todo" | → `B12_B13_pulse_hub.html` |
| `B1_dashboard_atleta.html` | Avatar / engrane | → `B15_perfil_atleta.html` |
| `B4_session_summary.html` | "Empezar calentamiento" | → `B5_warmup_generator.html` |
| `B4_session_summary.html` | back ← | → `B1_dashboard_atleta.html` |
| `B5_warmup_generator.html` | "Finalizar calentamiento" | → `B6_active_session.html` |
| `B5_warmup_generator.html` | "Omitir" | → `B6_active_session.html` |
| `B5_warmup_generator.html` | back ← | → `B4_session_summary.html` |
| `B6_active_session.html` | "Completar" / última serie | → `B7_B8_victory_screen.html` |
| `B6_active_session.html` | back ← | → `B1_dashboard_atleta.html` (con confirm "¿Salir?") |
| `B7_B8_victory_screen.html` | "Compartir victoria" | → `B9_social_card.html` |
| `B7_B8_victory_screen.html` | "Volver al dashboard" | → `B1_dashboard_atleta.html` |
| `B9_social_card.html` | tabs (Viral / Wise / Hybrid / Efficiency) | → `B9b_…`, `B9c_…`, `B9d_…`, `B9e_…` |
| `B9_social_card.html` | back ← | → `B7_B8_victory_screen.html` |
| `B10_performance_deep_dive.html` | back ← | → `B1_dashboard_atleta.html` |
| `B11_oly_index.html` | back ← | → `B1_dashboard_atleta.html` |
| `B12_B13_pulse_hub.html` | back ← | → `B1_dashboard_atleta.html` |
| `B14_pildoras_stories.html` | back / cerrar | → `B1_dashboard_atleta.html` |
| `B15_perfil_atleta.html` | "Temas" / Apariencia | → `B16_theme_gallery.html` |
| `B15_perfil_atleta.html` | "Cerrar sesión" | → `A1_A2_A3_auth.html` |
| `B15_perfil_atleta.html` | back ← | → `B1_dashboard_atleta.html` |
| `B16_theme_gallery.html` | back ← | → `B15_perfil_atleta.html` |
| `B_cns_battery.html` | back ← | → `B12_B13_pulse_hub.html` |
| `B_stress_3layers.html` | back ← | → `B12_B13_pulse_hub.html` |
| `B_stress_correlations.html` | back ← | → `B12_B13_pulse_hub.html` |

### B — Atleta · Bottom nav (mismo en todas las B)
| Tab | Destino |
|---|---|
| Inicio | `B1_dashboard_atleta.html` |
| Entrenar | `B4_session_summary.html` |
| Stats | `B10_performance_deep_dive.html` |
| Perfil | `B15_perfil_atleta.html` |

### C — Coach
| Pantalla | Elemento | Acción |
|---|---|---|
| `C1_command_center_coach.html` | tarjeta atleta | → `C4_athlete_deep_dive.html` |
| `C1_command_center_coach.html` | "Nuevo atleta" | → `C5_C6_add_athlete_assign_macro.html` |
| `C1_command_center_coach.html` | "Programación masiva" | → `C7_C8_C9_coach_tools.html` |
| `C4_athlete_deep_dive.html` | "Reset macro" | → `C5_C6_add_athlete_assign_macro.html` |
| `C4_athlete_deep_dive.html` | back ← | → `C1_command_center_coach.html` |
| `C5_C6_add_athlete_assign_macro.html` | "Confirmar" | → `C1_command_center_coach.html` |
| `C5_C6_add_athlete_assign_macro.html` | back ← | → `C1_command_center_coach.html` |
| `C7_C8_C9_coach_tools.html` | back ← | → `C1_command_center_coach.html` |

### C — Coach · Bottom nav
| Tab | Destino |
|---|---|
| Equipo | `C1_command_center_coach.html` |
| Programación | `C7_C8_C9_coach_tools.html` |
| Asignar | `C5_C6_add_athlete_assign_macro.html` |
| Perfil | `B15_perfil_atleta.html` |

### D — Onboarding
| Pantalla | Elemento | Acción |
|---|---|---|
| `D1_onboarding_atleta.html` | "Siguiente" final | → `B1_dashboard_atleta.html` |
| `D1_onboarding_atleta.html` | "Saltar" | → `B1_dashboard_atleta.html` |
| `D2_free_premium_transition.html` | "Más tarde" | → `B1_dashboard_atleta.html` |
| `D2_free_premium_transition.html` | "Upgrade" | → `B15_perfil_atleta.html` (sección suscripción) |

### V — Volta (mismo patrón, su propio flujo)
| Pantalla | Elemento | Acción |
|---|---|---|
| `V2_volta_onboarding.html` | "Empezar" | → `V1A_volta_dashboard.html` |
| `V1A_volta_dashboard.html` / `V1_volta_dashboard_alerts.html` | "Iniciar WOD" | → `V1B_volta_prewod.html` |
| `V1B_volta_prewod.html` | "Empezar WOD" | → `V1E_volta_session_active.html` |
| `V1E_volta_session_active.html` | "Terminar" | → `V1F_volta_victory.html` |
| `V1F_volta_victory.html` | "Compartir" | → `V6_volta_social_card.html` |
| `V1F_volta_victory.html` | "Ver Wise Score" | → `V1G_volta_wisescore.html` |
| `V3_volta_wod_log.html` | back | → `V1A_volta_dashboard.html` |
| `V4_volta_perfil.html` | "Cerrar sesión" | → `A1_A2_A3_auth.html` |
| `V5_volta_ia_chat.html` | back | → `V1A_volta_dashboard.html` |
| `V7_volta_pildoras.html` | back | → `V1A_volta_dashboard.html` |
| `V8_volta_coach_command.html` | atleta tarjeta | → `V1D_volta_deepdive.html` |
| `V9_volta_free_premium.html` | "Más tarde" / "Upgrade" | → `V4_volta_perfil.html` |

### V — Volta · Bottom nav
| Tab | Destino |
|---|---|
| Home | `V1A_volta_dashboard.html` |
| Log | `V3_volta_wod_log.html` |
| Chat IA | `V5_volta_ia_chat.html` |
| Perfil | `V4_volta_perfil.html` |

---

## 4. Procedimiento por wireframe (paso a paso)

Para **cada archivo HTML**, hacer:

1. **Añadir el script al final**, antes de `</body>`:
   ```html
   <script src="_nav.js"></script>
   ```

2. **Localizar cada CTA** (botón principal con clase `btn-primary` / `cta` / similar).
   Convertirlo en link según el mapa de la sección 3:
   ```html
   <a href="DESTINO.html" class="btn-primary">TEXTO</a>
   ```

3. **Localizar back button** (la flecha `←` en el header). Reemplazar:
   ```html
   <button class="back" onclick="back('B1_dashboard_atleta.html')">←</button>
   ```

4. **Localizar bottom-nav** si existe. Convertir cada item a `<a>`:
   ```html
   <a href="B1_dashboard_atleta.html" class="nav-item">…</a>
   ```

5. **Iconos secundarios** (engrane perfil, chat, badge OLY): añadir `onclick="go('…')"` al elemento contenedor.

6. **Tabs internos** (ej. cards Social B9b/c/d/e): pueden ser links o tabs JS — si son tabs JS dejarlos, solo añadir el link a la otra pantalla cuando son CTAs distintas.

---

## 5. Cambios necesarios en `index.html` (galería)

`openModal` y `closeModal` ya existen en [wireframes/index.html](wireframes/index.html). Solo asegurar que sean **globales** (no dentro de un closure) para que `_nav.js` las encuentre desde el iframe:

```js
// Confirmar que estén en window:
window.openModal = function(file, title) { /* … existente */ }
window.closeModal = function() { /* … existente */ }
```

Si ya lo están como `function openModal()` en script global, ya funciona.

---

## 6. Estado compartido (opcional, para después)

Si quieres simular login / atleta seleccionado / tema activo entre pantallas:

```js
// _state.js — incluir antes de _nav.js
window.AppState = {
  get user()      { return JSON.parse(localStorage.getItem('mock_user') || 'null'); },
  set user(v)     { localStorage.setItem('mock_user', JSON.stringify(v)); },
  get theme()     { return localStorage.getItem('mock_theme') || 'classic'; },
  set theme(v)    { localStorage.setItem('mock_theme', v); document.body.dataset.theme = v; },
  get athleteId() { return localStorage.getItem('mock_athlete'); },
  set athleteId(v){ localStorage.setItem('mock_athlete', v); },
};
```

Casos donde aplicarlo:
- **Auth** → `AppState.user = { name:'Juan', role:'athlete' }` al login; `null` al logout.
- **Theme Gallery (B16)** → `AppState.theme = code` al elegir tema; cada pantalla aplica `document.body.dataset.theme` al cargar.
- **Coach Command Center** → `AppState.athleteId = id` al pulsar tarjeta; Deep Dive lo lee en `init`.

---

## 7. Checklist de testing

Recorrer estos flujos abriendo desde `index.html` y desde URL directa (`B1_dashboard_atleta.html` en pestaña). Marcar ✅ cuando funcione.

**Holy Oly atleta — golden path:**
- [ ] Login → Dashboard
- [ ] Dashboard → Session Summary → Warmup → Active Session → Victory → Social Card
- [ ] Victory → "Volver dashboard" cierra a Dashboard
- [ ] Dashboard → OLY Index (badge 74) → back → Dashboard
- [ ] Dashboard → Injury Shield → back → Dashboard
- [ ] Dashboard → Pulse Hub → CNS Battery → back → Pulse → back → Dashboard
- [ ] Dashboard → Perfil → Theme Gallery → cambiar tema → back → Perfil
- [ ] Bottom nav recorre las 4 pantallas en cualquier orden

**Holy Oly coach:**
- [ ] Command Center → click tarjeta atleta → Deep Dive → back
- [ ] Command Center → "Nuevo atleta" → Add/Assign → "Confirmar" → vuelve a Command Center
- [ ] Bottom nav recorre las 4 pantallas

**Volta:**
- [ ] Onboarding → Dashboard → PreWOD → Active → Victory → Social
- [ ] Bottom nav Volta funciona

**Modal galería:**
- [ ] Abrir B1 desde `index.html` → click "Iniciar sesión hoy" → carga B4 dentro del MISMO modal (no abre pestaña nueva)
- [ ] X del modal cierra; back button dentro del modal vuelve a la pantalla previa del flujo
- [ ] Abrir B1 directo (URL) → click "Iniciar" → navega a `B4_session_summary.html` en la misma pestaña

---

## 8. Orden recomendado de ejecución

1. Crear `wireframes/_nav.js` (sección 2).
2. Aplicar el procedimiento (sección 4) al **flujo golden path** primero: A1, B1, B4, B5, B6, B7_B8, B9, B15, B16. ~30 min.
3. Probar checklist sección 7 → "atleta golden path". Ajustar si algo no carga.
4. Aplicar al resto de B (B10, B11, B12_B13, B14, B_cns, B_stress_*).
5. Aplicar a coach (C1, C4, C5_C6, C7_C8_C9).
6. Aplicar a auth/onboarding (A1, D1, D2).
7. Aplicar a Volta (V1*–V9).
8. Probar checklist completo sección 7.

Tiempo estimado total: 3-4 horas para tocar las ~40 pantallas.

---

## 9. Notas

- **No agregar React, frameworks, o build step.** Mantener HTML+JS vanilla — la gracia es que abre con doble click y se sirve estático en GitHub Pages.
- **No tocar los estilos** de los wireframes — solo añadir atributos `href`, `onclick`, y el `<script src="_nav.js">`.
- Si un botón aún no tiene destino claro, marcarlo en este documento como `→ TBD` y dejar `onclick="alert('TBD')"` para no romper la UI.
- Cuando un mismo HTML representa múltiples pantallas (ej. `B12_B13_pulse_hub.html`), tratar el archivo como una unidad — sus tabs internas siguen siendo JS internas, solo los CTAs que salgan del archivo necesitan navegación.
