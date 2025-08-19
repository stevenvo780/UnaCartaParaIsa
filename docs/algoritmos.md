# Algoritmos fundamentales (resumen)

Este documento concentra solo los procesos matemáticos clave del proyecto.

## 1) Resonancia y cercanía
- Archivo: `src/utils/resonanceCalculations.ts`
- Ideas principales:
  - Proximidad: decaimiento exponencial sobre distancia normalizada logarítmicamente.
  - Armonía: sigmoide `σ(x,k)=1/(1+e^{-k·x})` aplicada a `harmony/100`.
  - Resonancia: `base + A·proximidad + B·σ(armonía) + bono_tiempo`, luego clamp [0,100] y redondeo preciso.
  - ΔResonancia/seg: `(ganancia − separación − estrés) · (Δt/1000)` donde:
    - ganancia ∝ cercanía × (salud/energía/ánimo promedio) × sinergia × (1 − resonancia/100)
    - separación ∝ (1 − cercanía) × (resonancia/100)
    - estrés ∝ estadísticas críticas (<20)

## 2) Dinámica de actividades y prioridad
- Archivo: `src/utils/activityDynamics.ts`
- Prioridad base: combinación de urgencias no lineales por stat usando `w(v,α)=1−(v/100)^α` (α∈[0.1,10]).
- Eficiencia temporal: curvas en campana alrededor de `optimalDuration` por actividad.
- Penalización por sobretiempo: reducción cuando `timeSpent > 1.5·optimalDuration`.
- Decaimiento híbrido: tasas por estadística escaladas por actividad y tiempo; clamp en 0..100 (dinero ≥0).
- Ritmo circadiano: multiplicadores nocturnos para descanso/energía/aburrimiento.

## 3) IA de decisiones (actividad siguiente)
- Archivo: `src/utils/aiDecisionEngine.ts`
- Puntuación: prioridad base → modificadores por `mood` y `personalidad` → sesgo de hábito.
- Selección: softmax con temperatura `τ`:
  - `P(i) = exp((s_i − max s)/τ) / Σ_j exp((s_j − max s)/τ)`
- Cambio con inercia: solo cambia si `score > threshold + 10·inercia_sesión`.
- Sesiones: duración planificada por persistencia; satisfacción alimenta el sesgo de hábito.

Notas de precisión
- Se usan clamps y validaciones de número para evitar NaN e infinitos; redondeo con `preciseRound`.
