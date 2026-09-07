# -*- coding: utf-8 -*-
"""Natural Earth 110m (public domain) → SVG-пути стран для админки (src/admin/worldPaths.ts).

Запуск:
    curl -sL -o ne110.geojson \\
      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
    python3 scripts/genmap.py && mv worldPaths.ts src/admin/worldPaths.ts

Равнопромежуточная проекция, viewBox обрезан по широтам 84…-56 (как на обычных
картах — без гигантской Антарктиды). Точки прорежены (Дуглас–Пекер) и округлены."""
import json, math

W, H = 1000.0, 500.0          # полная равнопромежуточная сетка
LAT_TOP, LAT_BOTTOM = 84.0, -56.0
EPS = 0.35                     # допуск упрощения, в единицах viewBox
MIN_AREA = 0.8                 # выкидываем совсем мелкие острова (px²)

def project(lon, lat):
    return ((lon + 180.0) / 360.0 * W, (90.0 - lat) / 180.0 * H)

def simplify(pts, eps):
    if len(pts) < 3: return pts
    # Дуглас–Пекер, итеративно (без рекурсии — некоторые кольца длинные)
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        den = math.hypot(dx, dy)
        best, bi = -1.0, -1
        for i in range(a + 1, b):
            x, y = pts[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / den if den else math.hypot(x - x1, y - y1)
            if d > best: best, bi = d, i
        if best > eps:
            keep[bi] = True
            stack.append((a, bi)); stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]

def ring_area(pts):
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2.0

def ring_to_path(ring):
    pts = [project(c[0], c[1]) for c in ring]
    pts = simplify(pts, EPS)
    if len(pts) < 4 or ring_area(pts) < MIN_AREA: return None
    d = 'M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    return d.replace('M', 'M', 1)

gj = json.load(open('ne110.geojson'))
out = []
for feat in gj['features']:
    p = feat['properties']
    iso = (p.get('ISO_A2_EH') or p.get('ISO_A2') or '-99').strip().upper()
    if iso in ('-99', '', 'AQ'):   # без Антарктиды и без стран без кода
        continue
    geom = feat['geometry']
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    parts = []
    for poly in polys:
        for ring in poly:          # включая дырки — заливка evenodd
            d = ring_to_path(ring)
            if d: parts.append(d)
    if not parts: continue
    out.append({
        'c': iso,
        'n': {'ru': p.get('NAME_RU') or p.get('NAME_EN') or iso,
              'en': p.get('NAME_EN') or p.get('NAME') or iso,
              'pl': p.get('NAME_PL') or p.get('NAME_EN') or iso},
        'd': ' '.join(parts),
    })

y_top, y_bottom = (90 - LAT_TOP) / 180 * H, (90 - LAT_BOTTOM) / 180 * H
head = f"""// Сгенерировано из Natural Earth 110m (public domain) скриптом genmap.py.
// Равнопромежуточная проекция, viewBox обрезан по широтам {LAT_TOP}…{LAT_BOTTOM}.
// Правится НЕ руками — перегенерировать скриптом.
export const MAP_VIEWBOX = '0 {y_top:.0f} {W:.0f} {y_bottom - y_top:.0f}'
export interface CountryShape {{ c: string; n: Record<string, string>; d: string }}
export const WORLD: CountryShape[] = """
body = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
open('worldPaths.ts', 'w').write(head + body + '\n')
print('стран:', len(out), 'размер:', round(len(body) / 1024), 'КБ')
