# Pantalla v19 — no urgente: publícala junto con el cambio del token

Se reemplaza **solo** `pantalla/index.html`. `config.js` no se toca. `sw.js` no cambia,
pero sube el número de caché al siguiente libre.

**No hay ninguna prisa con esta.** No corrige nada roto: son las dos cosas que quedaron
de tu revisión de la v18, más el botón de volver a entrar que decidió tu medición. La segunda, en cambio, conviene que esté **antes** de que quites
el token, y por eso te la dejo lista ahora.

Antes de nada: **tus dos agregados son correctos y ya están incorporados en mi copia.**
Verifiqué que mi build reconstruye tu `index.html` publicado byte por byte
(`21a01797a36a668a8423b4c99491a716` en los dos lados) antes de tocar nada, así que esta
versión no te revierte nada.

---

## 1 · Tu pregunta: sí, cámbialo, y el motivo no es de redacción

Preguntaste por el aviso rojo que dice «Sin conexión — mostrando última copia» cuando en
realidad caducó la sesión. Tienes razón en que está mal, e hiciste bien en no cambiarlo
sin preguntar.

Lo que el profesional lee decide lo que va a hacer. «Sin conexión» lo manda a revisar el
router del box; si lo que pasó fue que caducó la sesión, eso es media hora perdida
mirando el lugar equivocado.

**Y ahí está la razón por la que no puede esperar:** hoy el token hace que la sesión casi
nunca importe. **Cuando lo quites, la sesión caducada pasa a ser el modo de fallo
principal de la pantalla.** El aviso que hoy es impreciso, ese día va a ser el que
gobierne lo que hagan tus profesionales cuando algo falle.

Ahora el fallo lleva su causa y cada caso dice lo suyo. Medido con la página en marcha:

```
sesión caducada (401)              → "Sesión caducada en el CMS — vuelve a entrar"
200 con forma que no es catálogo   → "El CMS respondió algo que no es el catálogo"
error del servidor (503)           → "El CMS respondió error 503"
sin red                            → "Sin conexión"
```

En los cuatro casos el modo sigue en `catalogo` y no aparece ningún chip. Cuando además
hay copia local que mostrar, se le añade «— mostrando última copia», que era la parte
que sí era cierta.

El botón para volver a entrar, que quedó pendiente de tu medición, está en el punto 3.

## 2 · El freno de dos minutos, llevado un paso más allá

Tu diagnóstico del CDN devolviendo v17 y v18 alternadamente es exacto, y el freno estaba
bien puesto. Pero convierte un televisor recargándose cada cinco segundos en uno
recargándose **cada dos minutos mientras dure la propagación**, que delante de una clase
sigue siendo visible.

La causa de fondo es que la sonda trataba «distinto» como «nuevo». Ahora:

- **El número solo sube.** Si el CDN entrega una versión anterior a la que tiene la
  página, se ignora en lugar de tomarse por novedad.
- **Hay que verlo dos veces seguidas.** Una lectura suelta no basta; el ir y venir del
  CDN se cancela solo.

Tu freno se queda donde está — es la última red por si algo se me escapó.

Comprobado, moviendo el número de caché con la página abierta:

```
arranca en v20
el CDN devuelve v19 (anterior)   → no recarga · aviso: false
va y viene v21 / v20 / v21 / v20 → no recarga · aviso: false
v21 estable, 1ª lectura          → no recarga todavía
v21 estable, 2ª lectura          → recarga · queda en v21
```

## 3 · El botón de volver a entrar (esto es nuevo, y salió de tu medición)

Tu respuesta sobre la sesión decidió esto. Dijiste que aunque se renueve puede morir por
rotación del secreto, cuenta desactivada o perfil de Chrome limpiado, y que ese PC está
desatendido. De acuerdo: avisar no basta, hay que dar el camino de vuelta.

El botón sale en la barra cuando —y solo cuando— el fallo es de sesión (401 o 403). Abre
el acceso del CMS en otra pestaña, y **al volver a la pantalla se reintenta solo**, para
que nadie tenga que acordarse de recargar. La URL se deduce del origen de `CONFIG.endpoint`
(`…/login`), así que no hay clave nueva que configurar; si algún día hiciera falta otra,
acepta `CONFIG.urlLogin`.

**Y aquí hay un defecto que me habría comido:** lo puse primero dentro de `#connTxt`, que
es lo segundo que la barra esconde cuando no cabe. Medido, el botón **desaparecía justo en
el computador del box**:

```
ancho   nivel de compactación   #connTxt   botón visible
1366    c1 c2 c3 c4 c5          oculto     antes NO · ahora sí
1600    c1 c2 c3                oculto     antes NO · ahora sí
1920    sin compactar           visible    sí
```

Es la clase de error que solo aparece en la pantalla real: en mi monitor grande funcionaba
perfecto. Ahora el botón es un elemento propio de la barra y está excluido de todos los
niveles de compactación — el camino de vuelta no se sacrifica nunca. En los tres anchos
sale visible, encima de todo y abriendo la URL correcta, sin que la barra desborde.

## Verificado antes de mandártelo

- **Paridad con producción**: mi build reproduce tu `index.html` publicado byte por byte
  antes de estos dos cambios. No hay nada tuyo que se pierda.
- **Regresión `t7`**: 15 fichas reales, `0 cortadas`, `0` de scroll, a 1366×768, 1600×900,
  1920×1080 y 2560×1440. Sin errores de JavaScript.
- **Dos computadores (`t9`)**: cambios en los dos sentidos, conflicto simultáneo sin
  pérdidas, los dos terminan iguales, el televisor del otro computador al día.
- **Modo**: con un `200` raro y con `pf_cat` envenenado a `agenda` y la red caída, sigue
  en catálogo y sin chips.

## Al terminar, comprueba

1. Con el CMS respondiendo `401`, el aviso dice **sesión caducada**, no «sin conexión».
2. Publica dos veces seguidas con pocos minutos de diferencia y mira un televisor: debe
   recargarse una vez por publicación, no repetidamente.
3. Con el CMS respondiendo `401`, **achica la ventana a 1366 de ancho**: el botón
   «Volver a entrar» tiene que seguir ahí.

## Y en el `CLAUDE.md`

Agrégale a *Cosas que NO hay que hacer*: **el aviso de fallo tiene que decir la causa.**
Un mensaje genérico manda al profesional a arreglar lo que no está roto, y a partir de
que no haya token, la sesión caducada es el fallo más probable de todos.
