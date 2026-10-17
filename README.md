# Caja de Herramientas

Hub de aplicaciones web estáticas de David López Borrego. Se publica en
`https://davidlb025.github.io/herramientas/`, como sitio de proyecto de GitHub Pages.
El portafolio principal enlaza a esa dirección; este repositorio contiene el hub
y las aplicaciones, cada una en su propia carpeta.

## Contenido

- `index.html`: hub autocontenido, con CSS, JavaScript, catálogo, fuentes,
  licencias, favicon y captura real de la aplicación incrustados.
- `estatica_maquinas/index.html`: nueva versión del Taller de Estática facilitada
  por David, con temas claro/oscuro y enlace de regreso al hub.
- `pizarradt/index.html`: Pizarra DT, taller de dibujo técnico con construcciones
  geométricas, capas, importación de PDF e imágenes y exportación PDF / PNG / SVG.
  Conserva su interfaz en español y permite volver al hub con el idioma de entrada.
- `voz_en_off_adder/index.html`: Voz en off, editor local en un único HTML para
  añadir audio o grabar narración sobre MP4, WebM y WebP. Permite ajustar la mezcla,
  sincronización y encuadre, y exportar MP4 (si el navegador lo admite), WebM o WAV.
  Incluye un enlace de regreso a la Caja conservando el idioma de entrada.
- `.nojekyll`: sirve los archivos directamente en GitHub Pages.
- `.gitignore`: excluye contexto local, pruebas, cachés, dependencias y paquetes.

Las portadas son capturas reales incrustadas en el HTML, de **1891 × 909 píxeles**,
mostradas completas y con su proporción original. El Taller de Estática conserva
la imagen PNG facilitada por David, sin recomprimir. La portada de Pizarra DT
muestra su ejemplo integrado «Estudio de construcciones». La portada de Voz en off
muestra el editor listo para cargar un archivo, con su captura real incrustada. No son imágenes
generadas ni representan resultados calculados por el hub.
El hub no necesita fuentes, imágenes, scripts o estilos externos. La aplicación
conserva las fuentes de Google Fonts que utiliza la versión facilitada.

## Añadir una herramienta

1. Crear una carpeta, por ejemplo `mi_herramienta/`, con su `index.html` y recursos.
2. Buscar `id="tool-catalog"` dentro del `index.html` principal y añadir una
   entrada al catálogo, copiando la estructura de la existente:
   `id` único, `path: 'mi_herramienta/'`, categoría y textos en ES / CA / EN.
   `summary` es la frase breve visible bajo el título; `description` permite
   ampliar la información que consulta el buscador. Toda la tarjeta abre la aplicación.
   Las rutas de aplicaciones e imágenes deben ser relativas, sin `/` inicial.
3. Usar la misma clave `category` para herramientas de la misma categoría y el
   mismo `categoryName`. El filtro por categorías aparece cuando hay más de una.
4. Incluir una imagen real y su texto alternativo. Para mantener el hub en un
   solo archivo se puede usar una imagen como URI `data:`; también se admite
   una ruta relativa a una imagen dentro de la carpeta de la aplicación.
   Las portadas están en los metadatos `id="statics-cover"` , `id="pizarra-cover"` y `id="voice-cover"`.
   Añadir también el enlace de respaldo de la nueva aplicación en `<noscript>`.
5. Subir los cambios. No hay compilación ni dependencias que instalar.

El buscador consulta nombre, descripción, categoría y etiquetas e ignora tildes.
El hub acepta `?lang=es`, `?lang=ca` y `?lang=en`, conserva la preferencia del
portafolio y la transmite a cada aplicación. Cada aplicación decide si admite
ese parámetro y puede tener su propio selector de idioma.

## GitHub Pages

En **Settings → Pages**, elegir **Deploy from a branch**, rama `main`, carpeta
`/ (root)`. Conservar el nombre del repositorio `herramientas` para obtener la
ruta `/herramientas/`. No añadir un dominio personalizado a este repositorio.
`.nojekyll` permite servir directamente todos los archivos estáticos.

La configuración de Pages debe activarse en GitHub si aún no lo está. Esta entrega
prepara los archivos; no modifica ajustes del repositorio ni publica cambios.

## Vista local

Desde la raíz del repositorio: `python -m http.server 8000`.
Abrir `http://localhost:8000/`. Los enlaces a las aplicaciones funcionan en ese
servidor y bajo `/herramientas/`. Los enlaces al portafolio apuntan a `/`, como
corresponde al despliegue real; un servidor aislado del hub no incluye el portafolio.

La búsqueda, idiomas y catálogo funcionan en el navegador. Sin JavaScript se
mantienen enlaces directos al Taller de Estática, Pizarra DT y Voz en off.

El hub, el Taller de Estática, Pizarra DT y Voz en off incluyen el mismo favicon del portafolio incrustado en sus HTML. No requieren una carpeta assets ni un archivo de favicon externo.
