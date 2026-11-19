# Juegos retro en el navegador

Mini proyecto para entender cómo correr juegos clásicos dentro de una página web.

| Carpeta | Qué es |
|---|---|
| `raycaster/` | Motor 3D estilo Wolfenstein 3D hecho desde cero en JavaScript + `<canvas>`. Sin dependencias. |
| `dos/` | Un juego de MS-DOS corriendo con [js-dos](https://js-dos.com/) (DOSBox compilado a WebAssembly). |

## Ver el sitio

Está publicado con GitHub Pages (Settings → Pages → rama `main`, carpeta `/`).

Para probarlo en tu computador, sírvelo con un servidor local (no lo abras con doble clic):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Poner DOOM en `dos/`

1. Consigue DOOM shareware (`DOOM.EXE` + `DOOM1.WAD`, de libre distribución) o usa [Freedoom](https://freedoom.github.io/).
2. Crea un bundle `.jsdos` en [js-dos Studio](https://dos.zone/studio/). Un bundle es solo un `.zip` con el juego y `.jsdos/dosbox.conf`.
3. Guarda el bundle como `dos/doom.jsdos` y en `dos/index.html` cambia la `url` por `"doom.jsdos"`.

**No subas juegos comerciales completos** (Doom registrado, Doom II, etc.): este repositorio es público.

## Cómo funciona el raycaster

1. El nivel es una cuadrícula 2D.
2. Se lanza un rayo por cada columna de la pantalla.
3. Con el algoritmo DDA, cada rayo salta de celda en celda hasta encontrar una pared.
4. La altura de la pared es `escala / distancia`.
5. Se corrige el efecto "ojo de pez" con `cos(ánguloRayo − ánguloJugador)`.
6. Se toma una columna de la textura según el punto exacto donde pegó el rayo.
