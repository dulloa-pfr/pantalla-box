# Especificación del endpoint — pantalla del box

**Patagonia Fit & Rehab** · v3 · 18-08-2026

> **v3 reemplaza por completo a v1 y v2.** Cambió la arquitectura: la fase 1
> ya **no depende de la agenda**. El motivo y la evidencia están al final, en
> "Por qué cambió el diseño".

---

## Resumen para el implementador

Se piden **dos endpoints**, en este orden de prioridad:

| | Endpoint | Cuándo | Qué resuelve |
|---|---|---|---|
| **Fase 1** | `GET /api/pantalla/clientes` | **Ahora** | Catálogo de clientes con plan activo. La pantalla arranca vacía y el coach busca y proyecta con el botón `+` |
| **Fase 2** | `GET /api/pantalla/sesiones?fecha=` | Cuando se agende entrenamiento en el CMS | Carga automática por bloque horario |

La pantalla ya está escrita, probada y **detecta sola con cuál está hablando**:
si la respuesta trae `clientes` entra en modo catálogo, si trae `sesiones` entra
en modo agenda. No hay que tocarla salvo para pegar la URL.

**Empezar por la fase 1.** La fase 2 no sirve de nada mientras el entrenamiento
no se agende en el CMS.

---

## Requisito que rompe todo si falta

```
Access-Control-Allow-Origin: *
```

Sin esa cabecera el navegador bloquea la lectura **aunque el endpoint funcione
perfecto al abrirlo a mano**. Es la causa número uno de "el endpoint anda pero
la pantalla no muestra nada".

---

# FASE 1 · `GET /api/pantalla/clientes`

Devuelve todos los clientes con un plan activo y las sesiones de ese plan, con
sus ejercicios. Sin filtro de fecha, sin depender de reservas.

**Tamaño:** con los números actuales del CMS (143 clientes, 504 sesiones, 3.585
líneas de ejercicio) la respuesta ronda los 400 KB. Se pide una sola vez al
abrir la pantalla y se refresca cada 5 minutos. No hace falta paginar.

```json
{
  "generado": "2026-08-18T09:12:00-04:00",
  "clientes": [
    {
      "id": "cl_1042",
      "nombre": "Juan Antonio Bernasconi",
      "rut": "6.394.598-6",
      "servicio": "entrenamiento",
      "profesional": "Cristóbal Salvo",
      "plan": {
        "nombre": "Mesociclo 1",
        "objetivo": "Mejorar postura y caminar normalmente"
      },
      "sesiones": [
        {
          "id": "ps_8842",
          "etiqueta": "Sesión A",
          "titulo": "Tren inferior + core",
          "hecha": false,
          "bloques": [
            {
              "titulo": "Movilidad y activación",
              "rondas": "x1-2",
              "ejercicios": [
                { "reps": "10", "nombre": "Extensión de rodilla",      "carga": "" },
                { "reps": "8",  "nombre": "Rotación de tronco pared",  "carga": "" },
                { "reps": "2",  "nombre": "Monster walk",              "carga": "" }
              ]
            },
            {
              "titulo": "Fuerza y estabilidad",
              "rondas": "x2-3",
              "ejercicios": [
                { "reps": "10", "nombre": "Squat técnica + banda",      "carga": "50 kg" },
                { "reps": "10", "nombre": "Remo kairos",                "carga": "40-50 lb" },
                { "reps": "10", "nombre": "Hip abduction",              "carga": "50-60 lb" },
                { "reps": "10", "nombre": "Press pallof anterior d.c.", "carga": "" }
              ]
            }
          ]
        },
        {
          "id": "ps_8843",
          "etiqueta": "Sesión B",
          "titulo": "Empuje + estabilidad",
          "hecha": true,
          "bloques": [ "…igual estructura…" ]
        }
      ]
    }
  ]
}
```

## Campos

| Campo | Oblig. | Notas |
|---|---|---|
| `id` | sí | Id del cliente. Estable entre llamadas |
| `nombre` | sí | Tal como debe verse proyectado |
| `rut` | no | Se puede buscar por RUT en el `+` |
| `servicio` | **sí** | `entrenamiento` \| `kinesiologia`. **Define el color de la ficha** |
| `profesional` | no | Se muestra en la lista del buscador |
| `plan.nombre` | no | Se muestra en la lista del buscador |
| `plan.objetivo` | no | Aparece en la ficha si la sesión no trae `titulo` |
| `sesiones[].id` | sí | Id de la sesión. Estable |
| `sesiones[].etiqueta` | **sí** | Corta: `Sesión A`. Es el botón que aprieta el coach y la etiqueta de la ficha |
| `sesiones[].titulo` | no | Descriptiva: `Tren inferior + core` |
| `sesiones[].hecha` | no | Si es `true` el botón sale atenuado con ✓. Ver §Marcador de hecho |
| `bloques[].titulo` | sí | Puede venir vacío, pero **nunca** `"(sin nombre)"` |
| `bloques[].rondas` | sí | `x2`, `x2-3`, `x1` |
| `ejercicios[].reps` | sí | Campo separado. Ver §Ejercicios |
| `ejercicios[].nombre` | sí | Solo el nombre, sin el número |
| `ejercicios[].carga` | no | `50 kg`, `40-50 lb`. Vacío si no aplica |

Sesiones sin ejercicios y clientes sin sesiones **no se envían**: la pantalla
los descartaría igual.

---

# Reglas de construcción

Confirmadas contra el código y contra la base de datos del CMS.

## 1 · `servicio`

No está en `clients`. Se deriva de `bookings.serviceType` con la constante que
ya existe en `shared/agendaConstants.ts`:

```
KINE_CLUSTER_SERVICES = ["kine_sesion", "eval_kinesica", "reset_muscular"]
```

Si el cliente no tiene reservas, usar el servicio del plan o del profesional
asignado. **Nunca dejarlo vacío** — sin él la ficha no tiene color.

## 2 · Ejercicios: hay que separar las repeticiones

**La v1 y la v2 se equivocaban en esto.** Se suponía que `mode: structured`
traía los campos limpios. La base dice otra cosa:

- 98,5 % de las líneas son `structured`, pero **`reps` está lleno en solo 10 de
  3.585**.
- Los números están dentro de `exerciseName`: 2.388 empiezan con dígito y 988
  contienen `x<número>`.

Es decir, **los dos dialectos están igual, solo que en otra columna.** El
endpoint tiene que separarlos. Estas reglas están validadas contra 435
ejercicios reales con **94,3 % de acierto**:

```
NUM = \d+\s*-\s*\d+|\d+

Sobre el texto (exerciseName, o textContent si mode = 'text'):

1. Quitar viñeta inicial:     ^\s*[•·\-–—*]\s+
2. Reps adelante:             ^\s*(NUM)\s*(seg|segs|s|min)?\s*(?:reps?\.?)?\s+(.*)$
                              → "10 extensión de rodilla"
3. Reps al final:             ^(.*?)\s*[x×]\s*(NUM)\s*(seg|segs|s|min)?\s*(\(.*\))?\s*$
                              → "mov cadera x20", "Hack squat x6-8 (15-30s desc)"
4. Duración al final:         ^(.*?)\s+(NUM)\s*(seg|segs|s|min)\s*$
                              → "plancha lat + abd 20s"
5. Si nada calza:             reps = "", nombre = el texto completo
```

El paso 5 es correcto y esperado en casos como `hollow a tolerancia`,
`trote 200 metros`, `tabata 20:10`, `squat pulse`. La pantalla los muestra sin
número y se ve bien.

Si `reps` **sí** viene lleno en la base, usarlo tal cual y no parsear.
Igual con `load` → `carga`.

**No partir las superseries.** Una línea como
`"10 remo trx / 20 seg plancha lateral iso"` se envía completa: es como la
escribió el coach y así se lee mejor proyectada.

## 3 · Bloques: el nombre trae las rondas adentro

`formatConfig.blockSeries` **se usa 0 veces** en toda la base, así que no es
fuente de `rondas`. De 1.378 bloques, ninguno tiene nombre nulo ni vacío, pero
**486 son del tipo `X3`** y 465 tienen 1 o 2 caracteres.

Conclusión: los coaches escriben las rondas en el campo nombre porque no había
otro lugar. Entonces:

1. Si `formatConfig.blockSeries` viene, usarlo como `rondas`.
2. Si no, **extraer del final de `name`** con `\s*[xX×]\s*(\d+(-\d+)?)\s*$`,
   ponerlo en `rondas` y quitarlo del título.
3. Si el título queda vacío, enviar `titulo: ""`. **Nunca `"(sin nombre)"`**,
   que es ruido en pantalla.

Cuidado con un hueco real: el fallback del exportador usa `??`, que captura
`null` y `undefined` **pero no la cadena vacía**.

## 4 · Marcador de hecho

`completedAt` está prácticamente muerto: **16 de 504 sesiones (3,2 %)**, última
marca hace 36 días, cero en los últimos 30 días. Lo que los coaches sí usan es
`manualCheck`, con 84 marcas.

Para el campo `hecha`, leer **los dos**:

```
hecha = (completedAt IS NOT NULL) OR (manualCheck = true)
```

Es solo informativo: atenúa el botón en el buscador con un ✓. **La pantalla no
decide nada con ese dato** — el coach elige la sesión. Si viene mal, no rompe
nada.

## 5 · Consultas a reutilizar

No escribir consultas nuevas en paralelo. Ya existen en `server/db.ts`:
`getPlanById`, `getClientById`, `getPlanningSessions(clientId, planId)` y sobre
todo **`getPlanningSessionWithBlocks(sessionId)`**, que devuelve los bloques con
sus líneas anidadas.

---

# FASE 2 · `GET /api/pantalla/sesiones?fecha=AAAA-MM-DD`

Solo tiene sentido **cuando el entrenamiento se esté agendando en el CMS**. Hoy
hay 390 reservas `kine_sesion` contra 1 `performance_1a4`, así que este endpoint
devolvería una o dos personas por bloque.

Mismo formato que la fase 1, pero la lista se llama `sesiones` y cada elemento
representa una reserva:

```json
{
  "fecha": "2026-08-18",
  "sesiones": [
    {
      "reserva_id": "180070",
      "hora_inicio": "07:00",
      "hora_fin": "08:00",
      "estado": "agendada",
      "cliente": { "nombre": "…", "rut": "…", "servicio": "entrenamiento" },
      "profesional": "Cristóbal Salvo",
      "plan": {
        "nombre": "Mesociclo 1",
        "objetivo": "…",
        "sesion": "Sesión A",
        "sesion_titulo": "Tren inferior + core",
        "sesion_id": "ps_8842",
        "sesiones_disponibles": [
          { "id": "ps_8842", "etiqueta": "Sesión A", "titulo": "Tren inferior + core" },
          { "id": "ps_8843", "etiqueta": "Sesión B", "titulo": "Empuje + estabilidad" }
        ]
      },
      "bloques": [ "…" ]
    }
  ]
}
```

## Estados de reserva

**Excluir únicamente `cancelada`.** Todo lo demás se proyecta.

La v1 decía "enviar solo confirmada/asistida" y eso **dejaba la pantalla en
blanco todos los días**: en la base hay 328 canceladas, 60 agendadas, 2 asistio
y 1 reagendada — **ni una sola `confirmada`**. `agendada` es el estado normal de
operación.

## Horas

De `bookings.startsAt` / `endsAt`, que ya son `datetime`. Formatear a `HH:MM` en
24 h, zona `America/Santiago`. El `"09:00 a. m."` que se ve en el Sheet lo
introduce el exportador de la Agenda, no la base.

## Qué sesión proponer

`plan.sesion_id` es una **propuesta**, no una verdad: la primera sesión del plan
con `hecha = false` por `orderIndex`. El coach la corrige en pantalla en un
toque, por eso `sesiones_disponibles` es obligatorio.

---

# Criterios de aceptación

## Fase 1

- [ ] Una sola URL devuelve todos los clientes con plan activo
- [ ] Responde con `Access-Control-Allow-Origin: *`
- [ ] `servicio` viene en el 100 % de los clientes
- [ ] `reps` viene separado del `nombre` (regla §2)
- [ ] `rondas` viene poblado y ya no aparece pegado al título del bloque
- [ ] Ningún `titulo` de bloque dice `"(sin nombre)"`
- [ ] No hay sesiones sin ejercicios ni clientes sin sesiones
- [ ] `etiqueta` viene en todas las sesiones

## Fase 2 (después)

- [ ] Excluye solo `cancelada`
- [ ] Horas en `HH:MM` de 24 h
- [ ] `sesiones_disponibles` viene completo
- [ ] Un día cualquiera devuelve una cantidad coherente con la Agenda

## Prueba final, con la pantalla

Pegar la URL en `CONFIG.endpoint` de `index.html` y abrir. Debe verse:

- Recuadro superior derecho: **"CMS · N clientes · HH:MM"** con punto verde
- Pantalla vacía con el botón grande **"Buscar la primera sesión"**
- El `+` lista los clientes con un botón por sesión, en lima los de
  kinesiología y en magenta los de entrenamiento
- Al elegir una sesión, la ficha entra y se acomoda sola
- Al hacer clic en una ficha se agranda y ofrece cambiar de sesión
- La `✕` la saca y el resto se reacomoda sin huecos
- Ninguna ficha con texto cortado, con 15 proyectadas

---

# Por qué cambió el diseño

La v1 asumía que la pantalla leería las **sesiones agendadas del día**. La
exploración de la base mostró que eso no funciona hoy:

| Hallazgo | Dato |
|---|---|
| Entrenamiento no se agenda en el CMS | 390 reservas `kine_sesion` vs **1** `performance_1a4` |
| El estado `confirmada` no existe | 328 cancelada, 60 agendada, 2 asistio, 1 reagendada |
| No hay relación reserva → sesión del plan | Sin `planningSessionId` en el esquema |
| El puntero por finalización no avanzaría | 94,4 % de los clientes quedaría atascado en la primera sesión |
| El calendario paralelo está muerto | `sessionDate`: 36 de 504, 0 programadas, 0 reagendadas |

O sea: el box entrena 12-15 personas por hora, pero eso no existe como reserva
en el CMS. Construir la pantalla sobre la agenda la dejaba esperando un dato que
nadie está generando.

**La fase 1 desacoplada resuelve eso**: el coach ya sabe quién tiene adelante
—hoy lo busca a mano en Drive— y el `+` reemplaza esa búsqueda por dos segundos
de tecleo. Funciona desde el primer día, sin cambiarle el flujo de trabajo a
nadie, y sin esperar ninguna decisión pendiente.
