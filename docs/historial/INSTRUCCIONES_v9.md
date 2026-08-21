# Pantalla v9 — una sola corrección

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`. **`config.js` no se toca.** Caché: `pf-pantalla-v9`.

---

## Elian Marte: dos botones idénticos

Tu hallazgo era correcto y además seguía vivo en producción. Mi respaldo `titulo || etiqueta` no lo cubría, porque `titulo` **no está vacío** — está lleno con la misma fecha en las dos sesiones. El respaldo solo se activa cuando el campo viene en blanco, y este caso no es ese.

Medido sobre el payload real: de los 122 clientes con dos o más sesiones, **1** pinta botones repetidos. Es exactamente el que encontraste.

**El arreglo no es para ese cliente, es general.** Antes de pintar, la pantalla revisa los rótulos de cada cliente y, si alguno se repite, desempata:

1. Primero con el título (`Día 1`, `Día 2`) — el caso normal, no cambia nada.
2. Si el título se repite, agrega la etiqueta: `13-08-2026 · Sesión 1` / `13-08-2026 · Sesión 2`.
3. Si ni con eso alcanza, numera: `(2)`, `(3)`.

Comprobado sobre los 122 clientes: **0 rótulos repetidos**, y los que ya salían bien salen exactamente igual que antes.

Esto **cubre también la otra salvedad que planteaste**, la de que `titulo` no está garantizado por construcción y `limpiarTituloSesion` puede devolver vacío. Si algún día pasa, el rótulo cae a la etiqueta y, si dos quedaran iguales, se numeran. Ya no depende de que el CMS se porte bien.

**Del lado del CMS no hace falta nada.** Ofreciste una línea en el endpoint para que la fecha diga algo distinto; no la escribas por esto. Si igual quieres mejorar el título de las sesiones clínicas sin objetivo escrito, hazlo porque mejora el CMS, no porque la pantalla lo necesite — la pantalla ya no se rompe con nada de lo que le mandes.

## Al terminar, verifica

1. Buscar **Elian Marte**: los dos botones deben decir `13-08-2026 · Sesión 2` y `13-08-2026 · Sesión 1`.
2. Buscar **Jimmy Vidal**: sigue diciendo `Día 1` / `Día 2` / `Día 3`, sin sufijos.
3. Que `config.js` siga intacto, con `guardarKine: true`.
