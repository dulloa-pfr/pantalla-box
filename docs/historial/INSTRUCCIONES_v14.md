# Pantalla v14 — el tope pasa a ser por televisor

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`. **`config.js` no se toca.**

**Caché: `pf-pantalla-v14`.** Si ese número ya lo usaste para otra cosa, sube al siguiente libre y avísame — reusar un número deja el caché viejo dentro, que es justo lo que pasó la vez anterior.

---

## Qué cambia

Dani probó la pantalla en el box y se lee bien. Ahora quiere proyectar **16 personas a la vez, 8 en cada televisor**, y el tope estaba en 15 en total, así que la número 16 no entraba.

El tope deja de ser un número fijo y pasa a calcularse: **`capacidad` por cada televisor**.

| | Tope |
|---|---|
| Un televisor | 15 |
| Dos televisores | 30 |

`capacidad` sigue siendo la misma llave de `config.js` y sigue valiendo 15; lo que cambia es que con dos pantallas se multiplica. Se recalcula al vuelo, así que pasar de uno a dos televisores actualiza el tope en el momento, sin recargar.

## Medido con 16 clientes reales

El reparto automático dio **8 y 8** sin intervención — la gente nueva se va sola a la pantalla más vacía.

| Resolución | TV 1 | TV 2 |
|---|---|---|
| 1920×1080 | 8 fichas, 0 cortadas, letra 17,6–18,2 px | 8 fichas, 0 cortadas, letra 21,6–24,5 px |
| 1600×900 | 8 fichas, 0 cortadas, letra 14,2–15,7 px | 8 fichas, 0 cortadas, letra 17,2–21,3 px |
| 1366×768 | 8 fichas, 0 cortadas, letra 11,4–12,9 px | 8 fichas, 0 cortadas, letra 13,7–14,4 px |

Cero scroll en todos los casos, y cero errores de JavaScript.

## Al terminar, verifica

1. Con un televisor, el buscador dice "de 15"; al pasar a dos televisores, dice "de 30".
2. Agregar 16 personas: entran todas y quedan 8 y 8.
3. Que `config.js` siga con las tres URLs y `guardarKine: true`.

Esto no toca nada de la migración a cookie que estás haciendo. Si te pilla a medias, publícalo cuando cierres esa tanda.
