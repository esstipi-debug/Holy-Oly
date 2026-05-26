"""
Genera los iconos PWA de Holy Oly + Volta.

Crea:
- frontend/public/icon-192.png (192×192)
- frontend/public/icon-512.png (512×512)
- frontend/public/apple-touch-icon.png (180×180)

Diseño: fondo dark (#07070F) con halo gold radial + emoji 🏋️ centrado
con tipografía bold para que se vea bien en home screen.

Uso:
    pip install pillow
    python scripts/generate_pwa_icons.py
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    print("ERROR: Pillow no instalado. pip install pillow")
    sys.exit(1)


OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public"


def make_icon(size: int, output_path: Path) -> None:
    """
    Genera un icon cuadrado.
    Composición:
      - Fondo: gradient radial dark con halo gold sutil
      - Centro: emoji 🏋️ grande
      - Texto inferior: 'HO' como branding compacto (solo en sizes ≥ 192)
    """
    bg = (7, 7, 15)        # #07070F
    accent = (245, 197, 24)  # #F5C518 gold
    text_color = (234, 234, 245)  # #EAEAF5

    img = Image.new("RGB", (size, size), bg)
    draw = ImageDraw.Draw(img)

    # Halo radial gold (círculo grande con alfa decreciente)
    halo_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo_layer)
    halo_radius = size // 2
    for i in range(halo_radius, halo_radius // 3, -2):
        # Alpha decae cuadrático hacia el centro · más brillante en medio
        t = (halo_radius - i) / (halo_radius - halo_radius // 3)
        alpha = int(120 * (t ** 2))
        halo_draw.ellipse(
            [
                size // 2 - i, size // 2 - i,
                size // 2 + i, size // 2 + i,
            ],
            outline=(*accent, alpha),
            width=2,
        )
    # Blur del halo para suavizar
    halo_layer = halo_layer.filter(ImageFilter.GaussianBlur(radius=max(2, size // 64)))
    img.paste(halo_layer, (0, 0), halo_layer)
    draw = ImageDraw.Draw(img)

    # Anillo gold central
    ring_thickness = max(3, size // 64)
    ring_radius = size // 3
    draw.ellipse(
        [
            size // 2 - ring_radius, size // 2 - ring_radius,
            size // 2 + ring_radius, size // 2 + ring_radius,
        ],
        outline=accent,
        width=ring_thickness,
    )

    # Letra grande "HO" en el centro (proxy del logo · custom fonts no garantizadas)
    # Usamos default font de PIL · escalamos via draw_text con stroke
    try:
        from PIL import ImageFont
        # Intentar bold del sistema
        font_size = int(size * 0.32)
        font_paths = [
            "C:/Windows/Fonts/Arialbd.ttf",
            "C:/Windows/Fonts/seguibl.ttf",  # Segoe UI Black
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
        font = None
        for fp in font_paths:
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except OSError:
                continue
        if font is None:
            font = ImageFont.load_default()
    except Exception:
        font = None

    text = "HO"
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2 - bbox[0]
        ty = (size - th) // 2 - bbox[1]
        # Sombra
        draw.text((tx + 2, ty + 2), text, fill=(0, 0, 0), font=font)
        draw.text((tx, ty), text, fill=text_color, font=font)
    else:
        # Fallback: rectángulo decorativo
        draw.rectangle(
            [size // 3, size // 2 - size // 16, 2 * size // 3, size // 2 + size // 16],
            fill=text_color,
        )

    img.save(output_path, "PNG", optimize=True)
    print(f"  ✓ {output_path.name}  ({size}×{size}px · {output_path.stat().st_size // 1024}KB)")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generando iconos PWA en {OUT_DIR}")

    make_icon(192, OUT_DIR / "icon-192.png")
    make_icon(512, OUT_DIR / "icon-512.png")
    make_icon(180, OUT_DIR / "apple-touch-icon.png")

    print("\nListo · commit + push y Render rebuildea el frontend.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
