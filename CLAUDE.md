# Pantalla de sesión — Patagonia Fit & Rehab

> Este archivo lo lee automáticamente cualquier sesión de Claude que se abra en
> esta carpeta. Contiene el contexto completo del proyecto: qué se decidió, por
> qué, qué está verificado y qué falta. **Leerlo antes de proponer cambios.**

---

## Qué es esto

Una pantalla web que se proyecta en el box de Patagonia Fit & Rehab (Puerto
Varas) y muestra las planificaciones de entrenamiento del día. Hasta **15
clientes por hora simultáneos**, cada uno con su planificación **completa y sin
cortar**.

Reemplaza el proceso actual: hoy alguien busca a mano en Drive el Google Sheet
de cada cliente y lo proyecta uno por uno.

## Estado — al 20 de agosto de 2026

| | |
|---|---|
| Versión publicada | **v15** |
| Publicación en GitHub Pages | https://dulloa-pfr.github.io/pantalla-box/ |
| Endpoint fase 1 (catálogo) | **Andando.** La pantalla opera con datos reales |
| Endpoint de guardado | Andando. Ver `docs/ENDPOINT_GUARDAR.md` |
| Tablero compartido entre computadores | Andando. Ver `docs/ENDPOINT_ESTADO.md` |
| Endpoint fase 2 (agenda) | Congelado hasta que se agende entrenamiento en el CMS |
| Conexión con Drive | **No existe y no debe construirse.** Ver "Decisiones" |

**Dónde vive el proyecto.** El repositorio está en la carpeta `VS Code` de
iCloud Drive, en `App Pantalla`. El CMS es **otro** repositorio y vive fuera de
iCloud, en `~/Proyectos/cms-patagoniafitrehab` — se sacó de iCloud a propósito
y no hay que devolverlo ahí.

**Lo que queda pendiente** está anotado en `docs/README.md`. Lo más importante:
quitar el token de `config.js` una vez que los computadores estén con sesión
iniciada en el CMS.

---

## Arquitectura

```
CMS (Render)                     Pantalla (GitHub Pages)
     │                                    │
     │  GET /api/pantalla/sesiones        │
     │  ?fecha=AAAA-MM-DD                 │
     └──────────── JSON ─────────────────►│
                                          │
                                    15 fichas en el TV
```

La pantalla es **estática**: HTML + CSS + JavaScript en un solo archivo, sin
framework, sin build, sin dependencias. Se descarga entera de una vez y pide los
datos por HTTP.

### Archivos

| Archivo | Qué es |
|---|---|
Los archivos que se publican viven en la **raíz** del repositorio, no en una
subcarpeta. GitHub Pages sirve desde ahí.

| Archivo | Qué es |
|---|---|
| `index.html` | **Toda la aplicación.** HTML, CSS y JS en un archivo |
| `config.js` | URLs y ajustes. **Se edita, nunca se reemplaza** |
| `sw.js` | Service worker: hace que funcione sin internet |
| `manifest.webmanifest` | Permite instalarla como app de escritorio |
| `icon-*.png` | Íconos, generados desde el logo oficial |
| `docs/` | Toda la documentación. Empezar por `docs/README.md` |
| `docs/Especificacion_CMS_Pantalla.md` | Contrato del endpoint. **Fuente de verdad** |
| `docs/GUIA_GITHUB.md` | Publicación paso a paso, para no técnicos |
| `docs/historial/` | Qué cambió en cada versión, de la v4 a la v15 |

### Configuración

Todo vive en el bloque `CONFIG` al inicio del `<script>` de `index.html`:

```js
const CONFIG = {
  endpoint: "",            // URL del CMS — lo único que falta llenar
  csv: "",                 // alternativa: Google Sheet publicado como CSV
  fecha: "",               // vacío = hoy
  refrescoSegundos: 120,
  cargarHoraActual: true,
  capacidad: 15
};
```

Con `endpoint` y `csv` vacíos, funciona con datos de demostración incrustados.

---

## Decisiones tomadas y por qué

Estas decisiones tienen razones concretas detrás. **No revertirlas sin releer
esta sección.**

### 1. No leer los Google Sheets de Drive directamente

En Drive hay **más de 100 planificaciones**, una por cliente, en
`/<Entrenador>/<RUT> - <Nombre>/04_Planificaciones/`. Se descartó conectarse ahí
por tres razones: habría que publicar cada archivo individualmente, el plan **no
dice qué sesión toca hoy**, y **no trae hora ni tipo de servicio**.

La planilla `Agenda — Patagonia Fit & Rehab` sí tiene reservas con
`Fecha | Hora inicio | Cliente | RUT | Profesional | Estado` y una hoja de
clientes activos en kinesiología. El endpoint debe ser **el cruce de agenda +
plan**, que el CMS ya tiene en su base de datos.

### 2. No modificar el formato de los Sheets de los profesionales

Los usan a diario Cristóbal Salvo, Luis Martínez, Gabriel Gallardo y Elián
Marte. El endpoint es una **salida adicional**, no un reemplazo.

### 3. Empaquetado tipo tetris con ajuste de tamaño

El requisito duro es que **nada quede cortado**. La solución: se mide el alto
real de cada ficha, se convierte en filas de una grilla densa
(`grid-auto-flow: dense`), y se hace búsqueda binaria del tamaño de letra que
hace entrar todo. Si sobra espacio la letra **crece**; si falta, se achica.

Verificado a 1366×768, 1920×1080, 2560×1440 y 3840×2160: cero cortes.
Con 15 fichas la letra queda en 13,2 px; al sacar 3 personas sube sola a 16,4 px.

### 4. PWA en vez de Electron

Se instala desde Chrome, queda con ícono y ventana propia, funciona sin
internet. Sin instaladores por sistema operativo ni mantenimiento.
Además el `fetch` al CMS **solo funciona sobre https**, no desde `file://` —
así que alojarla no es opcional.

### 5. Colores institucionales por tipo de servicio

Negro `#1D1D1B`, magenta `#AC07F2` = entrenamiento, lima `#B2D705` =
kinesiología, blanco. Extraídos del logo oficial. El color pinta el borde
superior, la etiqueta, los títulos de bloque, las repeticiones y las cargas.

---

## Hallazgos del análisis de Drive

Se probó un lector (`parser.py`) contra **18 planificaciones reales** de
distintos entrenadores. Resultado: **50 sesiones, 165 bloques, 435 ejercicios**.

| Hallazgo | Dato |
|---|---|
| Repeticiones mezcladas en el nombre | 2 dialectos: `10 extensión de rodilla` y `mov cadera x20`. Acierto **94,3%** |
| Bloques sin nombre | **82 de 165** exportan como `▌ BLOQUE: X3` |
| Campo `Coach` no confiable | En 6 de 18 planes el valor literal es `1` |
| Sesiones fantasma | Pestañas `Nueva sesión` y `Dia extra` con todo en `—` |
| Títulos sin normalizar | `Mesociclo 1`, `MC1 26`, `MC1 2026 AGOSTO`, `Mc1 (copia)` |
| Horas en formato ambiguo | La Agenda escribe `09:00 a. m.` |

Los Sheets los genera el CMS: llevan la advertencia *"Este archivo se regenera
desde el CMS. Los cambios manuales se pierden al re-exportar."*

---

## Giro de diseño del 18-08-2026 — LEER ANTES QUE NADA

La exploración de la base del CMS cambió la arquitectura. **La pantalla ya no
depende de la agenda.**

Dato que lo motivó: **390 reservas `kine_sesion` contra 1 `performance_1a4`.**
El box entrena 12-15 personas por hora, pero eso no existe como reserva en el
CMS. Construir sobre la agenda dejaba la pantalla esperando un dato que nadie
genera.

**Fase 1 (ahora):** endpoint `GET /api/pantalla/clientes` con el catálogo de
clientes con plan activo y sus sesiones. La pantalla arranca vacía y el coach
busca con `+` y elige qué sesión proyectar. No necesita reservas, no necesita
puntero, no cambia el flujo de trabajo de nadie.

**Fase 2 (después):** endpoint `GET /api/pantalla/sesiones?fecha=` para carga
automática por bloque horario, cuando se agende entrenamiento en el CMS.

La pantalla **detecta sola con cuál habla**: si la respuesta trae `clientes`
entra en modo catálogo; si trae `sesiones`, en modo agenda. Está probada en los
dos. `CONFIG.endpoint` es la fase 1, `CONFIG.endpointAgenda` la fase 2.

### Otras cosas que la base desmintió

- **`reps` no está separado.** Lleno en 10 de 3.585 líneas; los números viven
  dentro de `exerciseName`. El parser del 94,3 % se necesita igual — la promesa
  de "pedirle reps al CMS da 100 %" era falsa.
- **El estado `confirmada` no existe.** 328 cancelada, 60 agendada, 2 asistio,
  1 reagendada. Filtrar por confirmada dejaba la pantalla en blanco. Regla
  correcta: excluir solo `cancelada`.
- **`formatConfig.blockSeries` se usa 0 veces.** Las rondas están escritas
  dentro del nombre del bloque: 486 de 1.378 son del tipo `X3`.
- **`completedAt` está muerto** (16 de 504, cero en 30 días). Los coaches usan
  `manualCheck` (84 marcas). El campo `hecha` lee los dos, y es solo
  informativo.

---

## La pregunta crítica — CONFIRMADA, y ya no bloquea

**18-08-2026.** La exploración del CMS confirmó que la relación
`(cliente, fecha) → sesión del plan` **no existe en entrenamiento**.
`bookings.trainingPlanId` apunta al plan, no a la sesión; no hay
`planningSessionId` en el esquema; `planning_sessions.sessionDate` es un
calendario paralelo manual marcado como legacy. En kinesiología sí existe, vía
`kine_sessions.bookingId`.

**Resuelto sacándolo de la ruta crítica.** En el modo catálogo **el coach elige
la sesión**, así que no hace falta ningún puntero automático. El diagnóstico
confirmó que un puntero por finalización habría dejado al 94,4 % de los clientes
atascado en la primera sesión.

Cuando llegue la fase 2, `plan.sesion_id` será una propuesta corregible, nunca
una verdad.

---

## Cosas que NO hay que hacer

- Reformatear o "mejorar" `index.html`. Está probado end-to-end. El único
  cambio previsto es el valor de `CONFIG.endpoint`.
- Renombrar o mover archivos dentro de `pantalla/`. Las rutas de `sw.js`, el
  manifiesto y los íconos son relativas y se rompen.
- Agregar un framework, un bundler o dependencias npm. La pantalla corre en un
  PC de gimnasio y tiene que arrancar sola, sin build.
- Modificar nada en Google Drive.
- Devolver del endpoint un formato distinto al de la especificación.

---

## Comportamiento que hay que preservar

Verificado y funcionando:

- Al abrir, proyecta sola a la gente de la hora en curso.
- El `✕` saca una ficha y las demás se reacomodan sin dejar huecos.
- Un cliente sacado con `✕` **no reaparece** en el refresco automático (se
  guarda en el conjunto `quitados`).
- "Deshacer" disponible 6 segundos tras sacar a alguien.
- Si se cae el CMS, muestra la última copia desde `localStorage` y lo avisa.
- El `+` busca entre lo **ya descargado**, no consulta Drive en vivo.
- En modo catálogo la pantalla **arranca vacía**, a propósito.
- Un cliente no puede estar dos veces: elegir otra sesión suya **cambia** la
  ficha y **conserva su posición**.
- Cambiar de sesión funciona **aunque la pantalla esté llena** (el tope de 15
  aplica solo al agregar personas nuevas).

### Limitación conocida

Un cliente que llega sin estar agendado **no aparece en el `+`**, porque no
venía en la lista del día. Hoy se resuelve agendándolo en el CMS y presionando
`⟳ Drive`. Si pasa seguido, hay que diseñar una solución.

---

## Contexto operativo

- Box en Puerto Varas, Chile. Zona horaria `America/Santiago`.
- Bloques de 1 hora, de 07:00 a 21:00, lunes a viernes.
- Packs "Performance 1:4" — un coach cada 4 clientes.
- Entrenadores: Cristóbal Salvo, Luis Martínez, Gabriel Gallardo, Elián Marte,
  Jaime Castro Coronado, Daniela Ulloa. Hay una carpeta "CLIENTES SIN ASIGNAR".
- Dueña del proyecto: Daniela Ulloa.
- El CMS está hecho con Claude en VS Code, desplegado en Render desde GitHub.

---

## Registro de correcciones

**18-08-2026 — cabecera estática (corregido).** El reloj grande y la fecha del
encabezado se asignaban una sola vez al arrancar leyendo del objeto `DEMO`, sin
recalcularse. Con el CMS conectado habrían mostrado para siempre la fecha de
demostración. Se reemplazó por una función `pintarCabecera()` que se llama al
cargar datos y al cambiar de bloque horario: el número grande muestra el bloque
seleccionado (o `HOY` cuando se ven todos) y la fecha sale de
`CONFIG.fecha || hoy()`. Detectado por el agente en la Tarea A.

**18-08-2026 — 404 de favicon (corregido).** Se agregó
`<link rel="icon" href="icon-192.png">`, que faltaba junto al `apple-touch-icon`.

**18-08-2026 — modo catálogo (nuevo).** El `+` ahora lista clientes con un botón
por sesión; el zoom permite cambiar de sesión; los chips de hora se ocultan
cuando no hay datos de agenda. Verificado: arranque vacío, 15 fichas sin cortes
a 12,9 px, cambio de sesión conservando posición, y con pantalla llena.

**18-08-2026 — tope de capacidad bloqueaba el cambio de sesión (corregido).**
Con 15 fichas proyectadas, cambiar la sesión de una ficha existente se
rechazaba como si fuera agregar una persona nueva.

## Decisiones pendientes de Daniela

1. ¿Debe mostrarse el nombre del profesional en la ficha, o sobra en pantalla?
2. ¿La pantalla carga sola la hora en curso, o el equipo agrega a mano con `+`?
   (hoy está en automático: `CONFIG.cargarHoraActual = true`)
