# Continuación — Wiring de wireframes

Estado al pausar: **golden path Holy Oly atleta 100% navegable**, infra lista, parte de coach/Volta hecho. Quedan ~30-40 micro-ediciones.

> Lee primero `INSTRUCCIONES_NAVEGACION.md` para el contexto. Este archivo es solo el **estado actual + qué falta**.

---

## ✅ Lo que ya quedó funcionando

### Infra (no tocar)
- `wireframes/_nav.js` — helper con `go(url)`, `back(fallback)` que detecta el modal de `index.html` y delega.
- `wireframes/index.html` — `openModal` y `closeModal` ahora son `window.openModal` / `window.closeModal` (necesario para que el iframe pueda llamarlos).
- **43 de 44 wireframes ya tienen `<script src="_nav.js"></script>`** inyectado. Solo falta el `index.html` (no lo necesita).

### Pantallas con CTAs wired
| Archivo | CTAs activos |
|---|---|
| `A1_A2_A3_auth.html` | Iniciar sesión → B1 · Crear cuenta → D1 · ¿Olvidaste? · Guardar contraseña → B1 |
| `B1_dashboard_atleta.html` | "Iniciar Sesión" → B4 · bottom-nav (Inicio/Sesión/Progreso/Perfil) wired |
| `B4_session_summary.html` | "Comenzar sesión" → B5 |
| `B5_warmup_generator.html` | "Finalizar" → B6 · "Omitir" → B6 |
| `B6_active_session.html` | "Guardar RPE 6" → B7_B8 · "Compartir Smart Card" → B9 · "Finalizar" → B1 |
| `B7_B8_victory_screen.html` | "Compartir Victoria" → B9 · "Volver al Dashboard" → B1 |
| `B9_social_card.html` | "Saltar y volver" → B1 |
| `B15_perfil_atleta.html` | "Ver galería" → B16 · bottom-nav wired |
| `B16_theme_gallery.html` | back → B15 |
| `C1_command_center_coach.html` | tarjetas atleta → C4 · "+ Atleta" → C5_C6 |
| `C4_athlete_deep_dive.html` | back ← → C1 (2 botones) |
| `C5_C6_add_athlete_assign_macro.html` | "Confirmar y enviar" → C1 |
| `D1_onboarding_atleta.html` | "Ir a mi Dashboard" → B1 |

---

## 🚧 Lo que falta — orden recomendado

### 1. Cerrar Volta golden path (5 min)

**Problema durante la pausa:** el script Python falló por encoding del carácter `→`. Solución: usar `.encode('utf-8', errors='ignore')` o solo aplicar en los archivos que sé que funcionaron antes del fallo.

Hacer manualmente con Edit:

```
V2_volta_onboarding.html   "Continuar →"           → onclick="go('V1A_volta_dashboard.html')"
V1A_volta_dashboard.html   "Iniciar WOD"            → onclick="go('V1B_volta_prewod.html')"
V1B_volta_prewod.html      "Ver WOD sin cambios"    → onclick="go('V1E_volta_session_active.html')"
V1E_volta_session_active.html  "Terminar"           → onclick="go('V1F_volta_victory.html')"
V1F_volta_victory.html     "Compartir resultado"    → onclick="go('V6_volta_social_card.html')"
V1F_volta_victory.html     "Inicio"                 → onclick="go('V1A_volta_dashboard.html')"
```

Patrón: buscar `<button style=` que contenga el texto, y reemplazar `<button ` por `<button onclick="go('DESTINO.html')" `.

### 2. Volta secundario (10 min)

```
V1_volta_dashboard_alerts.html  CTA "Iniciar WOD"          → V1B
V1G_volta_wisescore.html        back ←                      → back('V1F_volta_victory.html')
V3_volta_wod_log.html           back ←                      → back('V1A_volta_dashboard.html')
V4_volta_perfil.html            "Cerrar sesión"             → A1_A2_A3_auth.html
V4_volta_perfil.html            "Apariencia/Tema"           → B16_theme_gallery.html (compartido)
V5_volta_ia_chat.html           back ←                      → back('V1A_volta_dashboard.html')
V6_volta_social_card.html       "Saltar"                    → V1A_volta_dashboard.html
V7_volta_pildoras.html          back / cerrar               → back('V1A_volta_dashboard.html')
V8_volta_coach_command.html     tarjeta atleta              → V1D_volta_deepdive.html
V9_volta_free_premium.html      "Más tarde"                 → V4_volta_perfil.html
V1C_volta_coach.html            tarjeta atleta              → V1D_volta_deepdive.html
V1D_volta_deepdive.html         back ←                      → back('V1C_volta_coach.html')
```

**Bottom nav Volta** (presente en V1A, V3, V4, V5): cambiar cada `<div class="nav-item">` por `<div class="nav-item" onclick="go('DESTINO.html')" style="cursor:pointer;">` con:
- Home → V1A
- Log → V3
- Chat IA → V5
- Perfil → V4

### 3. Holy Oly atleta secundario (10 min)

```
B3_injury_shield.html      back ← / cerrar               → back('B1_dashboard_atleta.html')
B10_performance_deep_dive.html  back                     → back('B1_dashboard_atleta.html')
B11_oly_index.html         back                          → back('B1_dashboard_atleta.html')
B12_B13_pulse_hub.html     back · CNS card → B_cns_battery · Stress card → B_stress_3layers
B14_pildoras_stories.html  cerrar X                      → back('B1_dashboard_atleta.html')
B_cns_battery.html         back                          → back('B12_B13_pulse_hub.html')
B_stress_3layers.html      back                          → back('B12_B13_pulse_hub.html')
B_stress_correlations.html back                          → back('B12_B13_pulse_hub.html')
B9b_…html / B9c…/ B9d…/ B9e… (variantes social)  back   → back('B9_social_card.html')
```

**Tarjetas en B1 dashboard** (opcional, mejorar UX):
- OLY Index badge "74" → `B11_oly_index.html`
- Injury Shield card → `B3_injury_shield.html`
- Pulse Hub widget "Ver →" → `B12_B13_pulse_hub.html`
- Avatar/engrane perfil → `B15_perfil_atleta.html`

### 4. Coach secundario (5 min)

```
C1_command_center_coach.html   "Programación masiva"  → C7_C8_C9_coach_tools.html
C5_C6_add_athlete_assign_macro.html  back ←            → back('C1_command_center_coach.html')
C5_C6_add_athlete_assign_macro.html  "Continuar → Asignar"  → ya tiene showStep2(), dejar
C7_C8_C9_coach_tools.html      back ← / Volver          → back('C1_command_center_coach.html')
```

**Bottom nav coach** en C1, C4, C7: añadir onclick a:
- Hub / Equipo → C1
- Programación → C7_C8_C9
- Asignar → C5_C6
- Perfil → B15 (compartido)

### 5. Onboarding D2 (3 min)

```
D2_free_premium_transition.html  "Más tarde / Saltar"  → B1_dashboard_atleta.html
D2_free_premium_transition.html  "Subir ahora / Upgrade" → B15_perfil_atleta.html (sección suscripción)
```

---

## 🛠️ Comandos útiles para retomar

### Localizar CTAs sin wirear
```bash
grep -nE "<button[^>]*>[A-Z]" wireframes/V1A_volta_dashboard.html | grep -v onclick
```

### Verificar que un archivo tenga _nav.js
```bash
grep -L "_nav.js" wireframes/*.html
# Debe imprimir solo: wireframes/index.html
```

### Inyectar onclick en un button por su texto (Python helper)
```python
# Guardar como scripts/wire_button.py
import sys
fname, label, dest = sys.argv[1:4]
p = f'wireframes/{fname}'
with open(p, 'r', encoding='utf-8') as f: c = f.read()
needle = '>' + label
idx = c.find(needle)
if idx == -1:
    print('NO MATCH'); sys.exit(1)
bstart = c.rfind('<button', 0, idx)
if 'onclick' in c[bstart:idx]:
    print('ALREADY WIRED'); sys.exit(0)
new = c[:bstart] + f"<button onclick=\"go('{dest}')\" " + c[bstart+len('<button '):]
with open(p, 'w', encoding='utf-8') as f: f.write(new)
print('OK')
```

Uso:
```bash
python scripts/wire_button.py V1A_volta_dashboard.html "Iniciar WOD" V1B_volta_prewod.html
```

> Nota encoding: en Windows PowerShell setear `PYTHONIOENCODING=utf-8` antes de ejecutar.

### Test del modal-aware nav
1. Abrir `wireframes/index.html` en navegador (doble click).
2. Click en cualquier tile (ej. B1) → abre modal con iframe.
3. Click en CTA "Iniciar Sesión" dentro del modal → debe cargar B4 **dentro del mismo modal** (no abrir pestaña).
4. Click X o ESC → cierra modal.
5. También probar abrir `B1_dashboard_atleta.html` directo (URL): "Iniciar Sesión" debe navegar en la pestaña actual.

---

## 📋 Checklist final (cuando termines)

- [ ] Volta golden path navega completo (V2→V1A→V1B→V1E→V1F→V6)
- [ ] Bottom nav Volta funciona en V1A, V3, V4, V5
- [ ] Bottom nav coach funciona en C1, C4, C7
- [ ] Todas las "back ←" llevan a su pantalla origen lógica (no solo a index)
- [ ] Modal de `index.html` mantiene la navegación interna (no se sale al hacer click)
- [ ] Cards secundarias en B1 (OLY, Injury, Pulse) navegan
- [ ] D2 free→premium tiene CTAs wireadas

---

## 🚀 Commit & push final

```bash
git add wireframes/
git commit -m "feat(wireframes): wiring completo de navegación entre pantallas

- _nav.js helper modal-aware en 43 wireframes
- Golden path Holy Oly atleta + coach + Volta funcionando
- Bottom navs role-aware
- back buttons con fallback explícito"
git push
```

---

## 📝 Notas de diseño

- **No reescribas estilos** de los wireframes — solo añade `onclick` y `<script src="_nav.js">`.
- **Para CTAs ambiguos** (ej. "Ver más", "Configurar"): déjalos sin wirear o usa `onclick="alert('TBD')"` para no confundir testers.
- **Pantallas con múltiples phones side-by-side** (A1, B6, B9, etc.): cada CTA representa una transición DENTRO del mismo file (no nav). Solo wirear los CTAs **finales** que salen de la pantalla.
- **Variantes B9b/c/d/e**: son variantes visuales del social card. Sus back deben ir a `B9_social_card.html` o al dashboard. No requieren CTAs nuevos.
