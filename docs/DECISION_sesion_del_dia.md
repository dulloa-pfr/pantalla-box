# Decisión: cómo saber qué sesión toca hoy

Documento de decisión tras la exploración del CMS (18-08-2026).
Contiene el análisis, la recomendación, y las consultas de diagnóstico que
faltan para cerrarla.

---

## El problema, confirmado contra el código

En **entrenamiento no existe** ninguna relación `(cliente, fecha) → sesión del
plan`. Verificado por cuatro vías: `bookings.trainingPlanId` apunta al plan pero
no a la sesión, no hay `planningSessionId` en el esquema, `planning_sessions.
sessionDate` es un calendario paralelo manual y desconectado, y
`weekly_session_logs` liga a semana ISO, no a día.

En **kinesiología sí existe**: `kine_sessions.bookingId` resuelve el cruce.

---

## Descartar el atajo: arrancar solo con kinesiología

Suena razonable, pero **produciría una pantalla vacía**.

En la planilla `Agenda — Patagonia Fit & Rehab`, la hoja "Clientes activos en
kinesiología" lista ~42 personas y **prácticamente todas figuran con
`0` sesiones y estado `SIN PACK CONTRATADO`**. Solo dos registran una sesión,
ambas del 20-07-2026. Mientras tanto, entrenamiento tiene más de 100
planificaciones activas y es lo que llena el box a las 7 AM.

Kinesiología es el camino técnicamente fácil y operativamente inútil. Sirve como
prueba de integración, no como puesta en marcha.

---

## Las tres opciones planteadas, y por qué ninguna convence

**(a) Agregar `planningSessionId` a `bookings`, elegido al agendar.**
Es lo más explícito, pero choca con la realidad: las reservas se crean con
semanas de anticipación —en la Agenda hay reservas creadas en bloque para todo
un mes— y en ese momento **la sesión que tocará todavía no se sabe**, incluso el
plan puede no existir. Obliga al coach a decidir en el peor momento posible.

**(b) Usar `sessionDate` y que la agenda lo rellene.**
Es sincronizar dos calendarios que hoy viven separados. El propio esquema marca
ese campo como *"opcional, legacy"*. Sincronización bidireccional entre dos
fuentes de verdad es la receta clásica de datos inconsistentes.

**(c) Rotación automática por `orderIndex`.**
Tu agente tiene razón en rechazarla **si la rotación se calcula por fecha**.
Pero cambia por completo si el puntero es la **finalización**, no el calendario.

---

## La opción que recomiendo: puntero por finalización, con corrección en pantalla

**La sesión del día es la primera del plan activo con `completedAt IS NULL`,
ordenada por `orderIndex`.**

Por qué esto no tiene el defecto que teme tu agente: si un cliente falta una
semana, **el puntero no se mueve** — sigue pendiente la misma sesión, que es
justamente la correcta cuando vuelva. El calendario deja de importar. Lo que
hace avanzar el puntero es haber hecho la sesión, que es la definición real.

Y para el caso en que el puntero se equivoque igual (el coach reordena, o alguien
olvidó marcar una sesión como hecha), la solución no es más lógica en el
servidor: **es dejar que el coach lo corrija en la pantalla, en un toque.**

### Cómo funciona

1. El endpoint devuelve, por cada reserva, la sesión propuesta **y la lista
   completa de sesiones de ese plan**.
2. La pantalla muestra la propuesta. Si está mala, el coach abre la ficha y
   elige otra de la lista. Cero fricción, cero espera.
3. **Fase 2 (después):** cuando el coach presiona la `✕` porque el cliente
   terminó, el CMS marca `completedAt`. Ahí el puntero se mantiene solo.

Ese punto 3 es lo elegante del asunto: la `✕` ya existe en la pantalla y ya
significa "esta persona terminó". Conectarla a `completedAt` convierte a la
pantalla en lo que mantiene vivo el dato, en vez de pedirle a los coaches una
tarea nueva.

### Ventajas frente a las otras

- **No toca el flujo de trabajo de los coaches.** Nadie tiene que llenar nada
  nuevo al agendar.
- **No requiere cambios de esquema** para la fase 1.
- **Se autocorrige**, en vez de acumular error.
- Es incremental: si la fase 2 no se hace nunca, la fase 1 igual funciona con
  corrección manual.

### El riesgo, y cómo medirlo antes

Todo depende de que **`completedAt` se esté usando hoy**. Si nadie marca
sesiones como completadas, el puntero nunca avanza y la pantalla proyectaría
siempre la Sesión A. Eso **hay que medirlo antes de construir nada** — está en
las consultas de abajo.

Si resulta que `completedAt` está vacío en la práctica, la fase 2 deja de ser
opcional y pasa a ser parte de la fase 1.

---

## Consultas de diagnóstico

Cierran los puntos 3, 4 y el riesgo recién descrito.

### Sobre las credenciales

**No entregues el `DATABASE_URL` de producción.** Es una credencial con acceso
total; el hecho de que la consulta sea `SELECT` no reduce el riesgo de la llave
en sí. Tienes dos caminos mejores:

- **Recomendado:** ejecutar las consultas tú misma desde el panel de Render
  (la base Postgres trae acceso a consola) y pegarle los resultados al agente.
  Son 5 consultas, copiar y pegar.
- **Alternativa:** crear un usuario de solo lectura en la base y entregar esa
  credencial, no la de administrador.

### Nota sobre los nombres de columna

El agente reportó los nombres en camelCase porque los leyó del código
TypeScript. Si el ORM mapea a snake_case, hay que ajustar (`completedAt` →
`completed_at`, etc.). Que el agente confirme contra el esquema real.

```sql
-- 1) ¿Cuántas líneas de ejercicio vienen limpias y cuántas en texto libre?
--    Define si el endpoint puede entregar reps/nombre/carga separados
--    o si tiene que extraerlos.
SELECT mode, COUNT(*) AS lineas,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM planning_lines
GROUP BY mode;

-- 2) ¿Qué pasa con el nombre de los bloques?
--    Distingue entre nulo, vacío, y "el coach escribió las rondas ahí".
SELECT CASE
         WHEN name IS NULL           THEN 'nulo'
         WHEN TRIM(name) = ''        THEN 'vacio'
         WHEN name ~* '^\s*x\s*\d'   THEN 'solo rondas (ej: X3)'
         WHEN name ~* 'x\s*\d+\s*$'  THEN 'nombre + rondas al final'
         ELSE 'nombre normal'
       END AS caso,
       COUNT(*) AS bloques
FROM planning_blocks
GROUP BY 1 ORDER BY bloques DESC;

-- 3) EL MÁS IMPORTANTE: ¿se está usando completedAt?
--    Si la respuesta es "casi ninguna", el puntero por finalización
--    necesita que la pantalla escriba de vuelta desde el día uno.
SELECT COUNT(*)                                              AS sesiones_total,
       COUNT(completed_at)                                   AS con_completado,
       ROUND(100.0 * COUNT(completed_at) / NULLIF(COUNT(*),0), 1) AS pct,
       MAX(completed_at)                                     AS ultima_marca
FROM planning_sessions;

-- 4) ¿Se puede llegar del plan desde la reserva?
--    Si trainingPlanId viene mayormente nulo, ni siquiera tenemos el plan.
SELECT COUNT(*)                        AS reservas,
       COUNT(training_plan_id)         AS con_plan,
       ROUND(100.0 * COUNT(training_plan_id) / NULLIF(COUNT(*),0), 1) AS pct
FROM bookings
WHERE starts_at >= NOW() - INTERVAL '60 days'
  AND status NOT IN ('cancelada');

-- 5) ¿Y las rondas del bloque, están en formatConfig?
SELECT COUNT(*) AS bloques,
       COUNT(format_config ->> 'blockSeries') AS con_blockseries
FROM planning_blocks;
```

---

## Sobre la etiqueta de la sesión

La especificación usaba `"Día 1"` solo como ejemplo. **Manda el CMS.**
Se ajusta así:

- `plan.sesion` → etiqueta corta, la que se ve grande en la ficha: `"Sesión A"`
- `plan.sesion_titulo` → descripción, opcional: `"Tren inferior + core"`

Se separan porque en la ficha la etiqueta va en un espacio chico y el título
completo no cabe. Con los dos campos la pantalla decide cómo mostrarlos.

---

## Qué responderle al agente

1. **No arrancar solo con kinesiología** — la evidencia de la Agenda dice que
   está prácticamente sin actividad.
2. **Puntero por finalización + corrección manual en pantalla.** Nada de
   `planningSessionId` en `bookings`, nada de sincronizar `sessionDate`.
3. **Consultas primero.** Especialmente la número 3.
4. Que **no reciba el `DATABASE_URL`**: los resultados se le pegan.
