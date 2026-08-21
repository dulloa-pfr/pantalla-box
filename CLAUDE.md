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

## Estado

| | |
|---|---|
| Pantalla | **v17 publicada.** Control en el computador, proyección en uno o dos televisores |
| Tablero compartido | **Sí.** Dos computadores del centro manejan el mismo televisor |
| Editor en la pantalla | **Sí.** Entrenamiento sobrescribe; kinesiología versiona |
| Configuración | En `pantalla/config.js`, **aparte del `index.html`** |
| Publicación en GitHub Pages | **Hecha:** https://dulloa-pfr.github.io/pantalla-box/ |
| Endpoint fase 1 (catálogo) | **Hecho, desplegado y verificado** contra producción |
| Pantalla conectada al CMS | **Sí.** `CONFIG.endpoint` ya apunta al CMS y está publicada |
| Endpoint fase 2 (agenda) | Congelado hasta que se agende entrenamiento en el CMS |
| Conexión con Drive | **No existe y no debe construirse.** Ver "Decisiones" |

---

## Arquitectura

```
CMS (Render)                     Pantalla (GitHub Pages)
     │                                    │
     │  GET  /api/pantalla/clientes       │
     │  POST /api/pantalla/guardar        │
     │  GET/POST /api/pantalla/estado     │
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
| `pantalla/index.html` | **Toda la aplicación.** HTML, CSS y JS en un archivo. Se reemplaza entero en cada versión |
| `pantalla/config.js` | Las URLs y los interruptores. **Se edita una vez y no se reemplaza nunca** |
| `pantalla/sw.js` | Service worker: hace que funcione sin internet |
| `pantalla/manifest.webmanifest` | Permite instalarla como app de escritorio |
| `pantalla/icon-*.png` | Íconos, generados desde el logo oficial |
| `Especificacion_CMS_Pantalla.md` | Contrato del endpoint. **Fuente de verdad** |
| `INSTRUCCIONES_PARA_EL_AGENTE.md` | Plan de trabajo con checklist de verificación |
| `PROMPT_PARA_CLAUDE.md` | Mensaje para la sesión del CMS |
| `GUIA_GITHUB.md` | Publicación paso a paso, para no técnicos |

### Configuración

Todo vive en el bloque `CONFIG` al inicio del `<script>` de `index.html`:

```js
const CONFIG = {
  // Ya conectado. El CMS NO vive en patagoniafitrehab.cl (ese dominio es el
  // sitio público y da 404 en /api): el servicio de Render es patagonia-fit-cms.
  endpoint: "https://patagonia-fit-cms.onrender.com/api/pantalla/clientes?token=…",
  endpointAgenda: "",      // fase 2, congelada
  csv: "",                 // alternativa: Google Sheet publicado como CSV
  fecha: "",               // vacío = hoy
  refrescoSegundos: 300,
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

El requisito duro es que **nada quede cortado**. Se mide el alto real de cada
ficha, se convierte en filas de una grilla densa (`grid-auto-flow: dense`), y se
busca por bisección el tamaño de letra que hace entrar todo.

**Desde el 18-08-2026 el reparto de columnas ya no es una heurística fija:** se
prueban varios y se elige el que permite la letra más grande. Y una vez fijado
el alto de cada ficha, cada una crece hasta llenar *su* espacio, de modo que una
planificación larga ya no le impone su tamaño a las otras catorce.

Medido con los datos reales del endpoint a 1920×1080, cero cortes:

| fichas | antes | ahora |
|---|---|---|
| 15 | 8,31 px | **10,4–10,67 px** |
| 12 | 9,81 px | **13,41–13,84 px** |
| 10 | 9,35 px | **14,55–15,23 px** |
| 8 | 9,38 px | **17,5–18,13 px** |

Con 15 fichas: cero cortes también a 2560×1440 (16,1 px) y 3840×2160 (19 px,
el tope). **A 1366×768 quince planificaciones reales no caben** y el tablero
queda con scroll — pero eso ya pasaba con el algoritmo anterior, que a esa
resolución scrolleaba incluso con doce fichas; ahora doce entran.

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

- Reformatear o "mejorar" `index.html`. Está probado end-to-end. Los únicos
  cambios previstos son `CONFIG.endpoint` y `CONFIG.endpointGuardar`.
- **Reemplazar `pantalla/config.js`.** Es el único archivo que no se toca al
  actualizar. La v11 fue la excepción, y aun así se **editó** para agregarle dos
  claves, no se reemplazó.
- **Cambiar `index.html` sin subir el número de caché de `sw.js`.** Si no se
  sube, el PC del box sigue mostrando la versión vieja. Va en `pf-pantalla-vN`.
- **Reemplazar `pantalla/config.js` al actualizar.** Ahí viven las URLs con
  token. Se separó del `index.html` justamente para dejar de rescatarlas a mano
  en cada versión, que es un paso que un día se olvida y deja la pantalla en
  datos de demostración sin que nadie lo note.
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

En modo catálogo esto **dejó de depender de la agenda**: el `+` lista a todos
los clientes con planificación vigente, estén agendados o no. Lo que sí queda
fuera es **quien no tiene plan activo en el CMS** — se resuelve creándoselo y
apretando `⟳`.

Los pacientes de kinesiología aparecen solo si su ejercicio terapéutico está
cargado en el CMS, y hoy casi no lo está (5 episodios, 1 plan, 0 bloques
estructurados). No es un problema de la pantalla: es que ese dato todavía no se
escribe.

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

**21-08-2026 — el "día" proyectado no era el del CMS y la planificación llegaba
incompleta.** Reportado desde el box. Dos causas, las dos en el endpoint:

- **Las sesiones se pedían por `planId`**, así que las que cuelgan del cliente sin
  plan quedaban invisibles: **9 sesiones huérfanas**. Jorge Torrejón perdía una
  sesión entera de 9 ejercicios, y con ella se corría la numeración de los días.
- **Los bloques sin líneas se descartaban**, pero **81 bloques de 61 sesiones y 39
  clientes** llevan toda la prescripción en el *nombre* del bloque
  (`CARDIO TABATA 10 : 20/20`). Ahora se conservan si traen título.

Después de los dos arreglos: 348 → **359 sesiones**, 1.051 → **1.131 bloques**,
2.977 → **3.043 ejercicios**.

**21-08-2026 — v16: el mismo supuesto estaba tres veces en la pantalla, y uno de
los tres borraba datos.** `limpiaBloques`, `desdeCatalogo`/`desdeAgenda` y
`textoASesion` daban por vacío el bloque sin líneas. El tercero es el grave:
corre al **editar**, así que desde que el endpoint empezó a mandar esos bloques,
abrir una sesión de cardio, cambiar una carga y guardar **borraba el bloque del
CMS**. 61 sesiones en riesgo. Medido antes (4 de 4 perdidos) y después (0 de 4).
El texto largo va en la línea del ejercicio, no en el encabezado: el estilo de
encabezado es versalita apretada, y esas frases son las candidatas a descuadrar
la búsqueda binaria del tamaño de letra.

**21-08-2026 — v17: se cierra el único camino capaz de vaciar el tablero y volver
a llenarlo.** `cambiarHora()` hacía `fichas = []` y rellenaba con la hora elegida
**sin mirar el modo**. En catálogo, `Todas` significa *todo el catálogo*: el
tablero armado a mano se reemplazaba por 15 fichas en orden alfabético. Ahora
`cambiarHora` y `primeraCarga` no hacen nada fuera del modo agenda. Verificado
forzando `MODO='agenda'` en el navegador: el tablero se queda como estaba.

**21-08-2026 — el orden de las sesiones tiene desempate explícito.** Las huérfanas
van al final (todas con `orderIndex 0`) y entre ellas desempata el `id`, para que
el "Día 4" de la pantalla sea el mismo de una carga a la otra. La lógica se sacó
a `compararSesiones` con pruebas, incluida una que fija que el orden se calcula
sobre el `id` numérico de la base y **no** sobre el `ps_…` que se agrega después.

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

**18-08-2026 — endpoint fase 1 implementado y conectado.** Vive en
`server/_core/pantallaRoutes.ts` del CMS, con la lógica de parseo en
`shared/pantallaParser.ts` (con pruebas). Es REST plano, no tRPC, porque la
pantalla no tiene sesión ni cookies. El CORS se agregó **solo en
`/api/pantalla/*`**: el resto del CMS se autentica con cookies y abrirlo entero
sería un agujero. La pantalla publicada era la versión vieja, que solo entendía
`{sesiones:[…]}` y se habría quedado en blanco; se reemplazó por la de catálogo.

**18-08-2026 — el CMS no está en `patagoniafitrehab.cl`.** Se perdió tiempo
creyendo que un despliegue había fallado. Ese dominio es el sitio público y
devuelve 404 en todo `/api`, incluidas rutas que ya existían. El CMS es el
servicio de Render **`patagonia-fit-cms`** →
`https://patagonia-fit-cms.onrender.com`.

**18-08-2026 — el color de la ficha salía de las reservas (corregido).** Medido
contra producción: **56 de 125 clientes se proyectaban en lima**, incluidos
varios cuyo plan se llama `Plan performance_1a4 · 8 sesiones`. La causa es la
misma asimetría que motivó el giro de diseño — 390 reservas de kine contra 1 de
entrenamiento —, así que cualquiera que pasó una vez por kinesiología quedaba
marcado para siempre. Ahora el servicio sale del **origen del plan**, que además
no necesita consultar la agenda. Detectado por Daniela al revisar la propuesta.

**18-08-2026 — segunda fuente para kinesiología (nuevo).** Al sacar el color de
las reservas, los pacientes de kine se quedaban sin quién los pinte: su
planificación no vive en `planning_sessions` sino colgando de `kinePlanId` /
`kineSessionId`. El catálogo ahora también sale de `kine_episodes` activos.
Rinde **2 fichas**, y no es un defecto: existen 5 episodios, 1 plan de ejercicio
y **0 bloques en `kinePlanId`**. Las 390 reservas son horas agendadas, no
planificaciones registradas. La cañería queda puesta para cuando se carguen.

**18-08-2026 — el RUT ya no viaja.** La respuesta es una URL pública y la
búsqueda por nombre basta.

**18-08-2026 — `getPlanningSessionWithBlocks` no se usó, a propósito.** La
especificación v3 pedía reutilizarla sin advertir que resuelve una sesión a la
vez y consulta por cada bloque: ~1.900 viajes a TiDB por request. Se reemplazó
por consultas en lote.

**18-08-2026 — tres formas de escribir un ejercicio que el parser no entendía.**
Medidas por Daniela sobre los 2.977 ejercicios reales. Precisión **91,8 % →
93,5 %**:

- **Segundos con comillas** (32 casos): `20" plancha`, `30'' hollow`, `20'`.
  Solo se aceptaba `seg|segs|s|min`, así que el número quedaba pegado al nombre.
- **Número pegado al nombre** (2 casos): `2monster walk`, `6-8Squat barra`. Ya
  no se exige espacio si lo que sigue es una letra — **salvo** ante una `x`
  seguida de dígito, porque `5x10 press` son series por repeticiones.
- **Filas que solo dicen las rondas** (17 casos): un ejercicio llamado `x3`. Se
  descarta y, si el bloque no traía rondas, se usan como las suyas.

Al escribir el segundo apareció un defecto que las pruebas atajaron: como el
patrón es insensible a mayúsculas, la unidad `s` se comía la `S` de `6-8Squat` y
devolvía reps `6-8S` con el nombre `quat barra`. Las unidades de palabra ahora
exigen que no venga otra letra detrás.

**18-08-2026 — empaquetado por mejor reparto de columnas.** El algoritmo elegía
las columnas con una heurística fija y recién después buscaba la letra más
grande que entrara en *ese* reparto, así que el reparto elegido no era el que
más letra permitía. Además una sola planificación larga le imponía su tamaño a
las demás. Ahora se prueban varios repartos y cada ficha crece hasta llenar su
propio espacio. Con datos reales a 1920×1080 y las mismas fichas: 12 fichas
pasan de 9,81 px a 13,84 px. Verificado con Chrome sin interfaz: cero cortes con
15 fichas a 1920×1080, 2560×1440 y 3840×2160. Ver la decisión 3.

**19-08-2026 — v11: la barra superior se cortaba desde la v8.** Los botones de
dos televisores la dejaron necesitando 1593 px; bajo esa medida se salían de
pantalla `Abrir pantalla del box`, `Vaciar` y el reloj, sin ningún aviso — a
1366×768 se salían 227 px. Ahora se mide y se compacta por orden de sacrificio,
y los nombres de los botones son lo último que cede. Verificado de 1920 a 1024:
margen de 18 px, nada se sale, los cinco botones con nombre.

**19-08-2026 — tablero compartido entre computadores (nuevo).**
`GET`/`POST /api/pantalla/estado` con control de versión: dos profesionales
alimentan el mismo televisor desde equipos distintos. Verificado con dos
navegadores independientes: A agrega tres, B los ve; B saca uno, A lo ve; y con
nadie tocando nada la versión se queda quieta, sin bucle de escrituras.

Dos decisiones del lado del CMS que conviene no revertir:

- **`fichas` es LONGTEXT, no JSON.** El cliente compara una huella del tablero
  para decidir si publica; una columna JSON normaliza y reordena claves, la
  huella cambiaría en cada lectura y volvería el bucle de escrituras infinito
  que el cliente ya corrigió. Y 15 fichas son 30-60 KB: un TEXT (64 KB) queda al
  límite.
- **El control de versión va en el `WHERE` del `UPDATE`**, no en un `if` previo.
  Entre leer la versión y escribir cabe otra escritura. Probado con dos POST
  simultáneos: 200 y 409.

Efecto secundario que vale la pena: el tablero deja de vivir dentro de un
navegador, así que si el PC del box se reinicia a media mañana, al volver está
todo como estaba.

**18-08-2026 — v8: los tres botones de sesión decían todos "Sesión A".** El
buscador pintaba `etiqueta`, que en **121 de los 122** clientes con más de una
sesión es idéntica en todas, en vez de `titulo`, que en esos mismos 121 sí
distingue (`Día 1`, `Día 2`, `Día 3`). El dato bueno siempre vino en la
respuesta del CMS. Comprobado en producción: 0 de 348 sesiones con `titulo`
vacío. **La pantalla ahora depende de ese campo** — ver la especificación, con
las dos salvedades. Verificado con Jimmy Vidal: Día 1 (con ✓), Día 2, Día 3.

**18-08-2026 — v8: la pantalla se reparte en dos televisores.** `?tv=1` y
`?tv=2` muestran cada uno sus fichas; el reparto vive en el computador de
control y viaja por el canal que ya existía, sin pedirle nada al CMS. Con 15
fichas la letra sube de 12,4-14,5 px a 17,6-24,5 px. Verificado en vivo: al
apretar el chip TV de una ficha, la persona se cambia de televisor y las dos
ventanas se actualizan solas. En la ventana del TV el chip no se ve.

**18-08-2026 — v7: la configuración se separó a `config.js`.** Tres versiones
seguidas hubo que rescatar las URLs a mano del archivo que se reemplazaba. Ahora
`index.html` se cambia entero y `config.js` no se toca. Verificado que si
`config.js` falta, la pantalla **igual abre** con datos de demostración y lo
avisa.

**18-08-2026 — v4 de la pantalla: dos ventanas, franja kine y editor.** El
control queda en el computador (`index.html`) y el TV recibe solo las fichas
(`index.html?tv=1`), sincronizados por `BroadcastChannel`. Kinesiología pasa a
una franja propia al borde derecho, de ancho variable. Cada ficha estrena un
botón `✎` que abre un editor. Verificado en vivo: el botón `▣ Abrir pantalla del
box` aparece, las 10 fichas de prueba traen `✎` y `✕`, y las 2 fichas kinésicas
quedaron en `#boardKine` a la derecha, ocupando el 17 % declarado.

**18-08-2026 — el v4 llegó sin el cableado de PWA.** El `index.html` entregado
no trae `<link rel="manifest">`, ni `<link rel="icon">`, ni el
`serviceWorker.register('sw.js')` que sí tenía la versión anterior. Se publicó
tal cual porque así se pidió, pero tiene una consecuencia: **el número de caché
del service worker no sirve de nada si nadie registra el service worker.** El
que ya está instalado en el PC del box sigue vivo y es *network-first*, así que
con internet la pantalla igual se actualiza; lo que se pierde es la instalación
como aplicación y el funcionamiento sin conexión. Son cuatro líneas del `<head>`
y una al final del script.

**18-08-2026 — `POST /api/pantalla/guardar` (nuevo).** Sobrescribe la sesión
editada; no versiona. Comprueba que la sesión sea del cliente antes de escribir
—sin eso, cualquiera con el token podría pisar la planificación de otro—, valida
el cuerpo y le pone tope. Borra y reinserta bloques y líneas en una transacción.
Lo anterior queda en `audit_log` con la forma exacta que habría que volver a
mandar para deshacerlo, así que no hizo falta crear una tabla. Las fichas
kinésicas se rechazan con 409: la sesión clínica cerrada es inmutable y el plan
de ejercicio está versionado.

**18-08-2026 — kinesiología ya puede guardar, versionando.** Daniela decidió que
los kinesiólogos también dejen su corrección guardada. La objeción de fondo
seguía en pie, así que guardar desde una ficha kinésica **crea una versión nueva
del plan de ejercicio** del episodio en vez de sobrescribir: la anterior queda
entera y `kine_sessions` no se toca nunca. Es el mismo camino que ya usa el
módulo kine. Probado contra producción y luego restaurado creando una versión
más: quedó v1 original, v2 de prueba, v3 igual a la v1, todo trazable. El
interruptor `guardarKine` de `config.js` se puso en `true` **después** de que el
endpoint lo aceptara, para que nunca existiera un botón visible que fallara.

**18-08-2026 — el preflight bloqueaba el guardado, y curl no lo mostraba.** El
`POST` con cuerpo JSON dispara una consulta previa del navegador, y la respuesta
declaraba `GET, OPTIONS`. El endpoint respondía perfecto por consola y el botón
habría fallado **en silencio**. Misma trampa que la cabecera de origen.

**18-08-2026 — el error de parser reportado no existía en el CMS.** El documento
de la v4 pedía cambiar el separador de la regla de "repeticiones adelante" a
`\s+` porque `10 sentadilla` salía como `entadilla`. Comprobado uno por uno:
el CMS ya devuelve bien `10 sentadilla con salto`, `10 step up` y
`10 subida al cajón`. El defecto estaba en el parser **de la pantalla**, que es
otro archivo. Aplicar `\s+` habría **revertido** el arreglo de `2monster walk` y
`6-8Squat barra` pedido esa misma mañana. Los tres casos quedaron igual como
pruebas.

**18-08-2026 — `PANTALLA_TOKEN` definido en Render.** El endpoint ya exige
`?token=`; sin él responde 401 (con CORS, para que el fallo se pueda leer).
**Definir la variable no basta**: Render no reinicia el proceso al guardarla por
API, así que el candado no se activa hasta el despliegue siguiente. Hubo que
lanzar uno a mano.

## Decisiones pendientes de Daniela

1. ¿Debe mostrarse el nombre del profesional en la ficha, o sobra en pantalla?
2. ~~¿La pantalla carga sola la hora en curso?~~ **Resuelta por el diseño.**
   `cargarHoraActual` solo aplica en modo agenda; en catálogo la pantalla
   arranca vacía y el equipo agrega con `+`. Vuelve a decidirse si llega la
   fase 2.
3. ~~Definir `PANTALLA_TOKEN`~~ **Hecho.** Recordar que el repo de la pantalla
   es público: el token frena el acceso casual, no a quien lea el HTML. La
   defensa real es que la respuesta no lleva RUT ni datos de contacto.
4. ¿Vale la pena que los kinesiólogos carguen el ejercicio terapéutico en el
   CMS? Hoy no lo hacen y por eso el lima casi no pinta a nadie. La pantalla ya
   los mostraría sin ningún cambio de código.
5. ~~Pendiente de traspaso: `pantalla-v5-legibilidad.html`~~ **Hecho.** El
   archivo nunca llegó; Daniela pasó el cambio como texto y se aplicó así.
   La v4 llegó por carpeta en el Escritorio y esa vía sí funcionó.
7. ~~¿Reponer el cableado de PWA que la v4 dejó fuera?~~ **Hecho en la v6**, y
   verificado en el navegador: service worker activo y manifiesto descargable.
8. **¿Uno o dos televisores en el box?** Con dos, quince fichas pasan de 12-14 px
   a 18-24 px. Es la respuesta concreta a la duda de si conviene trabajar con 15
   o con 12, y ya no obliga a elegir.
9. *Elian Marte* tiene dos sesiones clínicas del mismo día, así que sus dos
   botones dicen `13-08-2026`. Es el único cliente donde `titulo` no distingue.
   Se arregla con una línea en el endpoint si molesta.
6. **Con datos reales, 15 fichas rinden 10,4 px y 12 rinden 13,8 px.** Vale la
   pena proyectarlo una mañana en el box y decidir si se trabaja con 15 o con
   12. Si la pantalla del box es de 1366×768, la decisión ya está tomada por los
   números: 15 no caben, 12 sí.

10. **La pantalla no sabe que hay una versión nueva.** Las pantallas de los
    profesionales quedan abiertas todo el día y no se recargan nunca, así que
    siguen corriendo la versión con la que se abrieron. Por eso un arreglo
    publicado no llega a quien lo necesita, y por eso el mismo día conviven
    versiones distintas en el box. Falta que la pantalla detecte que hay versión
    nueva y **se recargue sola**. Hoy esa pieza no existe, y es la explicación de
    fondo de por qué un defecto ya corregido se siguió viendo en el box.
