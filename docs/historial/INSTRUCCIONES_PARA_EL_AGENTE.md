# Instrucciones para el agente — Pantalla de sesión Patagonia Fit & Rehab

Pegar este documento completo al agente. Tiene dos tareas independientes:
**A** publica la pantalla, **B** construye el endpoint en el CMS.
La A se puede completar hoy; la B depende de explorar el código del CMS.

Antes de empezar, indicarle al agente la ruta local de la carpeta
`PatagoniaFit-Pantalla` ya descomprimida.

---

## Reglas que aplican a todo el trabajo

1. **No modificar nada en Google Drive.** Ni los Sheets de planificación de los
   clientes, ni la planilla Agenda. El formato actual lo usan los profesionales
   a diario y no se toca. Todo lo que se construya es una salida adicional.
2. **No renombrar ni mover** los archivos dentro de `pantalla/`. Las rutas de
   `sw.js`, `manifest.webmanifest` y los íconos son relativas y se rompen.
3. **No reformatear ni "mejorar"** `index.html`. Está probado end-to-end. El
   único cambio permitido es el valor de `CONFIG.endpoint`.
4. Reportar la URL pública resultante en cada tarea.

---

# TAREA A — Publicar la pantalla en GitHub Pages

## A.1 Crear el repositorio

- Nombre: `pantalla-box`
- Visibilidad: **público** (requisito de GitHub Pages en cuentas gratuitas)
- Sin README inicial, sin .gitignore, sin licencia

## A.2 Subir los archivos

Copiar al **directorio raíz del repositorio** los 6 archivos que están dentro de
`PatagoniaFit-Pantalla/pantalla/`:

```
index.html
sw.js
manifest.webmanifest
icon-192.png
icon-512.png
icon-maskable-512.png
```

**Deben quedar en la raíz, no dentro de una subcarpeta `pantalla/`.**
La app funciona igual anidada, pero la URL queda innecesariamente larga para
escribirla en el PC del box.

Los otros archivos de la carpeta (`README.md`, `GUIA_GITHUB.md`,
`PROMPT_PARA_CLAUDE.md`, `Especificacion_CMS_Pantalla.md`) son documentación
interna: se pueden subir al repositorio o no, es indiferente para el
funcionamiento.

Commit y push a la rama `main`.

## A.3 Activar GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → Branch: `main`,
carpeta `/ (root)` → Save.

## A.4 Verificar (obligatorio antes de dar por cerrada la tarea)

Esperar 1-3 minutos y comprobar contra la URL publicada:

- [ ] `GET /` responde 200 y devuelve el HTML
- [ ] `GET /manifest.webmanifest` responde 200 y es JSON válido
- [ ] `GET /sw.js` responde 200 con `Content-Type` de JavaScript
- [ ] `GET /icon-192.png` y `/icon-512.png` responden 200
- [ ] La página se sirve por **https** (necesario para que Chrome ofrezca
      instalarla como app y para que el service worker se registre)
- [ ] Abierta en un navegador, se ven 15 fichas y el recuadro superior derecho
      dice "Datos de demostración" (correcto: el endpoint aún no existe)
- [ ] No hay errores en la consola del navegador

Reportar la URL final, con este formato:
`https://<usuario>.github.io/pantalla-box/`

---

# TAREA B — Endpoint de sesiones en el CMS

Repositorio del CMS, desplegado en Render.

## B.1 Explorar antes de escribir código

Este CMS ya genera en Drive:

- una planificación por cliente, como Google Sheet, en
  `/<Entrenador>/<RUT> - <Nombre>/04_Planificaciones/Plan - <ciclo>`
- una planilla `Agenda — Patagonia Fit & Rehab` con el calendario semanal, la
  hoja de clientes activos en kinesiología, y una tabla de reservas con las
  columnas: ID, Fecha, Hora inicio, Hora fin, Cliente, Teléfono, Email, RUT,
  Profesional, Estado, Pago, Origen, Notas, ALTA, Sobre-cupo, Creado, Actualizado

**Reportar, antes de programar:**

1. Dónde está el código que genera esos dos exports. Se deben reutilizar sus
   consultas, no escribir unas nuevas en paralelo.
2. Nombres reales de tablas y campos para: reserva/cita, cliente, tipo de
   servicio, planificación, sesión, bloque, ejercicio.
3. **¿Las repeticiones están en un campo aparte del nombre del ejercicio?**
   En los Sheets exportados vienen mezcladas (`10 extensión de rodilla`) y con
   dos convenciones distintas conviviendo (también `mov cadera x20`).
4. **¿El bloque tiene campo de nombre?** En los Sheets exportados, 82 de 165
   bloques salen como `▌ BLOQUE: X3`, sin nombre. Determinar si el dato está
   vacío en la base o si el exportador no lo escribe.
5. **¿Cómo se determina qué sesión del plan corresponde a una fecha dada?**
   Es decir, cómo se sabe que hoy a un cliente le toca "Día 2" y no "Día 1".
   **Si esa relación no existe en el modelo de datos, detenerse y avisar** —
   es la pieza crítica y probablemente haya que diseñarla antes de continuar.

## B.2 Implementar

```
GET /api/pantalla/sesiones?fecha=AAAA-MM-DD
```

Esquema de respuesta: el del archivo `Especificacion_CMS_Pantalla.md`, que
incluye ejemplo completo, tabla de campos y criterios de aceptación.
**Respetarlo literalmente**: ya existe una pantalla escrita y probada que
consume exactamente ese formato. Cualquier desviación la rompe.

Requisitos que no se pueden omitir:

- Cabecera `Access-Control-Allow-Origin: *` en la respuesta.
  Sin ella el navegador bloquea la lectura aunque el endpoint funcione al
  abrirlo a mano. Es la causa más común de que "el endpoint anda pero la
  pantalla no muestra nada".
- Horas en 24 h `HH:MM`. La Agenda hoy escribe `09:00 a. m.`
- `cliente.servicio` presente siempre, con valor `entrenamiento` o
  `kinesiologia` (define el color de la ficha).
- `reps`, `nombre` y `carga` como campos separados.
- `bloques[].titulo` nunca vacío.
- Excluir reservas canceladas y sesiones sin ejercicios.
- Si `fecha` no viene, usar el día actual en zona horaria de Chile.

## B.3 Desplegar y verificar

Desplegar en Render y comprobar:

- [ ] `curl -i "https://<servicio>.onrender.com/api/pantalla/sesiones?fecha=<hoy>"`
      devuelve 200 y `Content-Type: application/json`
- [ ] En esos headers aparece `Access-Control-Allow-Origin: *`
- [ ] El JSON valida contra el esquema de la especificación
- [ ] Todas las sesiones traen `cliente.servicio`
- [ ] Ningún `bloques[].titulo` viene vacío
- [ ] Todas las horas cumplen `^\d{2}:\d{2}$`
- [ ] No aparecen reservas canceladas
- [ ] Contrastar contra la Agenda de ese día: la cantidad de sesiones
      devueltas debe coincidir con las reservas confirmadas

Reportar la URL final del endpoint.

---

# TAREA C — Conectar las dos

Solo cuando A y B estén verificadas.

En el repositorio `pantalla-box`, editar `index.html`. Buscar el bloque
`const CONFIG` cerca del inicio del `<script>` y poner la URL:

```js
const CONFIG = {
  endpoint: "https://<servicio>.onrender.com/api/pantalla/sesiones",
  ...
};
```

Commit y push. Esperar 1-2 minutos.

## Verificación final

Abrir la URL de GitHub Pages en un navegador y comprobar:

- [ ] El recuadro superior derecho dice **"CMS · N sesiones · HH:MM"** con
      punto verde (si dice "Datos de demostración", la URL no quedó guardada;
      si dice "Error al leer", revisar CORS)
- [ ] Aparecen los botones de bloque horario con la cantidad de gente en cada uno
- [ ] Las fichas de kinesiología salen en lima y las de entrenamiento en magenta
- [ ] Ninguna ficha queda con texto cortado
- [ ] El botón `+` lista las sesiones del día que no están proyectadas
- [ ] Al presionar `✕` en una ficha, el resto se reacomoda sin dejar huecos
- [ ] Tras un `⟳ Drive`, el cliente que se sacó con `✕` **no reaparece**

---

## Nota sobre el orden

La Tarea A no depende de la B. Conviene completarla y dejar la pantalla
instalada y operando en el box con los datos de ejemplo, para que el equipo la
vea proyectada y opine antes de invertir el tiempo del CMS. Los ajustes de
tamaño o de qué información mostrar salen mucho más baratos en esa etapa.
