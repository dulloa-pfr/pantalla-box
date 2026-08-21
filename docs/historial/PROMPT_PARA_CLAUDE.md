# Mensaje para pegarle a Claude en VS Code (repositorio del CMS)

Abre tu proyecto del CMS en VS Code, inicia Claude ahí, y pega **todo el
bloque de abajo** tal cual. Adjunta además el archivo
`Especificacion_CMS_Pantalla.md` a esa conversación.

---

Necesito agregar una exportación nueva a este CMS. Te explico el contexto antes
de pedirte que escribas nada, y quiero que primero explores el código y me
confirmes el plan.

## Contexto

Este CMS de Patagonia Fit & Rehab ya genera dos cosas en Google Drive:

1. Una planificación por cliente, en
   `/<Entrenador>/<RUT> - <Nombre>/04_Planificaciones/Plan - <ciclo>`,
   como Google Sheet. Cada archivo lleva la advertencia
   "Este archivo se regenera desde el CMS".
2. Una planilla `Agenda — Patagonia Fit & Rehab` con el calendario semanal,
   la lista de clientes activos en kinesiología, y una tabla de reservas con
   las columnas: ID, Fecha, Hora inicio, Hora fin, Cliente, Teléfono, Email,
   RUT, Profesional, Estado, Pago, Origen, Notas, ALTA, Sobre-cupo, Creado,
   Actualizado.

Vamos a proyectar en una pantalla del box las planificaciones del día. Esa
pantalla es una página web estática que necesita **un solo endpoint** con las
sesiones agendadas de una fecha, en vez de leer los más de 100 Sheets sueltos.

## Lo que necesito

Un endpoint `GET /api/pantalla/sesiones?fecha=AAAA-MM-DD` que devuelva JSON con
el esquema exacto del archivo `Especificacion_CMS_Pantalla.md` que te adjunto.
Ese documento tiene el ejemplo completo, la tabla de campos y los criterios de
aceptación. Respétalo al pie de la letra: ya hay una pantalla escrita y probada
que consume exactamente ese formato.

## Antes de escribir código, quiero que hagas esto

1. Explora el repositorio y dime **dónde está el código que hoy genera los
   Google Sheets de planificación y el que genera la Agenda**. Quiero reutilizar
   esas mismas consultas, no escribir unas nuevas en paralelo.
2. Dime **cómo están modeladas en la base de datos** estas cosas, con los
   nombres reales de tablas y campos:
   - la reserva o cita (fecha, hora, cliente, profesional, estado)
   - el cliente y su tipo de servicio (entrenamiento vs kinesiología)
   - la planificación, sus sesiones ("Día 1", "Día 2"…), sus bloques y sus
     ejercicios
3. Confírmame **si las repeticiones están guardadas en un campo aparte** del
   nombre del ejercicio, o si en la base ya vienen mezcladas como en el Sheet
   exportado (por ejemplo "10 extensión de rodilla").
4. Confírmame **si el bloque tiene un campo de nombre**. En los Sheets
   exportados, casi la mitad de los bloques salen como "▌ BLOQUE: X3", sin
   nombre, y quiero saber si es que el dato está vacío en la base o si es el
   exportador el que no lo escribe.
5. Dime **cómo se sabe qué sesión del plan le toca a un cliente en una fecha
   dada** (que hoy le toca "Día 2" y no "Día 1"). Si esa relación no existe en
   el modelo, avísame — es el punto más importante y quizás haya que crearla.

## Requisitos técnicos que no se pueden omitir

- La respuesta debe incluir la cabecera `Access-Control-Allow-Origin: *`.
  Sin eso el navegador de la pantalla bloquea la lectura y no se ve nada,
  aunque el endpoint funcione perfecto al abrirlo a mano.
- Horas en formato 24 h `HH:MM`. La Agenda hoy las escribe como
  "09:00 a. m." y eso hay que normalizarlo.
- `cliente.servicio` debe venir siempre, con valor `entrenamiento` o
  `kinesiologia`. Define el color de la ficha en pantalla.
- `reps`, `nombre` y `carga` deben ser campos separados.
- `bloques[].titulo` no debe venir vacío.
- Excluir reservas canceladas y sesiones sin ejercicios.
- No modificar el formato de los Google Sheets que usan hoy los profesionales.
  Esto es una salida adicional, no un reemplazo.

## Sobre el despliegue

El CMS está en Render conectado a este repositorio de GitHub, así que el
endpoint quedará disponible en la URL pública del servicio. Cuando esté listo,
dime la URL final para configurarla en la pantalla.

Empieza explorando y respondiendo los 5 puntos. No escribas código todavía.
