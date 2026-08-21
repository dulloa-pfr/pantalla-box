# Pantalla v16 — el cardio que recuperaste no llegaba a la pantalla

Se reemplaza **solo** `pantalla/index.html`. `config.js` no se toca. `sw.js` no cambia,
pero hay que **subir el número de caché al siguiente libre** (tú sabes cuál es; yo no
voy a asignarlo, ya nos pasó que elegí uno que tú ya habías publicado). Si no se sube,
el computador del box sigue mostrando la versión vieja.

---

## Lo primero: tu arreglo está bien y no cambió nada en el box

Los dos defectos que encontraste son reales y las dos correcciones son correctas.
El problema es que **el segundo arreglo es hoy invisible en la pantalla**, porque la
pantalla descarta exactamente lo que tu endpoint acaba de recuperar. El mismo supuesto
que tenías tú —"bloque sin líneas = bloque vacío"— estaba escrito tres veces en mi
código. Es mi defecto, no el tuyo, y tu arreglo es el que lo dejó al descubierto.

Medido con los tres casos que mandaste, contra el código publicado:

```
el endpoint manda            la pantalla muestra
DIA CARDIO: 3 bloques   →    1 bloque
SOLO CARDIO: 1 sesión   →    la sesión no aparece en el "+"
```

Ese segundo caso es el peor: una sesión cuyos bloques son **todos** de los recuperados
desaparece entera del buscador, cliente incluido si era su única sesión. Así que la
cuenta de sesiones que mediste en el endpoint (359) no es la que ve el box.

Los tres lugares, todos míos:

| Dónde | Qué hacía |
|---|---|
| `limpiaBloques` | `.filter(b => b.ejercicios.length)` — botaba el bloque al entrar |
| `desdeCatalogo` / `desdeAgenda` | `.filter(s => s.bloques.length)` — botaba la sesión que quedó sin bloques |
| `textoASesion` | `if (ejercicios.length)` — lo perdía al editar |

## Lo segundo, y es lo urgente: se podía perder el cardio *dentro del CMS*

El tercero de esa lista no es cosmético. `textoASesion` es lo que corre cuando un
profesional **edita** una planificación en la pantalla, y lo que se guarda cuando aprieta
guardar permanentemente. Un bloque con título y sin filas no sobrevivía esa vuelta.

O sea: hasta antes de tu arreglo esto era inofensivo, porque esos bloques nunca llegaban
a la pantalla y el editor nunca los veía. **Desde que los mandas, el camino quedó
armado**: profesional abre la sesión de cardio, cambia una carga, guarda al CMS, y el
bloque de cardio se va del CMS. 61 sesiones de 39 clientes en riesgo.

Comprobado antes del arreglo, con los tres textos reales que mandaste:

```
PERDIDO  "CARDIO TABATA 10 : 20/20"
PERDIDO  "CARDIO EMOM 9´ 10 WALL BALL / 30 S SKY PULL / 10 KTBL SWING"
PERDIDO  "3 min de bici - 3 min trote"
PERDIDO  "CARDIO 20 min bici"
bloques de cardio perdidos: 4 de 4
```

Y después:

```
perdidos: 0/4 · con nº de bloques distinto: 0
rondas conservadas: [{"titulo":"CARDIO TABATA","rondas":"x4","ejercicios":[]}]
```

## Tu pregunta: cómo se ven ahora

Preguntaste si conviene dejarlos como título sin ejercicios debajo, o bajar el nombre
completo a la línea del ejercicio. **Lo segundo**, y lo dejé así. Dos razones, ninguna
estética:

1. El estilo de encabezado es versalita apretada y con color, pensado para rótulos
   cortos tipo `BLOQUE FUERZA`. Una frase de sesenta caracteres ahí se convierte en una
   banda densa. En la línea de ejercicio se lee a la distancia, que es el único criterio
   que importa en el box.
2. Más de fondo: toda la garantía de que nada se corta es la búsqueda binaria del tamaño
   de letra. Si esas frases viven en estilo de encabezado, las mide otra regla y son
   justamente las candidatas a descuadrar la tarjeta entera.

Cuando el bloque trae rondas, van en la columna de las repeticiones:
`x3 · CARDIO EMOM 9´ 10 WALL BALL / 30 S SKY PULL / 10 KTBL SWING`.

**Algo que sí conviene que sepas si alguna vez tocas esto:** no los hice pasar por
`separaReps`. Lo probé y `3 min de bici - 3 min trote` sale partido en reps `3min` y
nombre `de bici - 3 min trote`. Ahí no hay nada que extraer —el texto ya es la
prescripción completa— así que se muestra literal.

Los que se llaman solo `X3` los sigues descartando tú en el endpoint y está bien: acá
llegan sin título y la pantalla también los descarta.

## Verificado antes de mandártelo

- **Regresión completa (`t7`)**: 15 fichas reales, `0 cortados`, `0` de scroll, ida y
  vuelta por el editor idéntica, sin errores de JavaScript. A 1366×768, 1600×900,
  1920×1080 y 2560×1440.
- **Ingesta**: las 3 sesiones del ejemplo llegan (antes 2), `DIA CARDIO` con sus 3
  bloques (antes 1).
- **En pantalla a 1920×1080**, con bloques de cardio injertados en 12 clientes reales:
  `0 cortados`, `0` de scroll, letra 16 px, sin errores.
- **Regresión de lo contrario**: un bloque de verdad vacío —sin título y sin filas—
  se sigue descartando en los tres puntos.

## Al terminar, comprueba

1. Busca a **Jorge Torrejón**: tiene que aparecer con 5 sesiones y su `DIA CARDIO` con
   los 3 bloques.
2. Proyecta esa sesión, abre el editor con el lápiz, **cambia una sola letra** y aplica.
   Los bloques de cardio tienen que seguir ahí. Ese es el caso que borraba datos.
3. Que el número de caché de `sw.js` sea uno que no hayas usado antes.

## Y lo que quedó tuyo

- **La basura de clientes borrados**: los 3 clientes que no existen en `clients`. De
  acuerdo contigo en limpiarlos.
- **Una duda sobre el orden**: dices que las huérfanas van al final porque todas tienen
  `orderIndex 0`. ¿Con qué desempatan **entre ellas**? Si el orden queda a criterio de
  la base, dos clientes con dos huérfanas pueden verlas cambiadas de posición entre una
  carga y otra, y el "Día 4" de la pantalla dejaría de ser el mismo de una hora a la
  otra. Si no hay un desempate explícito (`createdAt`, o el `id`), vale la pena ponerlo.
