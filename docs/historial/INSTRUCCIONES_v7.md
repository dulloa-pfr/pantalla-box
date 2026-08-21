# Pantalla v7 — instrucciones

Dos cambios pedidos por Dani, más el cableado PWA y el parser de la v6.

---

## A) La configuración ahora vive aparte — esto se hace una sola vez

Antes, cada versión nueva de `index.html` traía las URLs en blanco y había que rescatarlas a mano del archivo que se reemplazaba. Eso se acabó.

En la carpeta hay un archivo nuevo, **`config.js`**:

```js
window.PF_CONFIG = {
  endpoint:        "",   // catálogo de clientes (con token)
  endpointGuardar: "",   // el POST de guardado
  endpointAgenda:  "",   // fase 2, todavía no
  capacidad: 15,
  kineDerecha: true,
  guardarKine: false,    // ver punto B
  refrescoSegundos: 300
};
```

**Qué hacer:**

1. Copia a `config.js` las dos URLs que están hoy funcionando en producción (`endpoint` y `endpointGuardar`), sacándolas del `index.html` que vas a reemplazar.
2. Reemplaza `index.html`, `sw.js` y agrega `config.js` al repo.
3. **De aquí en adelante, cuando llegue una versión nueva se reemplaza solo `index.html`. `config.js` no se toca nunca más.**

Comportamiento si `config.js` falta o queda mal escrito: la pantalla **no se rompe**. Arranca con datos de demostración y avisa *"Datos de demostración — falta endpoint en config.js"*. Verificado con el archivo ausente y con el archivo con un error de sintaxis: en los dos casos la pantalla abre y se puede usar.

`config.js` ya está en la lista de archivos que cachea el service worker, así que el modo sin conexión lo incluye. El caché va en `pf-pantalla-v7`.

---

## B) Kinesiología sí debe poder guardar — decisión de Dani

Dani decidió que los kinesiólogos también puedan dejar un cambio guardado de forma permanente, no solo proyectarlo el día.

**Pero tu objeción sigue siendo válida y no hay que botarla.** Dijiste dos cosas distintas: que la sesión clínica cerrada es inmutable y se corrige con adenda, y que el plan de ejercicio está versionado a propósito. Sobrescribir rompe las dos.

**La forma de darle lo que pide sin romper nada: para kinesiología, guardar crea una versión nueva del plan en vez de sobrescribir la anterior.** Eso es exactamente una adenda — el registro anterior queda intacto y trazable, y la kinesióloga igual puede dejar su corrección guardada. Entrenamiento sigue sobrescribiendo como está hoy.

Concretamente:

- `POST /api/pantalla/guardar` con una ficha de entrenamiento → sobrescribe (sin cambios respecto de hoy).
- `POST /api/pantalla/guardar` con una ficha de kinesiología → **crea una versión nueva** del plan de ejercicio, marcada como originada en la pantalla, dejando la anterior como estaba. Responde `200`.
- La sesión clínica propiamente tal **no se toca en ningún caso**. Si en el esquema el plan de ejercicio no se puede versionar por separado de la sesión clínica, **dilo antes de implementar** en vez de forzarlo — ahí habría que volver a conversarlo con Dani.

**Del lado de la pantalla ya está listo y desactivado.** En `config.js` hay una llave:

```js
guardarKine: false,
```

Mientras esté en `false`, en las fichas de kinesiología el botón *"Guardar también en el CMS"* no aparece y en su lugar sale la nota naranja explicando por qué. **El mismo día en que el endpoint acepte kinesiología, se pone en `true` y el botón aparece.** Así nunca existe una ventana en que el botón esté visible y falle con 409.

Verificado en navegador: con `guardarKine: false` el botón está oculto y la nota visible; con `true`, al revés. En clases de prueba no aparece ninguno de los dos, en ningún caso.

Cuando lo tengas listo, avísale a Dani para que se cambie esa línea — o cámbiala tú en el mismo commit, si prefieres.

---

## C) Lo de la v6 que ya venía

- **Cableado PWA repuesto** (`<link rel="manifest">`, iconos, `serviceWorker.register`). Fue una regresión mía en la v4; tenías razón, y también en que el número de caché no obliga a nada si nadie registra el service worker.
- **Parser con tres guardias** en vez de una. Tu guardia de unidades está incorporada tal cual. Se le sumaron dos más, porque al comparar las dos versiones fila por fila sobre los 2.977 ejercicios reales aparecieron 16 filas donde difieren: 2 las gana la tuya (`6-8Squat barra`, `2monster walk`) y 14 las gana la mía (`20:10 lado a lado step`, `20.10 bici o remo`, `20 x10 cat dog x20`, `1: bloque 1 …`). El detalle está en `CAMBIOS_v6.md`.

  **Conviene que revises si el parser del CMS parte mal `20:10` y `20 x10`.** Las tres condiciones son:

  ```
  (?!\d)                       no partir "20:10" en "2" + "0:10"
  (UNI)(?![letra])             la "s" de "sentadilla" no es "segundos"   ← tuya
  (?!\s*[x×]\s*\d)(?![:.,])    no tomar como reps el "20" de "20 x10 cat dog"
  ```

  Y no se puede exigir espacio antes del nombre, porque existe el dialecto pegado.

---

## Al terminar, verifica

1. Service worker registrado y manifest presente **en el navegador**, no por inspección del archivo.
2. En una ficha de entrenamiento aparece el botón "Guardar también en el CMS"; en una de kinesiología, la nota naranja.
3. Borrar `config.js` a mano y comprobar que la pantalla igual abre con datos de demostración. Volver a ponerlo.
4. 15 fichas proyectadas sin ninguna cortada.
