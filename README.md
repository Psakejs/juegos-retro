# Juegos retro en el navegador

Clásicos de los 80 y 90 funcionando dentro de una página web, publicados con GitHub Pages.
Todo corre en el navegador del visitante y no depende de ningún servidor externo.

## Juegos

| Juego | Carpeta | Cómo funciona | Licencia |
|---|---|---|---|
| Mini raycaster | `raycaster/` | Motor 3D propio en JavaScript + `<canvas>` | Código propio |
| Buscaminas | `buscaminas/` | Recreación propia (código y gráficos nuevos) | Código propio |
| Freedoom: Phase 1 | `dos/freedoom.jsdos` | Motor FastDoom en DOSBox (js-dos) | Freedoom: BSD · FastDoom: GPL-2.0 |
| Zork I, II, III | `zork/` | Intérprete Z-machine (ifvms.js) + pantalla propia | MIT (Microsoft, 2025) |
| Digger | `dos/digger.jsdos` | DOSBox (js-dos) | Freeware |
| Wolfenstein 3D (ep. 1) | `dos/wolf3d.jsdos` | DOSBox (js-dos) | Shareware · *pendiente* |
| Tyrian 2000 | `dos/tyrian.jsdos` | DOSBox (js-dos) | Freeware · *pendiente* |
| One Must Fall: 2097 | `dos/omf.jsdos` | DOSBox (js-dos) | Freeware · *pendiente* |
| Liero 1.33 | `dos/liero.jsdos` | DOSBox (js-dos) | Freeware · *pendiente* |

Los juegos de DOS se abren con `dos/?juego=NOMBRE`. Si falta su archivo `.jsdos`, la página
avisa en vez de fallar. La lista de juegos y sus controles está al principio de `dos/index.html`.

## Probar en tu computador

Sírvelo con un servidor local (no lo abras con doble clic, porque el navegador bloquea las descargas):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Agregar un juego de DOS

1. Descarga el juego desde su fuente oficial y descomprímelo en una carpeta.
2. Crea el bundle con el script incluido:

   ```bash
   python3 herramientas/crear_bundle.py ~/juegos/liero dos/liero.jsdos "LIERO.EXE"
   ```

   Un bundle `.jsdos` es solo un `.zip` con los archivos del juego y `.jsdos/dosbox.conf`.
   El script usa `herramientas/dosbox-base.conf` y agrega los comandos de arranque.
3. Si es un juego nuevo, agrégalo a la lista `JUEGOS` en `dos/index.html` y a la portada.

Guarda siempre el bundle dentro del repo: si lo cargas desde otro dominio, el navegador puede
bloquearlo y js-dos muestra "Failed to fetch".

**Solo sube juegos libres, freeware o shareware.** Los shareware (como Wolfenstein 3D) se suben
sin modificar y con su archivo de licencia. Nunca subas juegos comerciales completos: este repositorio es público.

## Cómo funciona el raycaster

1. El nivel es una cuadrícula 2D.
2. Se lanza un rayo por cada columna de la pantalla.
3. Con el algoritmo DDA, cada rayo salta de celda en celda hasta encontrar una pared.
4. La altura de la pared es `escala / distancia`.
5. Se corrige el efecto "ojo de pez" con `cos(ánguloRayo − ánguloJugador)`.
6. Se toma una columna de la textura según el punto exacto donde pegó el rayo.

## Créditos y licencias

- `dos/js-dos/`: [js-dos](https://github.com/caiiiycuk/js-dos) v8.5.4, GPL-2.0 (archivos del paquete npm `js-dos`, sin modificar).
- `dos/digger.jsdos`: Digger © Windmill Software 1983, freeware. Bundle de prueba incluido en js-dos 6.22, ajustado para que el juego arranque solo.
- `dos/freedoom.jsdos`: [Freedoom](https://freedoom.github.io/) 0.13.0 (`FREEDM1.WAD`, licencia BSD, ver `FREEDOOM.LIC` dentro del bundle) y [FastDoom](https://github.com/viti95/FastDoom) 1.3.0 (GPL-2.0, ver `FASTDOOM.LIC`; el código fuente está en ese repositorio).
- `zork/historias/`: Zork I, II y III de Infocom, archivos compilados de los repositorios [historicalsource](https://github.com/historicalsource/zork1), licencia MIT © 2025 Microsoft (`LICENSE-ZORK.txt`). "Zork" es marca registrada de sus dueños.
- `zork/lib/`: [ifvms.js](https://github.com/curiousdannii/ifvms.js) 1.1.6 y GlkAPI de [glkote-term](https://github.com/curiousdannii/glkote-term) 0.4.4, ambos MIT (`LICENSES.txt`).
