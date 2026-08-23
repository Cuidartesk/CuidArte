/* ============================================================
   imagenes_base64.js
   Proceso completo para guardar una imagen dentro de MongoDB:
     1. FileReader lee el archivo que eligio el usuario
     2. Canvas lo normaliza a un lienzo 1200x900 con fondo de marca
     3. Lo convierte en texto "data:image/jpeg;base64,..."
   Es reutilizable: cualquier formulario puede llamar a
   conectarFormularioImagen({ form, inputArchivo, preview, campoOculto })
   ============================================================ */

/* ---------- Utilidades compartidas ---------- */

// Normaliza una foto: lienzo uniforme 1200x900, fondo degradado,
// foto completa y centrada, salida JPEG liviana al 85%
function normalizarImagen(dataUrl, callback) {
  if (!dataUrl) { callback(''); return; }
  const img = new Image();
  img.onload = function () {
    const W = 1200, H = 900, MARGEN = 30;
    const lienzo = document.createElement('canvas');
    lienzo.width = W;
    lienzo.height = H;
    const ctx = lienzo.getContext('2d');

    // Fondo degradado blanco -> celeste (marca CuidArte)
    const fondo = ctx.createLinearGradient(0, 0, 0, H);
    fondo.addColorStop(0, '#ffffff');
    fondo.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, W, H);

    // La foto cabe COMPLETA respetando margen, sin recortes ni deformacion
    const factor = Math.min((W - MARGEN * 2) / img.width, (H - MARGEN * 2) / img.height);
    const ancho = img.width * factor;
    const alto = img.height * factor;
    ctx.drawImage(img, (W - ancho) / 2, (H - alto) / 2, ancho, alto);

    callback(lienzo.toDataURL('image/jpeg', 0.85));
  };
  img.src = dataUrl;
}

/* ---------- Conector generico para cualquier formulario ----------
   config = {
     form:         id del <form>,
     inputArchivo: id del <input type="file">,
     preview:      id del <img> de vista previa (opcional),
     campoOculto:  id del <input type="hidden"> donde queda la Base64,
   }
   Al enviar el formulario, coloca la imagen ya convertida en el
   campo oculto y recarga los valores antes del POST normal.        */
function conectarFormularioImagen(config) {
  const form = document.getElementById(config.form);
  if (!form) return;

  const archivo = document.getElementById(config.inputArchivo);
  const preview = document.getElementById(config.preview);
  const oculto = document.getElementById(config.campoOculto);

  // Vista previa al elegir archivo
  if (archivo && preview) {
    archivo.addEventListener('change', function () {
      const f = this.files[0];
      if (!f) { preview.style.display = 'none'; return; }
      const lector = new FileReader();
      lector.onload = function () {
        preview.src = lector.result;
        preview.style.display = 'block';
      };
      lector.readAsDataURL(f);
    });
  }

  // Antes de enviar: convierte la imagen y la guarda en el campo oculto.
  // INICIO MODIFICACION: se frena el envio nativo con preventDefault();
  // antes el formulario salia vacio de inmediato y la imagen quedaba fuera,
  // porque la conversion es asincrona y el navegador no espera al FileReader.
  form.addEventListener('submit', function (e) {
    if (!archivo || !oculto) return;
    const f = archivo.files[0];
    if (!f) return; // sin foto nueva: se conserva la que ya traia el campo

    e.preventDefault(); // frenar el POST vacio

    // evita doble clic mientras convierte
    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true;

    const lector = new FileReader();
    lector.onload = function () {
      normalizarImagen(lector.result, function (base64) {
        oculto.value = base64;
        form.submit(); // ahora si envia con la imagen lista
      });
    };
    lector.onerror = function () {
      if (boton) boton.disabled = false;
    };
    lector.readAsDataURL(f);
  }, true); // capture: intercepta ANTES del envio nativo
  // FIN MODIFICACION
}

/* ---------- Compatibilidad con la pagina registrarproducto ---------- */
document.addEventListener('DOMContentLoaded', function () {
  conectarFormularioImagen({
    form: 'formProducto',
    inputArchivo: 'imagen',
    preview: 'preview',
    campoOculto: 'imageData'
  });
});
