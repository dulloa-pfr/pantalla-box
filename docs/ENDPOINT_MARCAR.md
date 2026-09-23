# Endpoint para marcar lo proyectado — hecho y desplegado

Cuando el entrenador proyecta el día de alguien, esa sesión queda marcada como
realizada en el CMS. La pantalla lo llama sola; no hay botón.

Implementado en `server/_core/pantallaRoutes.ts` del CMS
(`dulloa-pfr/cms-patagoniafitrehab`).

---

## Por qué existe

Proyectar el día de alguien **es** hacerlo: el entrenador elige la sesión con la
persona ya entrenando delante. Antes eso no dejaba rastro y había que volver a
marcarla en el CMS, un paso que se olvidaba siempre. El contador de la ficha
quedaba atrasado para todos menos para quien estaba en el box.

## Ruta

```
POST /api/pantalla/marcar
```

## Autenticación

El mismo `PANTALLA_TOKEN` por query string, o una sesión del CMS. Sin token →
`401`. Las mismas cabeceras CORS que el resto de `/api/pantalla/*`.

## Cuerpo de la petición

```json
{ "cliente_id": "cl_870001", "sesion_id": "ps_3810003" }
```

## Respuesta

```json
{ "ok": true, "marcada": true }
```

| Caso | Respuesta |
|---|---|
| Sin token | `401` |
| `Content-Type` que no es JSON | `415` |
| Ids que no calzan con `cl_`/`ps_` | `400` |
| Una ficha kinésica (`kine_<número>`) | `400` con el motivo |
| La sesión no es de ese cliente | `404` |
| Ya estaba marcada | `200` con `yaEstaba: true` |

## Qué hace

Sobre esa sesión: escribe `completedAt`, deja `sessionStatus` en `realizada` y
pone el check ✅ del entrenador (`manualCheck`). Las dos marcas, para que la
ficha diga "realizada" y no quede a medio camino. Deja una fila en `audit_log` a
nombre de "pantalla del box".

**No toca `sessionDate`**: esa es la fecha que el entrenador planificó, y
pisarla sería borrar el plan para dejar el registro.

**Solo entrenamiento.** Una sesión de kinesiología se cierra en su ficha
clínica.

## Cómo se deshace

- Sesión por sesión, en la ficha del CMS: el botón **Desmarcar** de la vista de
  ejecución borra las dos marcas y devuelve la sesión a pendiente.
- De una vez, desde la pantalla: el botón ↺ de la fila
  ([ENDPOINT_DESMARCAR.md](ENDPOINT_DESMARCAR.md)).

## Cómo probarlo

```bash
# 1. sin token -> 401
curl -i -X POST "https://patagonia-fit-cms.onrender.com/api/pantalla/marcar" \
  -H 'Content-Type: application/json' -d '{"cliente_id":"cl_1","sesion_id":"ps_1"}'

# 2. sesion_id que no es de ese cliente -> 404
# 3. proyectar un día en la pantalla -> la ficha del CMS muestra esa sesión
#    como realizada, y el anillo del resumen sube en uno
```

## En la pantalla

La URL se deduce de `endpointGuardar` cambiando `/guardar` por `/marcar`, así
que `config.js` no se toca. Si algún día hacen falta direcciones distintas,
`CONFIG.endpointMarcar` tiene prioridad.

Si el CMS no contesta, la pantalla deshace el ✓ y avisa: proyectar sigue
funcionando, solo que esa sesión hay que marcarla a mano.
