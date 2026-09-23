# Endpoint para desmarcar sesiones — hecho y desplegado

Sirve para el botón **↺** que aparece en el buscador, a la derecha de quien
tiene sesiones con ✓. Desmarca de una vez todas las sesiones realizadas de esa
persona.

Implementado en `server/_core/pantallaRoutes.ts` del CMS
(`dulloa-pfr/cms-patagoniafitrehab`), junto a las rutas que ya existían.

---

## Por qué existe

En el box la sesión del día se marca desde la pantalla. Cuando empieza una
vuelta nueva hay que volver a cero, y hacerlo ficha por ficha en el CMS es un
trabajo que nadie hace: las marcas viejas se quedan y el ✓ deja de significar
algo.

## Ruta

```
POST /api/pantalla/desmarcar
```

## Autenticación

El mismo `PANTALLA_TOKEN` por query string, o una sesión del CMS. Sin token →
`401`. Las mismas cabeceras CORS que el resto de `/api/pantalla/*`.

## Cuerpo de la petición

```json
{ "cliente_id": "cl_870001" }
```

## Respuesta

```json
{ "ok": true, "desmarcadas": 3 }
```

| Caso | Respuesta |
|---|---|
| Sin token | `401` |
| `Content-Type` que no es JSON | `415` |
| `cliente_id` que no es `cl_<número>` | `400` |
| Una ficha kinésica (`kine_<número>`) | `400` con el motivo |
| Nadie que desmarcar | `200` con `desmarcadas: 0` |

## Qué hace

Sobre las sesiones que la pantalla muestra de esa persona —las del plan activo
más nuevo, más las huérfanas: el mismo recorte que usa el catálogo—:

1. borra el check visual del entrenador (`planning_sessions.manualCheck`);
2. en las que estaban realizadas, borra `completedAt` y devuelve
   `sessionStatus` a `pendiente`. Una sesión cancelada o no utilizada no se
   toca: sigue como está;
3. deja una fila en `audit_log` con las sesiones tocadas, a nombre de
   "pantalla del box".

Son las **mismas filas** que muestra la ficha del cliente, así que la vista de
ejecución y el anillo de sesiones del resumen quedan iguales. Qué cuenta como
"realizada" está en un solo lugar del CMS: `shared/sesionRealizada.ts`.

**Solo entrenamiento.** Una sesión de kinesiología se cierra en su ficha
clínica; reabrirla desde una pantalla que está a la vista de todos sería otra
cosa, y para eso está el 400.

## Cómo probarlo

```bash
# 1. sin token -> 401
curl -i -X POST "https://patagonia-fit-cms.onrender.com/api/pantalla/desmarcar" \
  -H 'Content-Type: application/json' -d '{"cliente_id":"cl_1"}'

# 2. ficha kinésica -> 400
# 3. cliente de entrenamiento con sesiones marcadas -> 200 con el número,
#    y GET /api/pantalla/clientes ya no trae esas sesiones con "hecha": true
```

La prueba que cierra el círculo es la 3, mirando además la ficha del cliente en
el CMS: el check ✅ de la vista de ejecución tiene que haber desaparecido.

## En la pantalla

La URL se deduce de `endpointGuardar` cambiando `/guardar` por `/desmarcar`, así
que `config.js` no se toca y el token no queda repetido. Si algún día hacen
falta direcciones distintas, `CONFIG.endpointDesmarcar` tiene prioridad.
