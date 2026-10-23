# Oakbase — reproductor de la historia del grafo sobre V2

Esta versión recupera la web V2 y añade un reproductor de 18 segundos en su grafo de conocimiento, dentro de `#platform`. Es una animación HTML/SVG con controles de vídeo; no descarga un MP4. La animación comienza al pulsar Play: firma → zoom sobre el cliente → correo → compromiso → tarea → el agente recoge la tarea → el agente se la trae proactivamente al profesional. La secuencia conserva seis momentos: los cinco primeros duran 2 segundos cada uno y el último ocupa de 10 a 18 segundos. Un reloj único controla la cámara, los nodos, las conexiones y el cierre: arrastrar el progreso muestra el fotograma correspondiente y pausar congela toda la escena. El botón «Explorar el grafo» devuelve el explorador original, y volver al vídeo conserva el tiempo. Los datos y las acciones son ilustrativos.

Los controles son mínimos: bajo la escena sólo aparece una línea continua de progreso de 2 px, sin marcas, contador, capítulos, reinicio ni textos. El control sigue siendo accesible y arrastrable; admite Home, End y flechas. Dentro de la escena hay un único botón discreto de reproducción, pausa o repetición, oculto en la portada y en el modo explorador. No hay cabeceras ni barra superior del grafo: la escena comienza directamente en el borde del bloque. Un icono discreto dentro del viewport alterna entre grafo y vídeo, con nombre accesible en cada idioma. La explicación de que es un ejemplo ilustrativo del Brain en desarrollo permanece en las instrucciones accesibles del reproductor.

Entre 8 y 10 segundos, una ficha anclada al nodo del agente reúne la tarea pendiente de enviar el presupuesto a Marta, su responsable, plazo, asunto y correo de origen, sin llamada a la acción. El capítulo final hace zoom a la conversación: entre 10 y 10,9 segundos el panel se amplía y se centra, mientras desaparecen por completo el grafo, el Brain y la línea conectora. El fondo se vuelve opaco y al final sólo queda visible el conversacional dentro de la escena.

La conversación incluye cabecera y avatar Oakbase reutilizado del hero y un único mensaje dirigido a Álex sobre la tarea y su plazo, sin la etiqueta «Ahora · Mensaje proactivo». El mensaje aparece en streaming más lento, entre 10,12 y 13,6 segundos: cada fragmento de texto depende del reloj del reproductor, con un cursor discreto y estático. El correo de origen empieza a aparecer a los 13,6 segundos. Con movimiento reducido, el mensaje se muestra completo, sin streaming.

El cierre no contiene botones de acción: debajo del mensaje queda una caja sencilla «Responder a tu agente…», con borde suave y flecha decorativa. El compositor permanece desactivado porque es una demostración, sin envío ni interacción conversacional real. El correo de origen sigue disponible en los momentos anteriores del grafo. Entre 14 y 18 segundos se mantiene el plano final completo durante cuatro segundos para facilitar su lectura; también permanece disponible al terminar la reproducción. No se clona el mock completo del hero ni se añaden tareas secundarias.

Esta iteración elimina las dos franjas superiores y conserva el cambio entre grafo y vídeo mediante un icono dentro de la escena. Mantiene el cierre sencillo, el progreso mínimo y los tiempos. El estado de publicación y las verificaciones se recogen en `REVIEW.md`.

`v2/` permanece intacto. El diseño V3 descartado está archivado en `archive/rejected-design/` y no se publica.

## Construcción y comparación

Desde la raíz del repositorio:

```sh
python3 v3/scripts/build.py
python3 -m http.server 4317 --bind 127.0.0.1 --directory v3/dist
```

- Original: <https://penrile29.github.io/agentia-website/?lang=es#platform>
- Grafo nuevo local: <http://127.0.0.1:4317/?lang=es#platform>

El build reutiliza el empaquetador público de V2, copia sus recursos a `v3/dist/`, integra `graph-story-native.js` dentro del controlador original en la copia generada de `v2.js`, e incorpora `graph-story.css` y `graph-story.js`. `agent-story-view.js` permanece fuera del bundle. Los 534 nodos originales conservan sus elementos y coordenadas relativas; los cuatro nodos nuevos y sus conexiones se incorporan a las mismas capas del grafo. La cámara cambia de encuadre durante la historia y, en el cierre, las capas del grafo se ocultan mientras la conversación se amplía y centra. No modifica contenido ni estilos del resto de la web. Edita los archivos `graph-story*` para cambiar la demostración y vuelve a construir. El parche estructural está en `scripts/patch_graph.py`; falla si cambia una de sus anclas de V2. Requiere Python 3 y Node.js, sin instalar paquetes.

## Preview público

```sh
bash v3/scripts/publish-preview.sh --dry-run
bash v3/scripts/publish-preview.sh --publish
```

El modo predeterminado es `--dry-run`. Solo `--publish` crea un commit y hace push. Se copia exclusivamente `dist/` a `gh-pages/v3/`; el script comprueba que todos los archivos ajenos a `/v3/` mantienen contenido y permisos idénticos. Nunca publica scripts, archivos históricos ni documentación y no modifica producción.

URL tras publicar: <https://penrile29.github.io/agentia-website/v3/?lang=es#platform>. El antiguo enlace `/v3/es/` redirige a la misma página en español. La selección EN/ES original sigue funcionando y el preview lleva `noindex`.

Comprueba la publicación con `gh api repos/penrile29/agentia-website/pages/builds/latest`. El script informa del commit previo de `gh-pages` para poder restaurar únicamente `/v3/` mediante un nuevo commit.
