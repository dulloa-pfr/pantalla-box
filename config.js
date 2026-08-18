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

  // Cuánta gente cabe en la pantalla a la vez.
  capacidad: 15,

  // Kinesiología siempre en la franja derecha.
  kineDerecha: true,

  // ¿El endpoint de guardado ya acepta sesiones de kinesiología?
  // Mientras esté en false, en las fichas kinésicas no aparece el botón
  // "Guardar también en el CMS" (el CMS todavía responde 409).
  // Se pone en true el mismo día en que el CMS quede listo.
  guardarKine: false,

  // Cada cuántos segundos se vuelve a preguntar al CMS. 0 = nunca.
  refrescoSegundos: 300
};
