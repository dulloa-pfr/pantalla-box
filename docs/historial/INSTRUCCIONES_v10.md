# Pantalla v10 — la barra de arriba ya no se corta

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`. **`config.js` no se toca.** Caché: `pf-pantalla-v10`.

---

## El defecto

Al agregar en la v8 los botones de dos televisores, la barra superior pasó a necesitar **1593 px**. Bajo esa medida se salían de pantalla `Abrir pantalla del box`, `Vaciar` y el reloj — sin ningún aviso, simplemente cortados. Medido:

| Resolución | Ancho necesario | Se salía |
|---|---|---|
| 1920×1080 | 1593 px | — |
| 1600×900 | 1593 px | — |
| 1440×900 | 1593 px | 153 px |
| **1366×768** | 1593 px | **227 px** |
| 1280×720 | 1593 px | 313 px |

Es exactamente lo que estaba viendo Dani: la barra se veía hasta el botón "Un televisor".

## El arreglo

La barra ahora **se mide y se compacta hasta que entra**, igual que las fichas. No hay puntos de quiebre fijos: se prueba, y si no cabe se saca lo siguiente de una lista ordenada por lo poco que se pierde.

El orden importa y está elegido a propósito — **los nombres de los botones son lo último que se abrevia**, porque son lo que la profesional lee cuando anda apurada:

1. Los atajos de teclado (`A`, `N`, `P`)
2. El detalle de la conexión (queda el punto de color, que es lo informativo)
3. El reloj (el sistema ya tiene uno)
4. La fecha
5. Los contadores de entrenamiento y kinesiología
6. Solo como último recurso: los botones pasan a íconos, con el nombre completo en el globo de ayuda

Resultado medido, con margen de 18 px a la derecha en todos los casos:

| Resolución | Qué se oculta | Botones con su nombre |
|---|---|---|
| 1920×1080 | nada | 5 de 5 |
| 1600×900 | atajos | 5 de 5 |
| 1440×900 | + conexión | 5 de 5 |
| **1366×768** | + reloj | **5 de 5** |
| 1280×720 | + fecha | 5 de 5 |
| 1152×720 | + contadores | 5 de 5 |
| 1024×640 | + contadores | 5 de 5 |

Hasta 1024 px nunca hace falta llegar a los íconos. Se recalcula al abrir, al cambiar de uno a dos televisores y al redimensionar la ventana.

> Detalle por si tocas ese código: el desborde **no** se puede medir con `scrollWidth`, porque nunca baja de `clientWidth` — con esa condición la barra se compactaba entera incluso a 1920. Se mide con el borde derecho real del último elemento visible.

## Al terminar, verifica

1. Abre la pantalla en una ventana de **1366 px de ancho** o menos: tienen que verse los cinco botones completos, `Vaciar` incluido, sin nada cortado.
2. Achica la ventana con el mouse y comprueba que la barra se va acomodando sola, sin que nada se salga en ningún momento.
3. Que en la ventana del TV (`?tv=1`) la barra siga mostrando solo logo, hora y contadores.
4. Que `config.js` siga intacto.
