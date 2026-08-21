# Pantalla del box — versión 4

Cuatro cosas nuevas, más dos errores de parseo que estaban ahí desde antes y ya están corregidos.

---

## 1. Buscar a un cliente ya no se ve en el TV

Ahora hay **dos ventanas**, no una:

| Dirección | Qué es | Dónde va |
|---|---|---|
| `index.html` | **Control** | monitor del computador |
| `index.html?tv=1` | **Proyección** | el TV del box |

En el computador aparece un botón nuevo, **▣ Abrir pantalla del box** (tecla `P`). Al apretarlo se abre una segunda ventana; esa es la que se arrastra al TV y se pone en pantalla completa con `F11`.

La ventana del TV **solo muestra fichas**. No tiene buscador, ni editor, ni botones `✕`, ni avisos. Buscar, editar, agregar y sacar gente pasa entero en el computador, y en el TV solo se ve el resultado.

Las dos ventanas se sincronizan solas (`BroadcastChannel` + `localStorage`). No hay servidor de por medio: es el mismo navegador hablando consigo mismo. Si se cierra la del TV y se vuelve a abrir, se pone al día sola.

**Requisito:** escritorio extendido, no duplicado. En macOS: Configuración → Pantallas → "Usar como pantalla extendida".

## 2. Kinesiología siempre a la derecha

Las fichas de kinesiología van en una franja propia al borde derecho, con línea y título en lima. El ancho de la franja se ajusta a cuánta gente haya:

| Kine en pantalla | Ancho de la franja |
|---|---|
| 1–2 | 17 % |
| 3–4 | 24 % |
| 5–6 | 30 % |
| 7+ | 36 %, en 2 columnas |

Mientras menos gente en kine, más ancho queda para las fichas de entrenamiento. Si no hay nadie en kine, la franja desaparece y entrenamiento ocupa todo.

## 3. Editar la planificación en la interfaz

Cada ficha tiene ahora un botón **✎** al lado de la **✕**. Abre un editor con la planificación en texto a la izquierda y **la tarjeta real a la derecha, actualizándose mientras se escribe**.

Tres botones al pie:

- **Proyectar** — el cambio va al TV al tiro y queda con una etiqueta naranja `EDITADA`. **No toca el CMS.** Al día siguiente el cliente vuelve a aparecer con su planificación original.
- **Guardar también en el CMS** — además escribe el cambio en la base de datos (ver el punto 6: falta que tu agente cree ese endpoint). Solo aparece si el endpoint está configurado.
- **Cancelar**.

Formato del texto:

```
# Calentamiento
10 sentadilla con salto
movilidad de cadera x20

# Fuerza x4
8 press banca | 40 kg
10 remo con barra | 30 kg
12 zancadas por pierna
```

- `#` al inicio de una línea = título de bloque. Si termina en `x4`, ese `x4` son las rondas.
- Una línea en blanco separa bloques.
- Las repeticiones pueden ir al principio (`10 sentadilla`) o al final (`sentadilla x10`). Se entienden las dos formas, que son las dos que usan hoy los profesionales.
- El peso va después de `|`.
- Si se pega una planificación **sin** `#` — desde WhatsApp, desde el Excel — igual se entiende: la primera línea de cada grupo se toma como título.

**Abrir el editor y cerrarlo sin escribir nada no cambia absolutamente nada en la ficha.** Está comprobado contra las 346 sesiones reales de la base de datos.

## 4. Clases de prueba

Botón **✎ Clase de prueba** en la barra (tecla `N`). Se escribe el nombre, se elige entrenamiento o kinesiología, se pega o se escribe la planificación y queda proyectada con una etiqueta naranja `CLASE DE PRUEBA`. No necesita que la persona exista en el CMS.

## 5. Dos errores de parseo corregidos

Estos dos venían de antes y afectaban también al parser del CMS (`shared/pantallaParser.ts`):

**a) Los ejercicios que empiezan con "s" perdían la primera letra.**
`10 sentadilla con salto` se mostraba como `entadilla con salto`, y `10 step up` como `tep up`. La causa: la expresión regular buscaba una unidad de tiempo opcional (`s`, `seg`, `min`) y se comía la `s` de "sentadilla". Corregido exigiendo un espacio antes del nombre del ejercicio.

> **Esto hay que arreglarlo también en el CMS.** En `shared/pantallaParser.ts`, en la regla de "repeticiones adelante", el separador entre la unidad opcional y el nombre del ejercicio tiene que ser `\s+` (uno o más espacios), **no** `\s*`. Vale la pena correr el test con `10 sentadilla`, `10 step up` y `10 subida al cajón` antes y después.

**b) Los títulos que decían "Bloque X" perdían la palabra "Bloque".**
Corregido: ahora solo se saca el prefijo cuando lleva dos puntos (`BLOQUE: Fuerza`).

## 6. Lo que falta: el endpoint para guardar

Está en `ENDPOINT_GUARDAR.md`, en esta misma carpeta. Es lo único que queda por hacer del lado del CMS, y solo hace falta para el botón "Guardar también en el CMS". Todo lo demás funciona sin tocar nada.

---

## Antes de publicar

1. **Volver a poner la URL del endpoint.** En `pantalla/index.html`, arriba del todo, `CONFIG.endpoint` viene en blanco. Hay que dejar la misma URL con token que está funcionando hoy.
2. **El número de caché del service worker ya está subido a `v4`.** Cada vez que se cambie `index.html` hay que subirlo otra vez, si no el PC del box sigue mostrando la versión vieja.

## Verificado con datos reales

127 clientes, 346 sesiones, 2.977 ejercicios de la base de datos de producción:

- 15 fichas reales en pantalla: **ninguna cortada**, ni a 1366×768, ni a 1600×900, ni a 1920×1080, ni a 2560×1440.
- Ida y vuelta texto ⇄ planificación: **0 bloques perdidos, 0 ejercicios perdidos, 0 títulos cambiados** en las 346 sesiones.
- Cero errores de JavaScript en las dos ventanas.

El tamaño de letra a 1920×1080 con 15 fichas queda entre 12 y 14,5 px. A 1366×768 baja a 8–10 px, que para un TV a distancia es chico. **Sigue pendiente saber la resolución real del PC del box** — se ve abriendo la pantalla y apretando `F12` → Consola → escribir `screen.width + "x" + screen.height`.
