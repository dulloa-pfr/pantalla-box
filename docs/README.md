# Documentación — Pantalla del box

Todo lo que se ha escrito sobre la pantalla, en un solo lugar.
El código vive en la raíz del repositorio; aquí está el porqué.

## Para usar la pantalla

| Archivo | Para qué sirve |
|---|---|
| [`COMO_SE_USA.md`](COMO_SE_USA.md) | **Empieza por aquí.** Cómo se opera la pantalla en el día a día |
| [`GUIA_GITHUB.md`](GUIA_GITHUB.md) | Cómo se publica una versión nueva, paso a paso, sin ser técnica |

## Para el agente que trabaja en el CMS

| Archivo | Para qué sirve |
|---|---|
| [`Especificacion_CMS_Pantalla.md`](Especificacion_CMS_Pantalla.md) | Contrato del endpoint de catálogo. **Fuente de verdad** |
| [`ENDPOINT_GUARDAR.md`](ENDPOINT_GUARDAR.md) | Endpoint de guardado de una planificación editada |
| [`ENDPOINT_ESTADO.md`](ENDPOINT_ESTADO.md) | Tablero compartido entre computadores (versión + 409) |
| [`DECISION_sesion_del_dia.md`](DECISION_sesion_del_dia.md) | Por qué el coach elige la sesión y no la elige el sistema |

## Historial

[`historial/`](historial/) guarda las instrucciones de cada versión publicada,
de la v4 a la v15. No hace falta leerlas para usar la pantalla. Sirven para una
sola cosa, pero importante: **si algo se rompe, ahí está escrito qué cambió en
cada versión y por qué**, incluidos los defectos que se corrigieron.

Los tres que conviene conocer:

- `INSTRUCCIONES_v12.md` — las tres formas en que se perdía el tablero de todos
  (el "se cerró y borró todo" que reportaron los profesionales).
- `INSTRUCCIONES_v14.md` y `_v15.md` — lo último publicado.
- `CAMBIOS_v4.md` — los cuatro cambios pedidos por Daniela: búsqueda invisible
  en la proyección, kinesiología a la derecha, edición de planificación y clases
  de prueba.

## Pendientes al 20-08-2026

1. **Quitar el token de `config.js`.** Hoy el archivo es públicamente legible en
   `dulloa-pfr.github.io/pantalla-box/config.js` y lleva URLs con token, dos de
   ellas de escritura. El reemplazo es la sesión con cookie, que ya está
   implementada. Falta que el computador del box quede con la sesión de
   `pantalla@patagoniafitrehab.cl` iniciada y que cada profesional entre con su
   propia cuenta del CMS — nunca compartiendo la contraseña del box.
2. **Feedback de los profesionales** sobre la v15.
3. **Comprobar si el computador del box admite dos televisores.** Los MacBook
   Air M1 y M2 solo admiten una pantalla externa; el M3 admite dos, pero solo
   con la tapa cerrada.

## Qué NO está aquí

- **El registro del incidente de la credencial** pertenece al repositorio del
  CMS (`cms-patagoniafitrehab`), no a este. Es de la base de datos, no de la
  pantalla.
- **`config.js`** no se documenta aquí a propósito: se edita, nunca se
  reemplaza, y una copia en la documentación invita a pegarla encima.
