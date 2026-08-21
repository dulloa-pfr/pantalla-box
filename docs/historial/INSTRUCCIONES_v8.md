# Pantalla v8 — instrucciones para el agente

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`. **`config.js` no se toca** — esa era justamente la gracia de haberlo separado en la v7.

Caché del service worker: `pf-pantalla-v8`.

---

## 1. Las sesiones ahora se distinguen — era un error de bulto

En el buscador, los botones de sesión de cada cliente decían todos **"Sesión A"**. Los tres. El profesional no tenía forma de saber cuál era el día 1, el 2 o el 3.

La causa: yo estaba mostrando el campo `etiqueta` en vez de `titulo`. Medido sobre el payload real:

- 122 clientes tienen dos o más sesiones.
- En **121 de esos 122**, `etiqueta` es idéntica en todas las sesiones (`"Sesión A"`, `"Plan"`).
- En **121 de 122**, `titulo` es distinto en cada una (`"Día 1"`, `"Día 2"`, `"Día 3"`, `"Día 2.1"`, `"Día opcional"`…).
- Las 341 sesiones tienen `titulo`. Ninguna lo tiene vacío.

O sea el dato bueno siempre estuvo en el payload y yo estaba pintando el inútil. Corregido en tres lugares: los botones del buscador, la etiqueta de la tarjeta y el selector de "cambiar sesión" del zoom. Ahora todos usan `titulo`, con `etiqueta` de respaldo si algún día viniera vacío.

En la tarjeta se sacó además el chip de `etiqueta`, porque decir "SESIÓN A" en las 15 fichas ocupaba espacio sin aportar nada — y el espacio en la tarjeta es exactamente lo que determina el tamaño de letra.

> **Del lado del CMS no hay nada que hacer.** El payload ya venía bien; el error era mío. Solo confirma que `titulo` va a seguir viniendo siempre, porque ahora la pantalla depende de él.

## 2. Dos televisores

La pantalla ahora puede repartirse en dos TV. Es la respuesta al problema de que con 12–15 fichas la letra queda chica.

- La ventana de proyección acepta `?tv=1` y `?tv=2`. Cada una muestra **solo** las fichas asignadas a ese televisor.
- `?tv=1` sigue significando lo mismo que antes, así que nada de lo que ya está publicado se rompe.
- El reparto vive en el computador de control: cada ficha tiene un campo `tv` (1 o 2) que viaja en el mismo `localStorage` y el mismo `BroadcastChannel` que ya existían. **No hay nada nuevo que pedirle al CMS.**
- El número de televisores se guarda en `localStorage` (`pf_ntv`), no en `config.js`, porque es una propiedad de ese computador y no del despliegue.

Medido con 15 fichas reales:

| | 1920×1080 | 1366×768 |
|---|---|---|
| Un televisor | 12,4 – 14,5 px | 7,9 – 10,6 px |
| Dos televisores | **17,6 – 24,5 px** | **11,4 – 17,7 px** |

Cero fichas cortadas y cero scroll en las dos configuraciones, a 1366×768, 1600×900, 1920×1080 y 2560×1440.

## 3. Aviso cuando algo no cabe

Antes, si las fichas no entraban ni al tamaño mínimo, el tablero activaba scroll en silencio. Dani fue explícita en que bajar la pantalla no es aceptable.

Sigue habiendo scroll como último recurso — es preferible a cortar una planificación — pero ahora **avisa**: *"No caben N fichas — activa Dos televisores y repártelas"*. El aviso sale solo en el computador, nunca en el TV.

## 4. Tamaño máximo de letra subido de 19 a 26 px

Con dos televisores las fichas topaban en el máximo anterior y quedaba pantalla sin usar. Con 26 px el caso de 15 fichas en un televisor no cambia en nada (12,4–14,5 px, idéntico), y el de dos televisores pasa de 19 px a 21–24 px. Probé también con 34 px: no cambia nada respecto de 26, porque el límite real ya no es el tope sino el espacio.

---

## Al terminar, verifica

1. Buscar a **Jimmy Vidal** en el buscador: los tres botones deben decir **Día 1 / Día 2 / Día 3**, con el ✓ en el Día 1. Si dicen "Sesión A", no se publicó.
2. Apretar **▣ Un televisor** → cambia a **▣▣ Dos televisores**, aparece el botón *Abrir TV 2* y cada ficha muestra un chip TV 1 / TV 2.
3. Abrir `?tv=1` y `?tv=2` y comprobar que cada una muestra solo su mitad, y que apretando el chip en el control la persona se cambia de pantalla en vivo.
4. Que en la ventana del TV el chip TV **no** se vea (es un control, no información de proyección).
5. Que `config.js` siga con las URLs de producción y **no** lo hayas reemplazado.
