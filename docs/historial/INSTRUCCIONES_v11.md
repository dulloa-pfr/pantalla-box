# Pantalla v11 — barra que no se corta + tablero compartido

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`, y **se agregan dos líneas nuevas a `config.js`** (es la única vez; ver abajo). Caché: `pf-pantalla-v11`.

---

## 1. La barra superior ya no se corta

Al agregar en la v8 los botones de dos televisores, la barra pasó a necesitar 1593 px. Bajo esa medida se salían de pantalla `Abrir pantalla del box`, `Vaciar` y el reloj, sin ningún aviso. A 1366×768 se salían 227 px.

Ahora la barra **se mide y se compacta hasta que entra**. El orden de lo que sacrifica está elegido a propósito, y los nombres de los botones son lo último: atajos → detalle de conexión → reloj → fecha → contadores → y solo como último recurso, íconos.

| Resolución | Qué se oculta | Botones con nombre |
|---|---|---|
| 1920×1080 | nada | 5 de 5 |
| 1600×900 | atajos | 5 de 5 |
| 1440×900 | + conexión | 5 de 5 |
| 1366×768 | + reloj | 5 de 5 |
| 1280×720 | + fecha | 5 de 5 |
| 1024×640 | + contadores | 5 de 5 |

Margen de 18 px a la derecha en todos los casos.

> Si algún día tocas ese código: el desborde **no** se puede medir con `scrollWidth`, porque nunca baja de `clientWidth` — con esa condición la barra se compactaba entera incluso a 1920. Se mide con el borde derecho real del último elemento visible.

## 2. Tablero compartido entre computadores — listo y apagado

Dani quiere que dos profesionales puedan alimentar **el mismo televisor desde computadores distintos**. El lado de la pantalla ya está hecho y **desactivado**; se enciende poniendo una URL en `config.js`.

**Lo que falta es tuyo:** el endpoint. Está especificado en `ENDPOINT_ESTADO.md`, en esta misma carpeta. Son dos rutas chicas, `GET` y `POST /api/pantalla/estado`, con control de versión.

Decisiones de Dani, para que no te lo preguntes: **un solo tablero compartido** (no uno por profesional) y **solo entre computadores del centro** — no hace falta teléfono ni acceso desde fuera.

### Dos fallos que aparecieron al implementarlo, por si el CMS toca algo parecido

**Abrir la pantalla en un segundo computador borraba el tablero de todos.** El `render()` inicial publicaba el estado vacío del equipo recién abierto antes de haber leído el compartido. Corregido: ningún equipo publica nada hasta haber leído el tablero del servidor al menos una vez.

**El número de versión subía solo, sin parar.** Cada consulta provocaba un guardado y cada guardado provocaba otra consulta: un bucle de escrituras infinito contra la base, del orden de una por segundo, para siempre. Corregido comparando una huella del tablero: solo se publica cuando cambió de verdad. Comprobado: con dos computadores abiertos y nadie tocando nada, la versión se queda quieta.

### Cambios en `config.js`

Esta vez sí hay que agregarle dos líneas al `config.js` que ya está en producción — **no lo reemplaces, edítalo**, para no perder las URLs:

```js
  endpointEstado: "",     // vacío = cada computador con su propio tablero
  segundosEstado: 4,
```

Cuando el endpoint esté listo y probado, se pone su URL ahí y con eso queda andando.

## Al terminar, verifica

1. Abre la pantalla en una ventana de 1366 px o menos: los cinco botones completos, `Vaciar` incluido, nada cortado.
2. Achica la ventana con el mouse: la barra se acomoda sola sin que nada se salga.
3. Con `endpointEstado` vacío, todo funciona igual que antes (dos ventanas en el mismo equipo se siguen sincronizando).
4. `config.js` conserva `endpoint`, `endpointGuardar` y `guardarKine: true`.

## Lo que ya está probado de mi lado

Con un servidor de prueba que implementa la especificación, y dos navegadores independientes simulando dos computadores:

- A agrega tres clientes → B los ve en menos de dos segundos. B saca uno → A lo ve. B agrega otro → A lo ve.
- **Los dos agregan a alguien exactamente al mismo tiempo:** los dos clientes terminan con la misma lista y **no se pierde ninguno de los dos**. Es el caso que el control de versión existe para resolver.
- Un televisor abierto en el segundo computador muestra el tablero compartido.
- Si el tablero guardado es de ayer, la pantalla arranca vacía en vez de mostrar la gente de ayer.
- Con dos computadores abiertos y nadie tocando nada, cero escrituras.
- Cero errores de JavaScript en todos los casos.
