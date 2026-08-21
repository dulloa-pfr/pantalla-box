# Publicar la pantalla en GitHub Pages

Guía paso a paso. No necesitas saber programar ni usar la consola.
Al final vas a tener una dirección web fija y la app instalada en el PC del box.

---

## Paso 1 · Crear el repositorio

1. Entra a **github.com** con tu cuenta (la misma del CMS).
2. Arriba a la derecha, botón **+** → **New repository**.
3. Llénalo así:
   - **Repository name:** `pantalla-box`
   - **Public** (tiene que ser público para que Pages funcione gratis)
   - **NO** marques "Add a README file"
4. **Create repository**.

Te va a quedar una pantalla con instrucciones de consola. Ignórala.

---

## Paso 2 · Subir los archivos

1. En esa misma página, busca el enlace **"uploading an existing file"**
   (está en el texto gris del medio). Si no lo ves, entra a la pestaña
   **Add file** → **Upload files**.
2. Abre en tu computador la carpeta `pantalla` que viene en el zip.
3. **Selecciona los 6 archivos de adentro** (no la carpeta, los archivos):
   `index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`,
   `icon-512.png`, `icon-maskable-512.png`
4. Arrástralos a la zona de GitHub que dice "Drag files here".
5. Espera a que suban y presiona **Commit changes**.

---

## Paso 3 · Activar Pages

1. En el repositorio, pestaña **Settings** (arriba a la derecha).
2. Menú de la izquierda: **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. En **Branch** elige **main** y carpeta **/ (root)**. **Save**.
5. Espera entre 1 y 3 minutos. Recarga la página.

Arriba te va a aparecer un recuadro verde con tu dirección:

```
https://TU-USUARIO.github.io/pantalla-box/
```

Esa es la dirección definitiva. Anótala.

---

## Paso 4 · Instalar la app en el PC del box

1. Abre esa dirección en **Chrome**, en el computador que maneja la pantalla.
2. En la barra superior de la app aparece el botón **⬇ Instalar app**.
   (También sirve el ícono de instalar que Chrome muestra en la barra de
   direcciones, a la derecha.)
3. Presiónalo y confirma.

Queda con el ícono de Patagonia en el escritorio y se abre en ventana propia,
sin barra de navegador. Con la tecla **Z** escondes la barra superior para
proyectar limpio.

Gracias a la copia local, **si se cae internet la pantalla igual abre** con las
últimas sesiones que alcanzó a leer.

---

## Paso 5 · Conectar el CMS (cuando el endpoint esté listo)

1. En el repositorio, entra al archivo **index.html**.
2. Presiona el **lápiz** (Edit this file) arriba a la derecha.
3. Presiona `Ctrl+F` y busca `endpoint:`. Está cerca de la línea 800,
   dentro de un bloque que dice `const CONFIG`.
4. Escribe tu dirección entre las comillas:

   ```js
   endpoint: "https://tu-cms.onrender.com/api/pantalla/sesiones",
   ```

5. **Commit changes** abajo.

En 1 o 2 minutos la dirección se actualiza sola. En el PC del box, cierra y
vuelve a abrir la app: el recuadro de la derecha debe decir
**"CMS · N sesiones"** con un punto verde.

---

## Cómo hacer cambios después

Cada vez que quieras cambiar algo, editas el archivo en GitHub y presionas
Commit. La dirección se actualiza sola en un par de minutos. Y como GitHub
guarda el historial, si algo se rompe puedes volver a la versión anterior
desde la pestaña **Commits**.

---

## Si algo no funciona

**La dirección da error 404** → Pages tarda hasta 3 minutos la primera vez.
Espera y recarga. Verifica que en Settings → Pages diga "Your site is live at…".

**Se ve la pantalla pero dice "Datos de demostración"** → normal, todavía no
has puesto el endpoint. Es el Paso 5.

**Dice "Error al leer"** → el endpoint responde, pero le falta la cabecera
`Access-Control-Allow-Origin: *`. Eso se arregla en el CMS, no acá.

**No aparece el botón Instalar app** → Chrome solo lo ofrece en direcciones
`https`. Verifica que estés entrando por la dirección de GitHub y no abriendo
el archivo desde tu carpeta.
