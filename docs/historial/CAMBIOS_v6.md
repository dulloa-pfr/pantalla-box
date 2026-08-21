# Pantalla del box — v6

Corrige las dos cosas que encontró el agente en la v4, más una tercera que salió al verificarlas.

---

## 1. Cableado PWA repuesto — era un error mío

Al reescribir el generador de la v4 boté sin querer el `<link rel="manifest">`, el `<link rel="icon">` y el `serviceWorker.register('sw.js')` que sí tenía la versión anterior. No era una decisión, era una regresión.

Y el razonamiento del agente sobre la consecuencia es correcto y más fino que el mío: **subir el número de caché no obliga a nada si nadie registra el service worker.** Yo lo presenté como la garantía de que el PC del box se actualizaría, y no lo era. Lo que sostenía la actualización era el service worker viejo, que sigue instalado y es network-first.

Repuesto: las cinco líneas están de vuelta, y con eso vuelve la instalación como aplicación de escritorio y el modo sin conexión.

## 2. El parser: el agente tenía razón, y el arreglo bueno es un tercero

Me equivoqué en dos cosas distintas:

**Afirmé que el CMS tenía el error sin haber probado el parser del CMS.** Lo deduje de mi propio puerto a JavaScript. Es el mismo error que ya cometí antes en este proyecto — afirmar cosas del CMS sin verificarlas. El agente probó los tres casos y salían bien.

**Y mi arreglo era peor que el suyo.** El `\s+` que propuse rompe el dialecto pegado. Comprobado sobre las 2.977 filas reales:

| Fila real | Mi `\s+` | Guardia del agente |
|---|---|---|
| `6-8Squat barra` | no parsea, queda entera | reps `6-8`, `Squat barra` ✓ |
| `2monster walk` | no parsea, queda entera | reps `2`, `monster walk` ✓ |

Pero al comparar las dos versiones fila por fila apareció que **ninguna de las dos gana siempre**. La del agente parte cosas que no debería:

| Fila real | Guardia del agente | Mi `\s+` |
|---|---|---|
| `20:10 lado a lado step / escaladores` | reps `20`, nombre `:10 lado a lado…` | queda entera ✓ |
| `20.10 bici o remo` | reps `20`, nombre `.10 bici o remo` | queda entera ✓ |
| `20 x10 cat dog x20 // plancha cruzada` | reps `20`, nombre `x10 cat dog…` | queda entera ✓ |
| `1: bloque 1 …` | reps `1`, nombre `: bloque 1 …` | queda entera ✓ |

Son 16 filas donde las dos versiones difieren: 2 las gana el agente, 14 las gano yo.

**La v6 lleva las dos guardias juntas, más una tercera.** Tres condiciones, cada una por un caso real:

```
(?!\d)                      no partir "20:10" en "2" + "0:10"
(UNI)(?![letra])            la "s" de "sentadilla" no es "segundos"   ← del agente
(?!\s*[x×]\s*\d)(?![:.,])   no tomar como reps el "20" de "20 x10 cat dog"
```

Y **no** exige espacio antes del nombre, para no perder el dialecto pegado.

Resultado sobre las 2.977 filas: acierta en las 17 filas conflictivas — las 14 mías, las 2 del agente y el `1 min" plancha` que ninguna de las dos resolvía. Ida y vuelta sobre las 346 sesiones: 0 bloques perdidos, 0 ejercicios perdidos, 0 títulos cambiados.

> **Para el agente:** vale la pena mirar si el parser del CMS tiene el mismo problema con `20:10` y `20 x10`. Tu guardia de unidades es correcta y está incorporada aquí; lo que falta son las otras dos condiciones. Si el CMS ya las tiene resueltas de otra forma, ignora esto — pero conviene que los casos `20:10 lado a lado step`, `20.10 bici o remo` y `20 x10 cat dog x20` estén en `pantallaParser.test.ts`, porque los tres existen en producción hoy.

## 3. El botón de guardar ya no aparece en kinesiología

El 409 está bien puesto, pero mi interfaz no lo sabía: mostraba el botón "Guardar también en el CMS" también en las fichas kinésicas, así que el profesional lo habría apretado y habría recibido `No se pudo guardar: HTTP 409` sin entender por qué.

Ahora en una ficha de kinesiología el botón no aparece, y en su lugar sale la explicación en naranja:

> *Kinesiología no se sobrescribe en el CMS: la sesión clínica es inmutable y se corrige con adenda. El cambio sí se proyecta hoy.*

El botón "Proyectar" sigue funcionando igual para kine, así que un cambio del día se puede hacer sin problema.

---

## Al publicar

**Hay que volver a traer dos líneas de configuración** del `index.html` que se reemplaza — vienen en blanco en este archivo:

```js
endpoint:        "…"   // catálogo de clientes
endpointGuardar: "…"   // el POST nuevo
```

El caché del service worker ya está en `pf-pantalla-v6`.

## Verificado

- Service worker registrado y manifest presente (comprobado en navegador, no por inspección del archivo).
- Editor en ficha kinésica: botón oculto, nota visible. En entrenamiento: botón visible, nota oculta. En clase de prueba: ninguno de los dos.
- 15 fichas reales: 0 cortadas a 1366×768, 1600×900, 1920×1080 y 2560×1440.
- Abrir el editor y cerrarlo sin escribir: la ficha queda idéntica.
- 0 errores de JavaScript en las dos ventanas.
