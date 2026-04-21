import matplotlib.pyplot as plt
import numpy as np

# Configuración del Modelo Banister (Extraído del 01_stress_engine.md)
days = 40
load = np.zeros(days)
fitness = np.zeros(days)
fatigue = np.zeros(days)
readiness = np.zeros(days)

# Simulamos sesiones de entrenamiento (Load)
# Días 1-4: Entrenamiento fuerte
load[1:5] = [2800, 3200, 2500, 3000]
# Días 5-6: Descanso
# Días 7-10: Entrenamiento medio
load[7:11] = [2000, 2500, 2200, 2600]
# Día 14: Sesión muy dura (Overreach)
load[14] = 4000
# Día 18-20: Pico de entrenamiento (Fase de fuerza)
load[18:21] = [3500, 3800, 3200]
# Día 21 en adelante: Deload / Tapering (Poco volumen para disipar fatiga)
load[25:28] = [1000, 1200, 800]

# Constantes del EMA
alpha = 0.25  # Tasa de decaimiento Fatigue (7 días)
beta = 0.069  # Tasa de decaimiento Fitness (28 días)

# Condiciones iniciales
fitness[0] = 50
fatigue[0] = 20

# Cálculo iterativo del Modelo Banister
for i in range(1, days):
    fitness[i] = (beta * load[i]) + ((1 - beta) * fitness[i-1])
    fatigue[i] = (alpha * load[i]) + ((1 - alpha) * fatigue[i-1])
    
    # Readiness = ((Fitness - Fatigue) / Fitness) * 100
    if fitness[i] > 0:
        raw_readiness = ((fitness[i] - fatigue[i]) / fitness[i]) * 100
        # Clampeamos entre 0 y 100
        readiness[i] = max(0, min(100, raw_readiness))

# ================= PLOT =================
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), sharex=True)

# Subplot 1: Fitness vs Fatigue
ax1.plot(range(days), fitness, label='Fitness (Largo plazo - 28 días)', color='#3498db', linewidth=3)
ax1.plot(range(days), fatigue, label='Fatigue (Corto plazo - 7 días)', color='#e74c3c', linewidth=2, linestyle='--')
ax1.bar(range(days), load / 100, label='Carga de Sesión (x100)', color='gray', alpha=0.3) # Scaled para visualización
ax1.set_title('Motor de Estrés: Modelo Banister (Fitness vs Fatiga)', fontsize=16)
ax1.set_ylabel('Score Relativo')
ax1.legend(loc='upper right')
ax1.grid(True, alpha=0.2)

# Subplot 2: Readiness (El Score Final)
ax2.plot(range(days), readiness, label='Readiness % (Fitness - Fatigue)', color='#2ecc71', linewidth=3)
ax2.axhline(75, color='green', linestyle=':', label='Óptimo para PRs / Alta Intensidad')
ax2.axhline(40, color='orange', linestyle=':', label='Precaución (Riesgo Moderado)')
ax2.axhline(20, color='red', linestyle=':', label='Zona de Riesgo (Sobrentrenamiento)')

# Marcar el momento de Supercompensación (Pico de Readiness)
supercomp_day = np.argmax(readiness[28:]) + 28
ax2.annotate('Pico de Supercompensación\n(Listo para Competir/RM)', 
             xy=(supercomp_day, readiness[supercomp_day]), 
             xytext=(supercomp_day-8, readiness[supercomp_day]-15),
             arrowprops=dict(facecolor='black', shrink=0.05),
             fontsize=10, weight='bold')

ax2.set_title('Readiness (Preparación del Atleta)', fontsize=14)
ax2.set_xlabel('Días', fontsize=12)
ax2.set_ylabel('Readiness (0-100)')
ax2.set_ylim(-5, 105)
ax2.legend(loc='lower right')
ax2.grid(True, alpha=0.2)

plt.tight_layout()
plt.savefig('banister_stress_engine_graph.png', dpi=300)
print("Gráfico generado exitosamente: banister_stress_engine_graph.png")
