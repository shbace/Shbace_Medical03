#!/usr/bin/env python3
"""Prepare Shbace Medical's official launcher icon and Android manifest."""
from pathlib import Path
import sys
from PIL import Image, ImageOps, ImageDraw

source = Path(sys.argv[1] if len(sys.argv) > 1 else "splash_icon.png")
main = Path(sys.argv[2] if len(sys.argv) > 2 else "android/app/src/main")
res = main / "res"
if not source.is_file():
    raise SystemExit(f"Icon source not found: {source}")

image = Image.open(source).convert("RGBA")
# Square-crop and downsample once; keep the supplied artwork intact.
side = min(image.width, image.height)
left = (image.width - side) // 2
top = (image.height - side) // 2
image = image.crop((left, top, left + side, top + side))

legacy = {"mdpi":48, "hdpi":72, "xhdpi":96, "xxhdpi":144, "xxxhdpi":192}
adaptive = {"mdpi":108, "hdpi":162, "xhdpi":216, "xxhdpi":324, "xxxhdpi":432}

def save_png(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)

for density, size in legacy.items():
    icon = image.resize((size, size), Image.Resampling.LANCZOS)
    save_png(icon, res / f"mipmap-{density}" / "ic_launcher.png")
    save_png(icon, res / f"mipmap-{density}" / "ic_launcher_round.png")

for density, size in adaptive.items():
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Keep the complete supplied badge inside Android's adaptive-icon safe area.
    artwork = image.resize((round(size * 0.58), round(size * 0.58)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(artwork, ((size-artwork.width)//2, (size-artwork.height)//2))
    save_png(canvas, res / f"mipmap-{density}" / "ic_launcher_foreground.png")

adaptive_dir = res / "mipmap-anydpi-v26"
adaptive_dir.mkdir(parents=True, exist_ok=True)
(adaptive_dir / "ic_launcher.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '  <background android:drawable="@color/ic_launcher_background"/>\n'
    '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
    '</adaptive-icon>\n', encoding="utf-8")
(adaptive_dir / "ic_launcher_round.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '  <background android:drawable="@color/ic_launcher_background"/>\n'
    '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
    '</adaptive-icon>\n', encoding="utf-8")
values = res / "values"
values.mkdir(parents=True, exist_ok=True)
color_file = values / "ic_launcher_background.xml"
color_file.write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources><color name="ic_launcher_background">#03142E</color></resources>\n',
    encoding="utf-8")

manifest = main / "AndroidManifest.xml"
if manifest.exists():
    content = manifest.read_text(encoding="utf-8")
    permission = '    <uses-permission android:name="android.permission.VIBRATE" />'
    if "android.permission.VIBRATE" not in content:
        content = content.replace("<application", permission + "\n    <application", 1)
    manifest.write_text(content, encoding="utf-8")
print("Official Shbace Medical launcher icons and VIBRATE permission prepared.")
