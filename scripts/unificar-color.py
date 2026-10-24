"""Unifica el color de los keyframes del recorrido antes de generar los videos.

Cada foto se tomó con otra luz y otro procesado (una HDR muy saturada, otra al
atardecer, otra con bruma). Si el modelo de video recibe fotos tan distintas, la
transición cambia de color de golpe. Este script:

1. Encuadra todas a 16:9 y las deja en 2560x1440.
2. Acerca cada foto al promedio del grupo: balance de blancos, exposición y
   saturación. No las iguala del todo, solo reduce la diferencia (FUERZA).
3. Aplica el mismo look a todas: curva suave, azules saturados contenidos y un
   toque cálido en las luces.

Es determinista y local: no inventa detalle, solo mueve el color.

Uso: python scripts/unificar-color.py <carpeta_entrada> <carpeta_salida>
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ANCHO, ALTO = 2560, 1440
FUERZA = 0.65  # 0 = sin normalizar, 1 = igualar al promedio del grupo
# El balance de blancos va más suave: el promedio del grupo es cálido por los
# interiores de ladrillo y, a fuerza completa, tiñe de rosa las nubes.
FUERZA_BLANCOS = 0.35


def encuadrar(img: Image.Image) -> np.ndarray:
    w, h = img.size
    objetivo = ANCHO / ALTO
    if w / h > objetivo:
        nuevo_w = round(h * objetivo)
        img = img.crop(((w - nuevo_w) // 2, 0, (w - nuevo_w) // 2 + nuevo_w, h))
    else:
        nuevo_h = round(w / objetivo)
        img = img.crop((0, (h - nuevo_h) // 2, w, (h - nuevo_h) // 2 + nuevo_h))
    img = img.resize((ANCHO, ALTO), Image.LANCZOS)
    return np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0


def luminancia(rgb: np.ndarray) -> np.ndarray:
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def saturacion(rgb: np.ndarray) -> np.ndarray:
    mx, mn = rgb.max(axis=-1), rgb.min(axis=-1)
    return np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)


def medir(rgb: np.ndarray) -> dict:
    lum = luminancia(rgb)
    return {
        "medias": rgb.reshape(-1, 3).mean(axis=0),
        "negro": np.percentile(lum, 1),
        "blanco": np.percentile(lum, 99),
        "medio": np.median(lum),
        "sat": saturacion(rgb).mean(),
    }


def ajustar_saturacion(rgb: np.ndarray, factor: np.ndarray | float) -> np.ndarray:
    gris = luminancia(rgb)[..., None]
    return gris + (rgb - gris) * factor


def normalizar(rgb: np.ndarray, m: dict, grupo: dict) -> np.ndarray:
    # Balance de blancos: acerca la proporción entre canales a la del grupo,
    # sin tocar las luces altas para que nubes y paredes blancas sigan blancas.
    proporcion = m["medias"] / m["medias"].mean()
    proporcion_grupo = grupo["medias"] / grupo["medias"].mean()
    lum = luminancia(rgb)[..., None]
    proteger = 1 - np.clip((lum - 0.6) / 0.3, 0, 1)
    rgb = rgb * (1 + FUERZA_BLANCOS * proteger * (proporcion_grupo / proporcion - 1))

    # Exposición y contraste: lleva negro, medio y blanco hacia los del grupo.
    negro = m["negro"] + FUERZA * (grupo["negro"] - m["negro"])
    blanco = m["blanco"] + FUERZA * (grupo["blanco"] - m["blanco"])
    rgb = (rgb - m["negro"]) / max(m["blanco"] - m["negro"], 1e-3) * (blanco - negro) + negro
    medio_actual = np.median(luminancia(np.clip(rgb, 0, 1)))
    medio = medio_actual + FUERZA * (grupo["medio"] - medio_actual)
    gamma = np.log(np.clip(medio, 0.05, 0.95)) / np.log(np.clip(medio_actual, 0.05, 0.95))
    rgb = np.clip(rgb, 0, 1) ** gamma

    # Saturación: acerca la saturación media a la del grupo.
    sat = saturacion(rgb).mean()
    factor = 1 + FUERZA * (grupo["sat"] / max(sat, 1e-3) - 1)
    return np.clip(ajustar_saturacion(rgb, np.clip(factor, 0.75, 1.25)), 0, 1)


def look(rgb: np.ndarray) -> np.ndarray:
    # Azules muy saturados (piscina y cielo HDR) un poco más contenidos.
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    azul = np.clip((b - np.maximum(r, g)) * 2.5, 0, 1) * saturacion(rgb)
    rgb = ajustar_saturacion(rgb, (1 - 0.18 * azul)[..., None])

    # Curva en S suave.
    rgb = np.clip(rgb, 0, 1)
    rgb = 0.85 * rgb + 0.15 * (0.5 - 0.5 * np.cos(np.pi * rgb))

    # Toque cálido en las luces, sombras neutras.
    lum = luminancia(np.clip(rgb, 0, 1))[..., None]
    calido = np.array([1.025, 1.005, 0.975], dtype=np.float32)
    rgb = rgb * (1 + (calido - 1) * lum)
    return np.clip(rgb, 0, 1)


def main(entrada: Path, salida: Path) -> None:
    salida.mkdir(parents=True, exist_ok=True)
    archivos = sorted(p for p in entrada.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    fotos = {p.stem: encuadrar(Image.open(p)) for p in archivos}
    medidas = {k: medir(v) for k, v in fotos.items()}
    grupo = {
        "medias": np.mean([m["medias"] for m in medidas.values()], axis=0),
        **{c: float(np.median([m[c] for m in medidas.values()])) for c in ("negro", "blanco", "medio", "sat")},
    }
    for nombre, rgb in fotos.items():
        final = look(normalizar(rgb, medidas[nombre], grupo))
        Image.fromarray((final * 255 + 0.5).astype(np.uint8)).save(salida / f"{nombre}.png", optimize=True)
        antes, despues = medidas[nombre], medir(final)
        print(
            f"{nombre:18} medio {antes['medio']:.2f}→{despues['medio']:.2f}  "
            f"sat {antes['sat']:.2f}→{despues['sat']:.2f}"
        )


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
