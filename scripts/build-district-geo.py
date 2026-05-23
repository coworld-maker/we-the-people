#!/usr/bin/env python3
"""
Build /public/data/us-cd-119.geojson from JeffreyBLewis's per-state
congressional-district-boundaries repo (v2.0.0+, 119th-Congress data).

Source repo: https://github.com/JeffreyBLewis/congressional-district-boundaries
License:     CC0 / public domain.

What this script does:
  1. Lists the GeoJson/ folder via the GitHub API.
  2. Selects only the per-state files whose name ends `_to_119.geojson`
     (the "current" 119th-Congress boundary for each state).
  3. Downloads each, drops the heavy historical metadata, keeps only the
     props the USPartyMap component needs (statefp, district, statename).
  4. Rounds all coordinates to 4 decimal places (~11 m precision —
     plenty for a nation-wide choropleth, cuts file size by ~60 %).
  5. Merges into a single FeatureCollection and writes
     public/data/us-cd-119.geojson (compact, no whitespace).

Run from project root:
    python3 scripts/build-district-geo.py

Re-run when a new Congress's data is published — bump the suffix
in CONGRESS / OUTPUT to e.g. _to_120 / us-cd-120.geojson.
"""
from __future__ import annotations
import json
import os
import sys
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from shapely.geometry import shape, mapping

CONGRESS = 119
SUFFIX   = f'_to_{CONGRESS}.geojson'
REPO     = 'JeffreyBLewis/congressional-district-boundaries'
API_LIST = f'https://api.github.com/repos/{REPO}/contents/GeoJson'
OUTPUT   = Path('public/data/us-cd-119.geojson')

KEEP_PROPS = ('statefp', 'district', 'statename')
# 3 decimals ≈ 110 m at the equator; the rendered map is ~960 px wide, so each
# screen pixel covers ~5 km. Storing more precision than that is pure waste.
PRECISION = 3
# Douglas-Peucker tolerance in degrees. 0.01° ≈ 1.1 km — coarse enough to
# strip coastline noise that the map can't render anyway, fine enough to
# preserve every recognizable district boundary.
SIMPLIFY_TOLERANCE = 0.01


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={'User-Agent': 'we-the-people-build/1.0'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode('utf-8'))


def round_coord(c, depth=0):
    """Recursively round numeric coordinates in a GeoJSON coordinates array."""
    if isinstance(c, list):
        return [round_coord(v, depth + 1) for v in c]
    if isinstance(c, float):
        return round(c, PRECISION)
    return c


def dedup_ring(ring):
    """Remove consecutive duplicate points from a linear ring (common after rounding)."""
    if not ring:
        return ring
    out = [ring[0]]
    for pt in ring[1:]:
        if pt != out[-1]:
            out.append(pt)
    # A ring is meaningful only if it has at least 4 points (3 unique + closure)
    return out if len(out) >= 4 else None


def clean_polygon(rings):
    """Apply dedup to every ring of a polygon; drop polygons with no outer ring."""
    cleaned = [r for r in (dedup_ring(r) for r in rings) if r]
    return cleaned if cleaned else None


def clean_geometry(geom):
    """Dedup all rings within a (Multi)Polygon. Returns None if nothing usable left."""
    t = geom['type']
    coords = geom['coordinates']
    if t == 'Polygon':
        new = clean_polygon(coords)
        if not new:
            return None
        return {'type': 'Polygon', 'coordinates': new}
    if t == 'MultiPolygon':
        polys = [p for p in (clean_polygon(p) for p in coords) if p]
        if not polys:
            return None
        return {'type': 'MultiPolygon', 'coordinates': polys}
    return geom  # untouched for other geometry types


def slim_feature(f: dict) -> dict | None:
    """Return a slimmed-down feature, or None if it has no usable geometry."""
    geom = f.get('geometry')
    if not geom or not geom.get('coordinates'):
        return None
    props = f.get('properties') or {}
    # Pipeline: Douglas-Peucker simplify → round → dedup
    try:
        simplified = shape(geom).simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
        if simplified.is_empty:
            return None
        geom = mapping(simplified)
    except Exception:
        # If shapely chokes on a degenerate feature, fall back to original
        pass
    rounded = {
        'type': geom['type'],
        'coordinates': round_coord(geom['coordinates']),
    }
    cleaned = clean_geometry(rounded)
    if not cleaned:
        return None
    return {
        'type': 'Feature',
        'properties': {k: props.get(k) for k in KEEP_PROPS},
        'geometry': cleaned,
    }


def main():
    print(f'Listing {API_LIST}…')
    files = fetch_json(API_LIST)
    state_files = [f for f in files if f['name'].endswith(SUFFIX)]
    print(f'Found {len(state_files)} state files matching *{SUFFIX}')

    if len(state_files) < 50:
        print(f'⚠️  Only {len(state_files)} files — expected ≥50. Some states may be missing.', file=sys.stderr)

    features: list[dict] = []
    skipped = 0

    def fetch_one(meta):
        try:
            data = fetch_json(meta['download_url'])
            return data
        except Exception as e:
            print(f'  ✗ {meta["name"]}: {e}', file=sys.stderr)
            return None

    # Parallel download (GitHub raw can sustain ~10 connections fine)
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_one, m): m for m in state_files}
        for fut in as_completed(futures):
            meta = futures[fut]
            data = fut.result()
            if not data:
                continue
            for f in data.get('features', []):
                slim = slim_feature(f)
                if slim:
                    features.append(slim)
                else:
                    skipped += 1
            print(f'  ✓ {meta["name"]}  ({len(data.get("features", []))} features)')

    print(f'\nTotal features: {len(features)}  (skipped: {skipped})')

    out = {'type': 'FeatureCollection', 'features': features}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # Compact JSON: no whitespace
    OUTPUT.write_text(json.dumps(out, separators=(',', ':')))
    size_mb = OUTPUT.stat().st_size / 1024 / 1024
    print(f'\n✓ Wrote {OUTPUT} ({size_mb:.2f} MB)')


if __name__ == '__main__':
    main()
