# Diédrico 3D

Taller web local para ejercicios de geometría descriptiva. No necesita instalación, conexión, servidor de cálculo ni bibliotecas externas. Abre `index.html` en un navegador moderno, o entra desde la Caja de Herramientas. La carpeta completa debe conservar sus nueve archivos de aplicación.

## Ejercicios de partida

**Cargar un ejemplo** sustituye la escena actual; **Deshacer** permite recuperarla. La galería contiene únicamente planos, rectas y un punto auxiliar, sin sólidos:

- **Triángulo, plano y recta**: conserva posiciones, giros, medidas, colores, contorno triangular y eje común del archivo aportado `Pieza escalonada.diedrico.json`. Solo se cambian los nombres del proyecto y de sus elementos.
- **Recta secante a un plano**: una recta atraviesa el interior de un plano oblicuo.
- **Bisagra de planos**: un plano rectangular y otro triangular comparten una arista y un eje de giro. Los dos planos y la recta del eje participan en el giro conjunto.
- **Paralelos y transversal**: dos planos paralelos separados 36 mm y una recta que corta ambos parches.
- **Tres planos concurrentes**: tres planos de distintas orientaciones contienen el mismo punto P.

Los nombres y las descripciones se traducen al catalán al cargar un ejemplo en CA. Cambiar de idioma conserva los nombres de una escena ya abierta. **Nuevo** inicia un ejercicio vacío. Sin una copia local previa, se abre el primer ejemplo.

Las siete pruebas de ejemplos verifican la geometría original, las relaciones entre elementos, la independencia de cada carga, las traducciones y la exportación de las seis vistas.

## Construir

Usa **Añadir** para crear planos, puntos, segmentos, ortoedros, prismas, pirámides, conos, cilindros, circunferencias y polígonos regulares. También puedes introducir un segmento por dos puntos o un plano por tres puntos no alineados. Las dimensiones y coordenadas están en milímetros; el eje Z representa altura. Los sólidos se crean centrados en su posición. El plano local es XY y los cuerpos se desarrollan sobre Z.

Selecciona desde la escena o desde la lista izquierda. Modifica posición, ángulos y dimensiones en Propiedades, o elige **Mover**, **Rotar** o **Escalar** y arrastra un eje del manipulador. Arrastrar el objeto sin tocar un eje aplica movimiento en el plano de la pantalla, rotación sobre Z o escala uniforme, según el modo. Las rotaciones almacenan ángulos Euler y se componen X, Y, Z. El ajuste opcional usa el paso de rejilla para traslaciones y 15 grados para giros.

La lista permite ocultar y bloquear elementos. Se puede duplicar, eliminar, deshacer y rehacer. Hay un límite de 120 elementos por proyecto y coordenadas entre −10000 y 10000 mm. Las dimensiones deben ser de 0,1 a 10000 mm.

## Entender el espacio

- Arrastrar el fondo: orbitar. Rueda o pinza: zoom. Mayús + arrastrar, botón central, botón derecho o desplazamiento con dos dedos: desplazar la cámara.
- **VM** de un plano: cámara sobre su normal, que muestra su verdadera magnitud. **Canto**: dirección contenida en el plano; este se proyecta como una recta.
- **VM** de un segmento: longitud real. **Punta**: dirección paralela al segmento, que se reduce a un punto.
- Cámara isométrica, alzado, planta y dos perfiles accesibles desde la escena. Las proyecciones inferiores se actualizan con la misma geometría y a escala común.
- Rejilla horizontal, rejilla espacial sobre planos verticales, ejes y planos de referencia PH/PV/PP, todos opcionales.
- Ecuación del plano y longitud/extremos de los segmentos en Propiedades. Construcciones auxiliares: intersección de dos planos, intersección de segmento con plano y normal a un plano.

## Láminas y archivos

**Lámina y exportar** comienza con **Alzado · frente** y **Planta · arriba**, con letras, rectas y planos parciales a 6 mm, sin títulos de vistas, pie de página ni nombres de objetos. Permite elegir cualquiera de las seis vistas, mostrar u ocultar aristas ocultas, nombres, colores, cuadrícula y correspondencias, o limitar la salida al elemento seleccionado. Se puede elegir A4 o A3 horizontal, escala fija o ajuste al papel. Una escala que no cabe bloquea la exportación y explica cómo corregirla.

**Letras de puntos (A, A')** está activada inicialmente para rotular puntos, extremos de rectas y vértices. Cada punto espacial conserva su letra: A en planta, A' en alzado y primas adicionales en las demás vistas. Después de Z se continúa con AA, AB… Los vértices coincidentes comparten letra; si distintos puntos coinciden en una proyección, se agrupan sus letras. La rotulación funciona con los trazos parciales y es independiente de los nombres de los objetos. Las curvas no rotulan los puntos de su discretización; en un cono sí se rotula el vértice.

La disposición sigue el sistema europeo (primer diedro): planta bajo alzado, perfil derecho a su izquierda y perfil izquierdo a su derecha. Los dibujos mantienen una única escala; los SVG incorporan dimensiones físicas en milímetros. Referencia educativa: [Vistas en sistema europeo, EducaMadrid](https://www.educa2.madrid.org/web/curso_dibujo-tecnico/vistas-diedricas/-/visor/vistas-en-sistema-europeo).

- **SVG**: geometría vectorial con líneas visibles y ocultas diferenciadas.
- **PNG**: lámina rasterizada a 8 píxeles por milímetro: A4 de 2376 × 1680 píxeles.
- **Imprimir / PDF**: abre la impresión del navegador. Elige «Guardar como PDF», formato y orientación indicados y tamaño real/100 % para conservar una escala fija. La configuración final de la impresora puede modificarla.
- **Guardar**: descarga un proyecto `.diedrico.json`. **Abrir** recupera sus elementos con validación de datos. La copia automática se guarda en este navegador; no sustituye una copia descargada.

## Límites geométricos

Las curvas son aproximaciones poligonales: circunferencias de 96 segmentos y conos/cilindros de 64 divisiones. Elipses y cilindros elípticos se obtienen ajustando ancho y fondo. No hay operaciones booleanas de unión o vaciado; cada sólido conserva sus propias aristas.

Las aristas ocultas se resuelven en proyección contra las caras trianguladas de los sólidos, dividiendo cada segmento en los cruces de contorno y profundidad. Los planos de estudio y las figuras planas no actúan como oclusores. Las superficies de la escena usan ordenación de caras; las láminas exportadas usan el cálculo de visibilidad de aristas.

Un plano visible es un parche poligonal finito, rectangular al crearlo, mientras que su ecuación y su intersección con otro plano consideran planos infinitos. La intersección de un segmento con un plano se limita a los extremos del segmento. La recta de intersección se muestra como un segmento de longitud ilustrativa. Las construcciones auxiliares son independientes y no se recalculan al mover sus referencias.

## Atajos

V: explorar. G: mover. R: rotar. S: escalar. F: encuadrar. Escape: cancelar gesto o selección. Suprimir: eliminar. Ctrl+D: duplicar. Ctrl+Z: deshacer. Ctrl+Mayús+Z: rehacer. Ctrl+S: guardar. Ctrl+O: abrir. En macOS también se admite Cmd.

## Verificación

Ejecuta `node --test tests/*.test.cjs`. Las 88 pruebas cubren rotaciones e inversas, bases de cámara, VM/canto y longitud real, planos por puntos, intersecciones, oclusión analítica, figuras y cámaras, las 63 combinaciones de vistas, límites de escala, validación de datos y contraste de etiquetas. Incluyen contornos cóncavos, división y eliminación de aristas, conservación del plano soporte, longitudes con extremo fijo, traducciones y recuperación de contornos al guardar. Las pruebas de lámina verifican pies personalizados u ocultos, puntos homólogos, mitras a 45°, títulos ocultables y recorte parcial por interiores de planos, puntos en los extremos interiores, cruces, concavidad, oclusión y separación física en papel.

Comprobado además en navegador: creación, coordenadas, historial, arrastre de eje, VM/canto, descargas reales JSON/SVG/PNG, reapertura de proyecto y control de escala. Interfaz inspeccionada a 1440 × 900, 960 × 780 y 390 × 844. Las pruebas táctiles automatizadas no sustituyen una comprobación sobre dispositivo físico.

## Eje común, orientación y catalán

En Propiedades, **Alineación y eje común** permite situar un elemento sobre el eje X local de otra referencia. Con «Orientar también», un plano contiene ese eje, una recta coincide con él y un sólido alinea su eje local Z. Hay opciones de centros coincidentes, centros sobre ejes globales y normal de un plano. «Intersección de los dos planos» define una bisagra real sin moverlos.

**Girar sobre el eje común** permite marcar varios elementos y aplicar el mismo giro rígido alrededor de la recta de trabajo. El eje y sus miembros se guardan en el proyecto. El eje es fijo: vuelve a definirlo si mueves las referencias. «Crear recta del eje» añade un segmento de representación a la geometría exportable.

**Rotar a VM / canto / punta** modifica la geometría y muestra la vista elegida. Es distinto de los botones de la lista, que cambian la cámara. Puede respetar el eje fijo; una orientación que ese único grado de libertad no permite se rechaza sin modificar la escena. Para sólidos, la cara de referencia es su XY local.

El selector **ES / CA** traduce localmente controles, ayuda, mensajes y títulos de las láminas. Conserva nombres y datos del usuario. Se recuerda el idioma en este navegador y se admite `?lang=ca`. El ejemplo «Bisagra de planos» permite practicar el giro conjunto.

Las pruebas nuevas cubren los ejes compartidos, las cuatro vistas de orientación, los giros rígidos, las posiciones imposibles con eje fijo, el guardado de ejes y la exportación en catalán.

## Alargar rectas y editar planos

Selecciona una recta y usa **Longitud de recta** en la parte superior de Propiedades. Introduce una medida y pulsa Aplicar; Mitad y Doble permiten cambios rápidos. **Mantener fijo** elige centro, extremo A o extremo B. **Arrastrar extremos** abre la vista VM y permite mover A o B sobre su dirección sin desplazar el extremo opuesto.

En un plano, **Editar aristas** abre la vista VM y muestra círculos en sus vértices y cuadrados en el centro de cada arista. Arrastra un vértice o una arista; el movimiento permanece en el plano. Puedes elegir Vértice/Arista e índice y aplicar coordenadas U/V exactas, relativas al origen y a los ejes locales del plano. Para aristas, los valores indican su punto medio. Ajustar o Ctrl durante el arrastre usa el paso de rejilla para el desplazamiento local.

**Dividir arista** añade un punto en el centro de la arista activa o de la que sigue al vértice seleccionado. **Eliminar vértice** conecta sus vecinos. **Eliminar arista** fusiona sus extremos en su punto medio, cerrando de nuevo el contorno. Se admiten polígonos cóncavos simples de 3 a 64 vértices, sin agujeros ni aristas cruzadas o solapadas. Se conserva el origen del plano; ancho y fondo son la extensión de su contorno en los ejes locales, y escalar actúa respecto a ese origen.

Escape cancela un arrastre en curso; al pulsarlo de nuevo termina la edición. Suprimir elimina la parte activa mientras se edita el contorno. Los botones Mover/Rotar/Escalar terminan la edición del contorno para manipular el objeto completo. Cada gesto o acción se puede deshacer; los contornos se guardan en JSON y se exportan en todas las vistas. En canto o punta no se puede resolver un arrastre: vuelve a VM para editar. Las nuevas operaciones se verificaron también en el navegador, con interfaz de escritorio y móvil y traducción al catalán.

## Personalizar el pie y las correspondencias

En **Lámina y exportar → Pie de página**, escribe el título y la nota del pie. Los campos pueden quedarse vacíos; los textos largos se distribuyen en líneas dentro de su zona. Puedes ocultar los datos automáticos con **Mostrar escala y formato**, restaurar el pie predeterminado o desmarcar **Mostrar pie de página** para eliminarlo entero. Al ocultarlo se libera espacio para las vistas. El ajuste al papel puede aumentar su tamaño; las escalas fijas conservan su relación física. La configuración de la lámina se conserva mientras la página permanezca abierta.

Las opciones se aplican a SVG, PNG e impresión/PDF. Si la impresión añade fecha o dirección web, desactiva **Encabezados y pies de página** en el diálogo del navegador: esa información la genera el navegador.

**Líneas de correspondencia** enlaza las posiciones homólogas reales: verticales entre alzado y planta/inferior y horizontales entre vistas de la misma fila. La profundidad de planta/inferior se traslada a ambos perfiles por una mitra a 45°, incluso si no se selecciona alzado. Solo se trazan enlaces entre vistas presentes; se fusionan tramos repetidos y se incluyen todos los vértices exportados. Las guías quedan por debajo del dibujo y no invaden el pie.

## Títulos y trazos parciales

En **Lámina y exportar → Presentación**, activa **Títulos de las vistas** para mostrar los rótulos «Alzado · frente», «Planta · arriba», perfiles y demás. El área de cada vista se ajusta al retirar su cabecera. Los nombres de los elementos se controlan con una casilla independiente. **Marcos de las vistas** permite ocultar el rectángulo que envuelve cada vista; se conserva la escala, el encuadre y el recorte del dibujo. Afecta a la vista previa, SVG, PNG, impresión/PDF y generación múltiple.

**Rectas con trazos parciales** y **Planos con aristas parciales** están activados inicialmente para eliminar, en cada vista, los tramos que caen dentro de la proyección de otro plano. Se añaden huecos alrededor de los cruces entre líneas de elementos diferentes. **Separación en cruces** regula el margen adicional entre 0 y 10 mm de papel, con 6 mm iniciales. Las aristas aisladas se conservan completas y las esquinas del mismo plano se mantienen unidas.

Los extremos que quedan dentro de otro plano se representan con puntos. Una arista totalmente interior deja un punto en cada extremo; los vértices compartidos se dibujan una sola vez. Si ambos extremos coinciden en una vista de punta, se ve un único punto. Se conservan los tramos exteriores y se admiten varios intervalos de recorte en planos cóncavos.

La opción de planos incluye planos de contorno editable y polígonos planos de aristas rectas. Se usa el interior proyectado del parche finito de cada plano, independientemente de su profundidad; no es una operación de intersección 3D. Los bordes y los planos de canto no generan interiores falsos. Los rangos visibles y ocultos calculados contra sólidos se conservan, y la separación se adapta a la escala para mantener sus milímetros en papel. La configuración se aplica a SVG, PNG e impresión/PDF. La geometría del proyecto sigue disponible para construcciones y medidas.

## Generar múltiples láminas

Junto a **Guardar**, o desde **Lámina y exportar**, **Generar múltiples** permite crear entre 1 y 100 ejercicios aleatorios. Indica mínimos y máximos inclusivos del total de elementos, planos, rectas y sólidos 3D (hasta 120 elementos por ejercicio). El total es la suma de las tres categorías; 0–0 excluye una. Los rangos incompatibles se rechazan antes de generar.

Cada lámina varía posiciones y orientaciones. Si la escena contiene elementos de una categoría, se reutilizan como plantillas sus medidas, colores y contornos; los planos incluyen también circunferencias y polígonos planos. Si falta una categoría, se usan figuras predeterminadas; los sólidos pueden ser ortoedros, prismas, pirámides, cilindros o conos. La escena abierta y su historial se conservan.

Se utilizan las vistas, escala, formato, trazos parciales, nombres, colores, cuadrícula, correspondencias y pie configurados en **Lámina y exportar**. **Configurar lámina** abre esos ajustes. El lote exporta todos sus elementos, independientemente del filtro de selección individual. Si una escala fija no cabe, se indica la lámina afectada para corregir el ajuste, sin cambiar automáticamente la escala.

Al pulsar **Generar** se prepara el lote y se muestra la vista previa, sin iniciar descargas. Después puedes elegir **ZIP SVG**, **ZIP PNG** (8 píxeles por milímetro) o **ZIP JSON** con los proyectos editables. Cada archivo ZIP contiene únicamente los archivos del formato elegido, con la misma numeración y las mismas escenas. Puedes descargar varios formatos del mismo lote. **Imprimir / PDF** imprime una lámina por página con el mismo formato. Tanto la generación como la preparación de un ZIP se pueden cancelar; cancelar una exportación conserva las láminas. Funciona sin conexión y sin dependencias externas.


### Cruces y conexión

Activa **Forzar cruces y un único conjunto conectado** para exigir al menos dos elementos por lámina y formar una red de intersecciones en 3D. Cada elemento cruza al menos a otro y existe un camino entre cualesquiera dos: una cadena T1–T2–T3–T4 cumple la condición; dos parejas T1–T2 y T3–T4 separadas no. No se exige que todos crucen directamente con todos.

Las intersecciones se comprueban contra segmentos y superficies finitos, incluyendo contornos cóncavos, polígonos, círculos y sólidos. Coincidir en una proyección sin compartir un punto espacial no cuenta. Se conservan dimensiones, colores y contornos de las plantillas y se modifican sus posiciones y orientaciones para conectar el conjunto. Si las dimensiones impiden una conexión válida, la generación muestra un error.

### Vértices fuera de otros planos

Activa **Vértices fuera de otros planos** en **Generar múltiples** para impedir que cualquier vértice o extremo quede dentro del contorno proyectado de otro plano en cualquiera de las vistas elegidas. Se comprueban los contornos finitos, incluidos los cóncavos y las circunferencias, y los vértices de rectas y sólidos. Los bordes se admiten y los planos de canto no generan interiores. Las aristas pueden cruzarse.

La opción se puede combinar con **Forzar cruces y un único conjunto conectado**, **Recta infinita** y los trazos parciales. La geometría final se vuelve a comprobar tras prolongar las rectas y ajustar la escala. Se conservan cantidades, medidas, contornos y colores de las plantillas. Si no se encuentra una disposición válida tras los intentos acotados, se muestra un error para reducir los elementos o las vistas; nunca se entrega una lámina que incumpla la restricción.

### Recta infinita

Activa **Recta infinita** para prolongar cada recta hasta que sus extremos sobresalgan al menos **8 mm de papel en todas las vistas elegidas**. Se calcula una única pareja de extremos A y B en 3D: sus proyecciones coinciden exactamente con las líneas de correspondencia, incluidas las de planta, alzado y perfiles. Se conserva el tramo más corto compatible con todos los márgenes; por el acortamiento de la proyección, algunas vistas pueden mostrar más de 8 mm. Con trazos parciales se añade la separación configurada antes de esos 8 mm visibles. Se usan los contornos reales, también los cóncavos, y se ajustan ambos extremos por separado. SVG, PNG y proyectos JSON comparten las mismas coordenadas finales. Las rectas finitas conservan sus extremos originales. La prolongación respeta el límite de 10000 mm; si una vista de punta o la combinación de vistas y separación impide el margen, se muestra un error para ajustar la configuración.

Las pruebas comprueban cadenas y parejas desconectadas, falsos cruces por proyección, parches finitos y concavidades, todas las clases de figuras, rangos compatibles con la conexión, conservación de plantillas, prolongaciones en las seis vistas y bytes binarios del ZIP PNG. La comprobación en navegador verifica generación sin descargas, las tres descargas independientes, cancelación y conservación de opciones y escenas.

Las pruebas de extremos verifican la misma pareja A/B en las seis vistas, la unión exacta de sus correspondencias, márgenes de 8 mm con varias escalas y separaciones, el ajuste mínimo asimétrico y la coincidencia entre el JSON y la geometría dibujada.
