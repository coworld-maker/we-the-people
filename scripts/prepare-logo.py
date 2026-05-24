#!/usr/bin/env python3
"""
Prepare brand-logo derivatives from a single source file.

Drop your full logo (open padlock + Capitol + 'DEMOCRACY UNLOCKED' wordmark)
at public/logo.png, then run:

    python3 scripts/prepare-logo.py

This produces:

    public/logo-mark.png  — icon-only crop (top ~75 % of the source).
                            Sharper than CSS-cropping the full image; used
                            in the nav header.

    app/icon.png          — 256×256 favicon. Next.js auto-detects this path
                            and serves it as the site favicon — no further
                            wiring needed.

    app/apple-icon.png    — 180×180 iOS home-screen icon. Same auto-detect.

    public/icon-192.png   — 192×192 Android PWA icon. Referenced by the
                            web app manifest at app/manifest.ts.

    public/icon-512.png   — 512×512 Android PWA maskable icon + splash.

All outputs are PNG with transparent backgrounds preserved when present.

Tweak ICON_FRACTION below if your source has different proportions between
icon and wordmark.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE     = ROOT / 'public' / 'logo.png'
MARK       = ROOT / 'public' / 'logo-mark.png'
FAVICON    = ROOT / 'app' / 'icon.png'
APPLE      = ROOT / 'app' / 'apple-icon.png'
PWA_192    = ROOT / 'public' / 'icon-192.png'
PWA_512    = ROOT / 'public' / 'icon-512.png'

# Source image is roughly 75 % icon (top) + 25 % wordmark (bottom).
# Adjust if your image has a different split.
ICON_FRACTION = 0.78
FAVICON_SIZE  = 256
APPLE_SIZE    = 180

def main():
    if not SOURCE.exists():
        print(f'✗ {SOURCE} not found. Save your logo image there first.')
        raise SystemExit(1)

    img = Image.open(SOURCE).convert('RGBA')
    w, h = img.size
    print(f'→ Source: {SOURCE.name}  ({w}×{h})')

    # ── 1. logo-mark.png — crop to the icon portion, then re-pad to square ──
    crop_h = int(h * ICON_FRACTION)
    icon = img.crop((0, 0, w, crop_h))
    # Pad to square so the icon doesn't squish in the nav slot
    side = max(icon.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(icon, ((side - icon.width) // 2, (side - icon.height) // 2))
    MARK.parent.mkdir(parents=True, exist_ok=True)
    square.save(MARK, optimize=True)
    print(f'✓ Wrote {MARK.relative_to(ROOT)}  ({square.size[0]}×{square.size[1]})')

    # ── 2. app/icon.png — 256×256 favicon ──
    favicon = square.copy().resize((FAVICON_SIZE, FAVICON_SIZE), Image.LANCZOS)
    FAVICON.parent.mkdir(parents=True, exist_ok=True)
    favicon.save(FAVICON, optimize=True)
    print(f'✓ Wrote {FAVICON.relative_to(ROOT)}  ({FAVICON_SIZE}×{FAVICON_SIZE})')

    # ── 3. app/apple-icon.png — 180×180 iOS home-screen icon ──
    apple = square.copy().resize((APPLE_SIZE, APPLE_SIZE), Image.LANCZOS)
    apple.save(APPLE, optimize=True)
    print(f'✓ Wrote {APPLE.relative_to(ROOT)}  ({APPLE_SIZE}×{APPLE_SIZE})')

    # ── 4. PWA icons — referenced by app/manifest.ts for "Add to Home Screen" ──
    for size, dest in [(192, PWA_192), (512, PWA_512)]:
        scaled = square.copy().resize((size, size), Image.LANCZOS)
        scaled.save(dest, optimize=True)
        print(f'✓ Wrote {dest.relative_to(ROOT)}  ({size}×{size})')

    print('\nAll derivatives generated. Re-run this any time you replace logo.png.')

if __name__ == '__main__':
    main()
