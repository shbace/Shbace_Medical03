#!/usr/bin/env python3
"""Prepare Shbace Medical launcher and notification icons plus Android permissions."""
from pathlib import Path
import sys
from PIL import Image

source = Path(sys.argv[1] if len(sys.argv) > 1 else "splash_icon.png")
main = Path(sys.argv[2] if len(sys.argv) > 2 else "android/app/src/main")
res = main / "res"
if not source.is_file():
    raise SystemExit(f"Icon source not found: {source}")
image = Image.open(source).convert("RGBA")
side = min(image.width, image.height)
left, top = (image.width-side)//2, (image.height-side)//2
image = image.crop((left, top, left+side, top+side))

def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)

for density, size in {"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}.items():
    icon = image.resize((size,size), Image.Resampling.LANCZOS)
    save(icon, res / f"mipmap-{density}/ic_launcher.png")
    save(icon, res / f"mipmap-{density}/ic_launcher_round.png")

for density, size in {"mdpi":108,"hdpi":162,"xhdpi":216,"xxhdpi":324,"xxxhdpi":432}.items():
    canvas = Image.new("RGBA", (size,size), (0,0,0,0))
    artwork = image.resize((round(size*.58),round(size*.58)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(artwork, ((size-artwork.width)//2,(size-artwork.height)//2))
    save(canvas, res / f"mipmap-{density}/ic_launcher_foreground.png")

adaptive = res / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
       '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
       '  <background android:drawable="@color/ic_launcher_background"/>\n'
       '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
       '</adaptive-icon>\n')
(adaptive / "ic_launcher.xml").write_text(xml, encoding="utf-8")
(adaptive / "ic_launcher_round.xml").write_text(xml, encoding="utf-8")
values = res / "values"
values.mkdir(parents=True, exist_ok=True)
(values / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources><color name="ic_launcher_background">#03142E</color></resources>\n',
    encoding="utf-8")

# Monochrome notification icon required by Capacitor LocalNotifications.
drawable = res / "drawable"
drawable.mkdir(parents=True, exist_ok=True)
(drawable / "ic_stat_notify.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<vector xmlns:android="http://schemas.android.com/apk/res/android" '
    'android:width="24dp" android:height="24dp" android:viewportWidth="24" '
    'android:viewportHeight="24">\n'
    '  <path android:fillColor="#FFFFFFFF" android:pathData="M19,8h-5V3h-4v5H5v4h5v5h4v-5h5z"/>\n'
    '</vector>\n', encoding="utf-8")

manifest = main / "AndroidManifest.xml"
if manifest.exists():
    content = manifest.read_text(encoding="utf-8")
    permission = '    <uses-permission android:name="android.permission.VIBRATE" />'
    if "android.permission.VIBRATE" not in content:
        content = content.replace("<application", permission + "\n    <application", 1)
    manifest.write_text(content, encoding="utf-8")
print("Shbace Medical launcher, adaptive and notification icons prepared.")
