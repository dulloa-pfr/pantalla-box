# Endpoint de estado compartido — especificación

Para que **dos o más computadores del centro manejen la misma pantalla del box**. Hoy las ventanas se sincronizan por un canal dentro del mismo navegador, así que no cruza de un equipo a otro.

Decisión de Dani: **un solo tablero compartido** (los dos profesionales alimentan el mismo televisor), y **solo entre computadores del centro** — no hace falta teléfono ni acceso desde fuera.

La pantalla ya trae el lado del cliente implementado y **apagado**. Se enciende poniendo la URL en `config.js`:

```js
endpointEstado: "https://…/api/pantalla/estado?token=…",
```

Mientras esté vacío, todo funciona como hoy.

---

## Las dos rutas

```
GET  /api/pantalla/estado?token=…
POST /api/pantalla/estado?token=…
```

Mismo `PANTALLA_TOKEN` que ya protege `/api/pantalla/clientes`. Sin token o inválido → `401`.

### GET — devuelve el tablero actual

```json
{
  "fecha": "2026-08-19",
  "version": 47,
  "nTV": 2,
  "fichas": [ … ],
  "actualizado": "2026-08-19T14:32:11-04:00"
}
```

Si nunca se ha guardado nada, devuelve `{"fecha": null, "version": 0, "nTV": 1, "fichas": []}` con `200`. **No devuelvas `404`**: "todavía no hay tablero" es un estado normal, no un error.

`fichas` es opaco para el CMS: es el arreglo tal como lo manda la pantalla. No lo interpretes ni lo valides por dentro más allá de que sea un arreglo.

### POST — reemplaza el tablero

```json
{
  "fecha": "2026-08-19",
  "version": 47,
  "nTV": 2,
  "fichas": [ … ]
}
```

`version` es **la versión que el cliente tenía cuando hizo el cambio**.

- Si coincide con la guardada → se acepta, se incrementa la versión y responde `200` con `{"ok": true, "version": 48}`.
- Si **no** coincide (otro computador escribió primero) → responde **`409`** con el estado actual completo, en el mismo formato del GET. La pantalla sabe qué hacer con eso: toma el estado del servidor, le vuelve a aplicar lo que la profesional acababa de hacer, y reintenta. **No sobrescribas sin comparar la versión** — sin eso, dos personas trabajando a la vez se borran el trabajo entre ellas y es confusísimo de diagnosticar.

## Almacenamiento

Una fila. No necesita historial.

```
pantalla_estado
  id           fijo, siempre 1
  fecha        date
  version      int
  n_tv         int
  fichas       JSON o LONGTEXT
  actualizado  timestamp
```

**Revisa que la columna aguante el tamaño.** Quince fichas con sus bloques son del orden de 30–60 KB. Un `TEXT` normal (64 KB) queda al límite: usa `JSON` o `LONGTEXT`.

## El detalle que hay que acordarse: el día

El campo `fecha` no es decorativo. **Si el estado guardado es de ayer, la pantalla arranca vacía** en vez de mostrar la gente de ayer. Esa lógica está en el cliente, pero el servidor tiene que guardar y devolver la fecha para que funcione.

Puedes además limpiar la fila cuando llega un POST con una fecha distinta a la guardada. No es obligatorio, pero deja la tabla honesta.

## CORS — el que ya te mordió una vez

El preflight tiene que permitir **POST**, no solo `GET, OPTIONS`. Es el mismo error que apareció con el endpoint de guardado: por consola respondía `200` y desde el navegador fallaba en silencio.

Verifícalo con un POST real desde el origen de la pantalla (`https://dulloa-pfr.github.io`), no con `curl`.

## Cómo probarlo

1. Sin token → `401`.
2. GET sin nada guardado → `200` con `fichas: []` y `version: 0`.
3. POST con `version: 0` → `200`, `version: 1`. GET devuelve lo mismo que mandaste, `fichas` idéntico byte a byte.
4. **La prueba que importa:** dos POST seguidos con la misma `version` → el primero `200`, el segundo **`409`** con el estado actual en el cuerpo.
5. POST con una `fecha` distinta a la guardada → se acepta y la fecha queda actualizada.
6. Un POST real desde el navegador, desde el origen de la pantalla, no por `curl`.

## Cuando esté listo

Avísale a Dani la URL y ponla en `config.js`:

```js
endpointEstado: "https://patagonia-fit-cms.onrender.com/api/pantalla/estado?token=…",
```

Con eso, cualquier computador del centro que abra la pantalla ve y maneja el mismo tablero. Y hay un efecto secundario que vale la pena: el tablero deja de vivir dentro de un navegador, así que si el PC del box se reinicia a media mañana, al volver está todo como estaba. Hoy se pierde.
