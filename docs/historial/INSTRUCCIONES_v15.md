# Pantalla v15 — tres cambios pedidos por Dani

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`. **`config.js` no se toca.**

**Caché: sube al siguiente número libre** y avísame cuál usaste. Yo dejé `pf-pantalla-v15`; si ya lo ocupaste, cámbialo — reusar un número deja el caché viejo dentro, que es lo que pasó con el v12.

---

## 1. Una sola línea bajo el nombre

Antes había etiquetas sueltas que se apilaban: `ENTREN.` · `DÍA 1` · `EDITADA`… En tarjetas angostas se iban a dos y tres líneas, y ese alto salía del espacio de la planificación.

Ahora es **una línea de texto**:

```
Entrenamiento / Día 1
Kinesiología / 13-08-2026 · Sesión 2
Entrenamiento / Clase de prueba
Entrenamiento / Día 1 / editada
```

Nunca pasa de una línea: si no cabe, se recorta con puntos suspensivos. Esto solo ya subió la letra de 15 fichas a 1920×1080 de **12,5–14,5 px a 12,7–15,9 px**.

## 2. Esconder las barras

Botón nuevo **▭ Ocultar barras** y tecla **`Z`**. Esconde la barra de arriba y el texto de ayuda de abajo, y **se propaga a las ventanas de televisor del mismo computador**, que es donde importa. Queda un botoncito arriba a la derecha en el control para volver; en el televisor no aparece nada.

Se recuerda entre sesiones (`localStorage`), así que si se deja escondido, sigue así mañana.

La ganancia medida, honestamente, es modesta: la barra ocupa unos 60 px de 1080.

| | Con barras | Sin barras |
|---|---|---|
| 15 fichas · 1920×1080 | 12,7–15,9 px | **13,4–15,9 px** |
| 15 fichas · 1366×768 | 8,0–10,2 px | **8,7–10,2 px** |

Cero fichas cortadas en los cuatro casos.

## 3. El nombre se puede acortar para la proyección

El campo de nombre del editor ya no está bloqueado para las fichas del CMS. Sirve para que "Alessander Ríos", que ocupa dos líneas, quede como "Alessander" y ocupe una.

**Es solo para la pantalla.** La ficha se materializa al agregarla, así que el catálogo del CMS no se toca — comprobado: tras cambiar el nombre en la pantalla, el cliente en `CATALOGO` sigue con el suyo. Al día siguiente vuelve el nombre completo.

La ficha queda marcada como `editada` en su línea, para que se note que alguien la tocó.

## Al terminar, verifica

1. Bajo cada nombre hay **una sola línea**, del tipo `Entrenamiento / Día 1`.
2. La tecla `Z` esconde la barra, y también en la ventana del televisor. Se vuelve con el botón de arriba a la derecha o con `Z` otra vez.
3. Abrir el ✎ de una ficha del CMS: el nombre se puede escribir. Cámbialo, proyecta, y comprueba que en el buscador el cliente sigue con su nombre completo.
4. Que `config.js` siga con las tres URLs y `guardarKine: true`.

Nada de esto toca la autenticación. Si lo estás publicando junto con la migración a cookie, van sin conflicto.
