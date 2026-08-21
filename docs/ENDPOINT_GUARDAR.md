# Endpoint para guardar ediciones — especificación para el agente

Este es el único trabajo pendiente en el CMS (`dulloa-pfr/cms-patagoniafitrehab`). Sirve para el botón **"Guardar también en el CMS"** del editor de la pantalla. Sin él la pantalla funciona igual; lo único que no se puede hacer es dejar una edición grabada de forma permanente.

---

## Decisión de la dueña

**Guardar sobrescribe esa sesión del plan.** No se crea una versión nueva ni se duplica la sesión: la sesión que se editó queda con el contenido nuevo, y la próxima vez que se abra ese plan aparece ya editada.

## Ruta

```
POST /api/pantalla/guardar
```

Va en `server/_core/pantallaRoutes.ts`, junto a la ruta de clientes que ya existe.

## Autenticación

El mismo `PANTALLA_TOKEN` que ya protege `GET /api/pantalla/clientes`, por query string:

```
POST /api/pantalla/guardar?token=...
```

Sin token o con token equivocado → `401`. La misma cabecera CORS que ya se devuelve en `/api/pantalla/*`.

> Recordatorio de lo que ya conversamos: el token es una barrera contra rastreadores, no seguridad real, porque va en el código de una página pública. La protección de verdad es que en el payload no hay RUT ni datos de contacto.

## Cuerpo de la petición

```json
{
  "cliente_id": "cl_870001",
  "sesion_id":  "ps_3810003",
  "bloques": [
    {
      "titulo": "Calentamiento",
      "rondas": "",
      "ejercicios": [
        {"reps": "10", "nombre": "sentadilla con salto", "carga": ""},
        {"reps": "20", "nombre": "movilidad de cadera",  "carga": ""}
      ]
    },
    {
      "titulo": "Fuerza",
      "rondas": "x4",
      "ejercicios": [
        {"reps": "8",  "nombre": "press banca",     "carga": "40 kg"},
        {"reps": "10", "nombre": "remo con barra",  "carga": "30 kg"},
        {"reps": "12", "nombre": "zancadas por pierna", "carga": ""}
      ]
    }
  ]
}
```

Los tres campos son obligatorios. `bloques` tiene exactamente la misma forma que la que devuelve `GET /api/pantalla/clientes`, así que el ida y vuelta es simétrico: lo que se lee se puede volver a escribir sin transformar nada.

## Qué tiene que hacer

1. Validar el token → si no, `401`.
2. Validar que `bloques` sea un arreglo no vacío y que cada ejercicio traiga `nombre` → si no, `400` con un mensaje claro.
3. Verificar que `sesion_id` pertenece efectivamente a un plan de `cliente_id` → si no, `404`. **Esto importa:** sin esta comprobación, quien tenga el token puede sobrescribir la sesión de cualquier persona.
4. Reemplazar el contenido de esa sesión del plan con los bloques recibidos.
5. Responder `200` con `{"ok": true}`.

## Sobre cómo guardar los bloques

Depende de cómo estén hoy en el esquema, y eso lo sabes tú mejor que yo — en la exploración anterior quedó claro que las sesiones y sus bloques están en tablas separadas y que la relación del punto 5 de mi especificación original no existía.

Dos caminos razonables:

- **Si los bloques y ejercicios están en tablas propias:** borrar los de esa sesión e insertar los nuevos, todo dentro de **una transacción**. Si algo falla a la mitad, la sesión no puede quedar sin bloques.
- **Si el contenido de la sesión está en una columna de texto o JSON:** escribir el arreglo serializado en esa columna.

Elige el que corresponda al esquema real. Si ninguno calza, dilo antes de implementar en vez de forzar el que parezca más cercano.

## Sugerencia: no perder lo que había

Antes de sobrescribir, vale la pena guardar el contenido anterior — una columna `bloques_previos`, o una tabla de historial con `sesion_id`, `fecha`, `bloques`, `origen: 'pantalla'`. Un profesional puede editar apurado en medio de una clase y querer volver atrás. No es obligatorio para que funcione, pero es barato ahora y caro después.

## Cómo probarlo

```bash
# 1. sin token -> 401
curl -i -X POST "https://patagonia-fit-cms.onrender.com/api/pantalla/guardar" \
  -H 'Content-Type: application/json' -d '{"cliente_id":"x","sesion_id":"y","bloques":[]}'

# 2. sesion_id que no es de ese cliente -> 404
# 3. guardado bueno -> 200, y despues GET /api/pantalla/clientes devuelve el texto nuevo
```

La prueba que de verdad cierra el círculo es la 3: guardar, volver a pedir el catálogo y comprobar que la sesión editada viene con el contenido nuevo.

## Al terminar

Avísale a Dani la URL exacta, y en `pantalla/index.html` hay que dejar:

```js
endpointGuardar: "https://patagonia-fit-cms.onrender.com/api/pantalla/guardar?token=...",
```

Mientras esté en blanco, el botón "Guardar también en el CMS" simplemente no aparece y el editor funciona igual para cambios del día.

---

## Y de paso: un error del parser que hay que corregir

En `shared/pantallaParser.ts`, en la regla de "repeticiones adelante", el separador entre la unidad opcional (`s`, `seg`, `min`) y el nombre del ejercicio tiene que ser `\s+`, no `\s*`.

Con `\s*` el motor toma la `s` de "sentadilla" como si fuera la unidad "segundos" y el ejercicio queda como "entadilla". Casos de prueba que lo dejan en evidencia:

| Entrada | Mal (`\s*`) | Bien (`\s+`) |
|---|---|---|
| `10 sentadilla con salto` | reps `10s`, nombre `entadilla con salto` | reps `10`, nombre `sentadilla con salto` |
| `10 step up` | reps `10s`, nombre `tep up` | reps `10`, nombre `step up` |
| `10 subida al cajón` | reps `10s`, nombre `ubida al cajón` | reps `10`, nombre `subida al cajón` |
| `30seg plancha frontal` | reps `30seg` ✓ | reps `30seg` ✓ (no se rompe) |
| `45 s plancha` | reps `45s` ✓ | reps `45s` ✓ (no se rompe) |

Agrega las tres primeras filas a `shared/pantallaParser.test.ts`. "sentadilla" es probablemente el ejercicio más escrito de toda la base de datos, así que esto se estaba viendo mal en pantalla todos los días.
