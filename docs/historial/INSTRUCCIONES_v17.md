# Pantalla v17 — se cierra el único camino que puede llenar la pantalla sola

Se reemplaza **solo** `pantalla/index.html`. `config.js` no se toca. Sube el número de
caché de `sw.js` al siguiente libre.

**Publícala apenas puedas**, pero léete primero lo que dice el final: **no tengo cerrado
el diagnóstico**, y hay un dato que necesito de la máquina donde pasó.

---

## Lo que reportó Dani

> "al realizar cambios, se borró toda la pantalla y automáticamente agregó a todos los
> clientes por orden alfabético"

## Lo que comprobé antes de tocar nada

**El endpoint está bien.** Lo consulté en producción: devuelve `{generado, clientes:[…]}`,
`clientes` es un array de 32, no hay clave `sesiones` a nivel raíz y ningún cliente trae
campo `hora`. Es exactamente la forma de catálogo. Tu cambio no tiene nada que ver con
esto.

**El `sw.js` publicado dice `pf-pantalla-v16` y las rutas `/api/` son solo-red.** También
verificado en producción. Bien.

**En el `index.html` publicado hay exactamente dos sitios que pueden poner a mucha gente
en pantalla de una vez**, y los dos leen el catálogo en el orden en que llega —
que es justamente "por orden alfabético":

| Línea | Qué hace |
|---|---|
| `primeraCarga` | `deLaHora().slice(0, cap()).forEach(…)`, dentro de `else if (MODO === 'agenda')` |
| `cambiarHora` | `quitados.clear(); fichas = []` y vuelve a llenar; con `horaSel === 'todas'` eso es **el catálogo entero** |

Los dos deberían ser inalcanzables en modo catálogo, que es el modo en que ustedes
operan. Por eso **todavía no puedo explicarte el disparador**, y prefiero decírtelo
así en vez de inventarte una causa.

## Lo que sí hace esta versión

Aunque no sepa el disparador, sí sé cuál es el **mecanismo**: esos dos sitios son el
único código de toda la aplicación capaz de hacer lo que Dani vio. Y los dos pertenecen
a la fase 2 (agenda), que hoy no está en uso: `endpointAgenda` está vacío en `config.js`.

Así que dejan de depender del modo deducido y pasan a exigir la condición explícita:

```js
else if (MODO === 'agenda' && CONFIG.endpointAgenda){   // primeraCarga
if (!(MODO === 'agenda' && CONFIG.endpointAgenda)) return;   // cambiarHora
```

La diferencia importa. `MODO` se **deduce** de la respuesta, y además se guarda en
`localStorage.pf_cat` y se restaura desde ahí cuando falla la conexión. O sea: `MODO`
puede decir `'agenda'` por un dato raro, por una respuesta a medias o por una copia vieja
en un computador, y hasta ahora eso bastaba para armar el mecanismo. `CONFIG.endpointAgenda`
no se deduce de nada: está vacío o no lo está.

Además `cambiarHora` ahora guarda el tablero anterior antes de vaciarlo, así que si
alguna vez se dispara, hay **Deshacer**.

Comprobado: regresión completa (`t7`) — 15 fichas reales, `0 cortadas`, `0` de scroll,
ida y vuelta por el editor idéntica, sin errores de JavaScript, a 1366×768, 1600×900,
1920×1080 y 2560×1440. Y las dos guardas presentes en el archivo generado.

## Lo que necesito de ti para cerrar el diagnóstico

En el computador donde pasó —el del box, o el del profesional que lo vio— abre las
herramientas de desarrollador y dame estas tres cosas, **antes de limpiar nada**:

1. `JSON.parse(localStorage.getItem('pf_cat') || 'null')?.m`
   → si dice `"agenda"`, ahí está la causa y es mía: una copia vieja del catálogo dejó
   el modo equivocado y con eso el llenado automático quedó armado.
2. `localStorage.getItem('pf_fichas')` — largo, no el contenido.
3. Si hay dos televisores abiertos, cuántos: con dos, el tope sube de 15 a 30, y 30 de
   32 clientes se ve exactamente como "agregó a todos".

Y una pregunta para Dani que vale más que las tres: **qué estaba haciendo justo antes**.
"Al realizar cambios" puede ser editar una planificación, o puede ser el momento en que
tú publicaste. No es lo mismo y decide dónde sigo mirando.

## Sobre lo otro que planteaste

**Los dos clones y iCloud: de acuerdo contigo en el fondo, pero corrige la evidencia.**
Las carpetas `_BORRAR_locks` y `_BORRAR_index.lock` **no son rastro de corrupción de
iCloud**. La primera la creé yo hoy a las 13:02, al revisar el repositorio: un `git status`
mío dejó un `index.lock` trabado que mi puente no podía borrar, y lo retiré ahí para no
bloquearte el próximo comando. La segunda es de ayer a las 20:26 y es del mismo tipo de
episodio. Son cicatrices de herramientas que no pueden borrar archivos, no de sincronía.
El riesgo de iCloud sobre un `.git` es real y tu recomendación es correcta — pero no la
apoyes en esas dos carpetas.

**Cuál conservar:** `App Pantalla`. Dani ya decidió tener todo en su carpeta `VS Code`, y
el plan acordado es sacar **esa carpeta completa** de iCloud al disco, no mover el
proyecto de vuelta. Cuando eso esté hecho, `~/Proyectos/pantalla-box` se jubila. Mientras
tanto conviene que publiques siempre desde `App Pantalla`, como hiciste.
