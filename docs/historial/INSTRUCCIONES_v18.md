# Pantalla v18 — que la actualización llegue, y que recargar no borre el tablero

Se reemplaza **solo** `pantalla/index.html`. `config.js` no se toca. Sube el caché de
`sw.js` al siguiente libre.

Tu arqueología de `cambiarHora` cerró el caso, y de paso encontraste lo que faltaba: que
`agenda` fuera la rama `else`. Eso convierte una respuesta rara de un día en un modo
equivocado permanente. Aquí van las tres piezas que salen de ahí, más un defecto mío que
apareció al construirlas y que es peor que el original.

---

## 1 · Recargar la página borraba el tablero de ese computador

Lo encontré probando la recarga automática, y es anterior a todo esto.

En el arranque, `render()` se llama **antes** de que se hayan leído los datos. Y `render()`
guarda: escribe `fichas` en `pf_fichas`. Como en ese momento `fichas` está vacío, escribía
la lista vacía **encima de la copia buena**, y cuando `primeraCarga` iba a leerla ya no
había nada.

Medido antes del arreglo, con tres fichas proyectadas y una recarga normal:

```
antes  · fichas: 3 · pf_fichas guardadas: 3
después· fichas: 0 · pf_fichas en disco: 0
```

Después:

```
antes  · fichas: 3 · pf_fichas guardadas: 3
después· fichas: 3 · pf_fichas en disco: 3
```

Con el tablero compartido el daño quedaba tapado, porque al segundo siguiente se adopta el
del servidor. Sin tablero compartido —o con el servidor caído— cada `F5` vaciaba la
pantalla. Es candidato serio a parte de los "se borró todo" que reportaron.

## 2 · La pantalla ya sabe que hay una versión nueva, y se recarga sola

El pendiente que anotaste. No inventé archivo ni número nuevo: la pantalla lee el nombre
de caché de `sw.js` —el número que tú subes en cada publicación— y lo compara con el que
había al arrancar.

Recargar en mitad de una edición sería peor que la enfermedad, así que **espera a que sea
inofensivo**: nada abierto (buscador, editor, zoom) y nada pendiente de publicar. Si el
tablero de ese computador ya está en el servidor, recargar no pierde nada: al volver
adopta el del servidor. Y sin tablero compartido, las fichas sobreviven en `localStorage`
gracias al punto 1.

Comprobado de punta a punta, cambiando el número de caché con la página abierta:

```
1) versión que muestra la barra inferior: "pf-pantalla-v12"
2) con el buscador abierto → ¿sigue sin recargar? true   · fichas: 3
3) al cerrarlo → ¿recargó? true
4) tras recargar: fichas conservadas: 3 · versión: "pf-pantalla-v99"
5) no vuelve a recargar en bucle: sigue en pie
```

**Los televisores también se recargan** — no tienen nada que perder, solo dibujan.

## 3 · Ahora se ve qué versión está corriendo cada pantalla

Abajo a la izquierda, al final de la línea de ayuda: `pf-pantalla-v18`. Hoy, para saber
qué versión tenía la pantalla del profesional, no había forma que no pasara por la consola.
Con esto se mira y ya.

## 4 · El modo agenda se prueba, no se deduce por descarte

Tu hallazgo, y tienes toda la razón. Era:

```js
if (Array.isArray(j.clientes)) { MODO = 'catalogo'; … }
else                           { MODO = 'agenda';   … }
```

Cualquier respuesta 200 que no trajera `clientes` —un error con formato raro, media
respuesta, una página de sesión expirada— entraba por agenda, se guardaba así en `pf_cat`
y se restauraba de ahí en cada recuperación sin conexión. Ahora:

```js
const puedeAgenda = !!CONFIG.endpointAgenda;
if (Array.isArray(j.clientes))                     { MODO = 'catalogo'; … }
else if (puedeAgenda && Array.isArray(j.sesiones)) { MODO = 'agenda';   … }
else throw new Error('respuesta inesperada del CMS (sin "clientes")');
```

Una respuesta que no es ninguna de las dos cosas ahora es **un error** y se ve como error,
que es lo que siempre fue. Y agenda exige `endpointAgenda`: sin él no es un estado
legítimo, ni siquiera restaurándolo de una copia vieja.

Comprobado, con la página en marcha:

```
tras respuesta 200 con {"error":"sesión expirada"}:
  modo: catalogo · chips: 0 · contenedor oculto: true · pf_cat.m: "catalogo"
con pf_cat envenenado a mano a "agenda" y la red caída:
  modo: catalogo · chips: 0
```

## Verificado antes de mandártelo

- **Regresión `t7`**: 15 fichas reales, `0 cortadas`, `0` de scroll, ida y vuelta por el
  editor idéntica, sin errores de JavaScript, a 1366×768, 1600×900, 1920×1080 y 2560×1440.
- **Dos computadores (`t9`)**: se ven los cambios en los dos sentidos, el conflicto
  simultáneo no pierde a nadie, los dos terminan iguales, el televisor del otro computador
  ve las 7 fichas. Sin errores.
- Los cuatro puntos de arriba, cada uno con su medida antes y después.

## Al terminar, comprueba

1. Abre la pantalla y mira abajo a la izquierda: tiene que decir el número de caché que
   acabas de poner.
2. Déjala abierta, publica cualquier cambio con el caché subido y espera un minuto: se
   recarga sola. Con el buscador abierto no debe recargarse hasta que lo cierres.
3. Con fichas proyectadas, `F5`: tienen que seguir ahí.

## Lo que hay que hacer aparte de publicar

Las pantallas que están abiertas ahora mismo **siguen sin poder enterarse**: la pieza que
detecta la versión nueva es justamente la que no tienen. Hay que **cerrar y reabrir la
pantalla en todos los computadores una última vez**. A partir de ahí se actualizan solas y
esto no se repite.

Gracias por el `CLAUDE.md`: tenías razón en que estaba tres versiones atrás y era mi
responsabilidad. Cuando publiques esto, agrégale el punto 4 de aquí, porque el modo
deducido por descarte no está escrito en ninguna parte y es la clase de cosa que alguien
"simplifica" de vuelta dentro de seis meses.

---

## Añadido al publicar (21-08-2026)

Dos cosas que salieron de revisar el cambio antes de subirlo. Las dos son
consecuencia de la sonda de versión, así que van en la misma versión.

**El caché de `sw.js` se sube a `pf-pantalla-v18`.** Comprobado que el número
nunca se usó antes, en ninguna rama.

**La sonda no se guarda en el caché.** Pide `sw.js` cada minuto con un parámetro
distinto cada vez, y el service worker guardaba **toda** respuesta GET. Una
pantalla abierta todo el día dejaba ~1.400 copias del archivo, y el caché solo se
limpia cuando cambia el número, o sea cuando se publica. Ahora `sw.js` se sirve de
la red y no se guarda. Medido: tras tres sondas, `0` entradas de sonda en el caché.

**Freno anti-bucle de dos minutos.** Mientras se propaga una publicación, el
servidor puede alcanzar a entregar el `index.html` viejo junto al `sw.js` nuevo.
Sin freno, eso es un televisor recargándose cada cinco segundos delante de la
clase. Se recarga una vez y no se vuelve a intentar hasta pasados dos minutos.

### Medido antes de publicar, en Chrome, contra la v17 publicada

```
recarga con 3 fichas   v17: 3 → 0      v18: 3 → 3
```

```
tablero compartido
  A publica 3            local 3 · servidor v1, 3 fichas · estadoListo true
  recarga                local 3 · servidor v1  (la versión no se mueve sola)
  otro lo vacía + recarga  local 0 · servidor v2, 0 fichas  (no resucita a nadie)
  servidor caído + recarga local 4 · estadoListo false · versión quieta
```

```
detección de versión
  barra inferior: "pf-pantalla-v18"
  con el buscador abierto → no recarga · fichas 6
  al cerrarlo            → recarga · fichas 6 · "pf-pantalla-v99"
  otra versión al toque  → no recarga (freno)
  pasado el freno        → recarga · "pf-pantalla-v100"
  televisor con zoom abierto → recarga igual
```

```
modo
  200 con {"error":"sesión expirada"} → modo catalogo · chips 0 · en rojo
  pf_cat envenenado a "agenda" + red caída → modo catalogo · chips 0
  respuesta buena → modo catalogo · 15 clientes
```

```
empaquetado, 15 fichas (con el catálogo de demostración)
  1366x768  0 cortadas   1600x900  0 cortadas
  1920x1080 0 cortadas   2560x1440 0 cortadas
  idéntico a la v17 publicada en la misma medición: sin regresión
  service worker activo · sin errores de JavaScript
```

### Una observación, para que la decidas tú

Cuando el CMS responde 200 con algo que no es un catálogo, el aviso que se ve es
**«Sin conexión — mostrando última copia»**, en rojo. Es la rama de respaldo de
siempre y es cierto que está mostrando la última copia, pero manda a revisar el
internet cuando lo que pasó fue, por ejemplo, que caducó la sesión. Es una línea
de texto; no la toqué porque cambia lo que lee el profesional en el box.
