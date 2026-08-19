/* ============================================================
   PANTALLA DEL BOX — CONFIGURACIÓN
   ------------------------------------------------------------
   Este es el ÚNICO archivo que hay que editar.
   Cuando llegue una versión nueva de la pantalla se reemplaza
   index.html y este archivo NO se toca.
   ============================================================ */
window.PF_CONFIG = {

  // Catálogo de clientes con plan activo (CMS). Con token incluido.
  endpoint: "https://patagonia-fit-cms.onrender.com/api/pantalla/clientes?token=879ef46a17512913fe60762bf6d6b13fec40cac3",

  // POST para guardar ediciones en el CMS. Si se deja vacío,
  // el botón "Guardar también en el CMS" simplemente no aparece.
  endpointGuardar: "https://patagonia-fit-cms.onrender.com/api/pantalla/guardar?token=879ef46a17512913fe60762bf6d6b13fec40cac3",

  // Fase 2, cuando se agende entrenamiento en el CMS. Por ahora vacío.
  endpointAgenda: "",

  // Tablero compartido entre computadores del centro. Con esto vacío, cada
  // computador tiene su propio tablero y todo funciona como hasta ahora.
  endpointEstado: "https://patagonia-fit-cms.onrender.com/api/pantalla/estado?token=879ef46a17512913fe60762bf6d6b13fec40cac3",

  // Cada cuántos segundos se consulta el tablero compartido.
  segundosEstado: 4,

  // Cuánta gente cabe en la pantalla a la vez.
  capacidad: 15,

  // Kinesiología siempre en la franja derecha.
  kineDerecha: true,

  // ¿El endpoint de guardado ya acepta sesiones de kinesiología?
  // Mientras esté en false, en las fichas kinésicas no aparece el botón
  // "Guardar también en el CMS" (el CMS todavía responde 409).
  // Se pone en true el mismo día en que el CMS quede listo.
  guardarKine: true,

  // Cada cuántos segundos se vuelve a preguntar al CMS. 0 = nunca.
  refrescoSegundos: 300
};

/* ============================================================
   La pantalla manda la sesión del CMS junto con sus peticiones.
   ------------------------------------------------------------
   `fetch` no envía cookies a otro sitio salvo que se le pida con
   credentials: 'include'. Esto lo añade a las llamadas que van al
   CMS, y solo a esas.

   Vive aquí y no en index.html a propósito: index.html se
   reemplaza entero en cada versión de la pantalla, y este cambio
   se perdería en la siguiente. Este archivo no se reemplaza nunca.

   Cuando una versión de la pantalla traiga credentials: 'include'
   de fábrica en sus cuatro fetch, este bloque se puede borrar.
   ============================================================ */
(function () {
  var cfg = window.PF_CONFIG || {};
  var url = cfg.endpoint || cfg.endpointGuardar || cfg.endpointEstado || "";
  if (!url) return;                      // sin CMS configurado no hay nada que hacer
  var origen;
  try { origen = new URL(url).origin; } catch (e) { return; }

  var original = window.fetch;
  window.fetch = function (entrada, opciones) {
    var destino = typeof entrada === "string" ? entrada
                : (entrada && entrada.url) ? entrada.url : "";
    if (destino.indexOf(origen) === 0) {
      opciones = Object.assign({}, opciones || {}, { credentials: "include" });
    }
    return original.call(this, entrada, opciones);
  };
})();
