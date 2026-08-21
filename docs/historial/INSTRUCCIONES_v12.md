# Pantalla v12 — urgente: tres formas de perder el tablero

Se reemplaza `pantalla/index.html` y `pantalla/sw.js`. **`config.js` no se toca.** Caché: `pf-pantalla-v12`.

**Publícala apenas puedas.** Dani reportó que sus profesionales estaban probando la pantalla "y se cerró y borró todo". Al investigarlo aparecieron tres defectos míos, y el primero explica exactamente eso.

---

## 1. "Vaciar" borraba el tablero de todos, de un clic, sin poder deshacer

El botón `Vaciar` hacía `fichas = []` directo. Cuando la pantalla vivía en un solo computador, era molesto. **Desde que existe el tablero compartido, un clic borra el tablero de todos los computadores y de los dos televisores a la vez, al instante.** Sin preguntar, sin aviso y sin vuelta atrás.

Es la única acción destructiva de la pantalla y era la menos protegida. Un profesional explorando la interfaz la encuentra y la aprieta.

Ahora:

- **Pregunta antes**, diciendo a cuánta gente afecta y advirtiendo que es en todos los computadores.
- **Se puede deshacer** desde el aviso de abajo, y al deshacer se vuelve a publicar el tablero para todos.
- Si no hay nadie en pantalla, no hace nada.

## 2. Un computador que no podía leer el tablero igual lo publicaba

En el arranque, `estadoListo` se ponía en `true` en un `.finally()` — es decir, **aunque la lectura hubiera fallado**. Un computador que abría la pantalla con la sesión caída, un corte de red o un error de CORS se quedaba con el tablero vacío y a continuación lo publicaba, borrando el de todos los demás.

Ahora un computador **solo se habilita para publicar si de verdad consiguió leer**. Si no puede, se queda mirando y no escribe. Y en cuanto la conexión vuelve, se pone al día solo, sin recargar la página.

Comprobado: con el endpoint devolviendo `401`, el computador ciego queda en 0 fichas y el servidor se mantiene intacto (4 fichas, misma versión). Al restablecer la conexión, adopta las 4 sin intervención.

## 3. El service worker cacheaba las respuestas del CMS

`sw.js` guardaba en caché **toda** respuesta `GET`, incluidas `/api/pantalla/clientes` y `/api/pantalla/estado`, y las servía cuando la red fallaba.

Para el armazón de la aplicación eso es correcto y es lo que da el modo sin conexión. Para el tablero compartido es exactamente lo contrario de lo que hace falta: es el dato más cambiante del sistema, y servir una copia vieja hace que un computador crea que ese es el estado actual y, al tocar cualquier cosa, publique encima del bueno.

Ahora todo lo que va bajo `/api/` es **solo red, nunca caché**: si no hay conexión, falla — y fallar es preferible a mentir. El resto (el HTML, los iconos, `config.js`) se sigue cacheando igual, así que la instalación como aplicación y el modo sin conexión no cambian.

Comprobado tras instalar el service worker nuevo: **0 respuestas de `/api/` en caché**.

---

## Al terminar, verifica

1. Con fichas en pantalla, aprieta `Vaciar`: tiene que preguntar. Cancela → no pasa nada. Acepta → se vacía, y el botón **Deshacer** del aviso las devuelve, también en el otro computador.
2. Abre las herramientas de desarrollador → Aplicación → Caché, y comprueba que no hay ninguna respuesta de `/api/` guardada.
3. Que `config.js` siga con las tres URLs y `guardarKine: true`.

## Y sobre lo que estás implementando

Nada de esto choca con el cambio a cookie. El punto 2 lo refuerza: cuando quites el token, si algún computador queda sin sesión, ahora se queda mirando en vez de borrarle el tablero al resto.

Sigue en pie lo que ya acordamos: te detienes antes de quitar el token, y eso lo decide Dani con lo que hayas verificado sobre la estabilidad de la sesión en el PC del box.
