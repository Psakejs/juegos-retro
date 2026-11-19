#!/usr/bin/env python3
"""Crea un bundle .jsdos (zip con los archivos del juego + .jsdos/dosbox.conf).

Uso:
  python3 herramientas/crear_bundle.py CARPETA_DEL_JUEGO dos/NOMBRE.jsdos "COMANDO" [memoria_mb] [cycles]

Ejemplos:
  python3 herramientas/crear_bundle.py ~/juegos/liero dos/liero.jsdos "LIERO.EXE"
  python3 herramientas/crear_bundle.py ~/juegos/wolf3d dos/wolf3d.jsdos "WOLF3D.EXE" 16 max

Varios comandos se separan con punto y coma: "CD JUEGO;JUEGO.EXE"
"""
import re
import sys
import zipfile
from pathlib import Path

BASE_CONF = Path(__file__).with_name("dosbox-base.conf")


def build(src: Path, out: Path, command: str, memsize: int = 16, cycles: str = "auto"):
    conf = BASE_CONF.read_text(encoding="utf-8")
    conf = re.sub(r"(?m)^memsize=.*$", f"memsize={memsize}", conf)
    conf = re.sub(r"(?m)^cycles=.*$", f"cycles={cycles}", conf)
    conf += "[autoexec]\necho off\nmount c .\nc:\n" + command.replace(";", "\n") + "\n"
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr(".jsdos/dosbox.conf", conf)
        for f in sorted(src.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(src).as_posix())
    print(f"{out}: {out.stat().st_size/1e6:.1f} MB")


if __name__ == "__main__":
    a = sys.argv[1:]
    build(Path(a[0]), Path(a[1]), a[2], int(a[3]) if len(a) > 3 else 16, a[4] if len(a) > 4 else "auto")
