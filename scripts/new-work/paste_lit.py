"""Composite artwork onto a *lit* colour plate, carrying the plate's shading.

A flat plate carries no light, so the pasted artwork comes out evenly lit while
the render around it has dapple and falloff — and that step reads as a visible
rectangle. Asking the generator to shade the plate turns it into a light map:
divide out the plate's own colour and what is left is the scene's illumination,
which then multiplies onto the real page.
"""
import cv2, numpy as np, sys
from warp import PLATES


def _plate(img, plate):
    lo, hi = PLATES[plate]
    lo = (lo[0], 60, 25)                       # loose V: the plate is shaded now
    m = cv2.inRange(cv2.cvtColor(img, cv2.COLOR_BGR2HSV),
                    np.array(lo, np.uint8), np.array(hi, np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    cnt = max(cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0],
              key=cv2.contourArea)
    ap = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
    if len(ap) != 4:
        ap = cv2.boxPoints(cv2.minAreaRect(cnt)).reshape(-1, 1, 2)
    p = ap.reshape(-1, 2).astype(np.float32)
    # Order the corners by angle around the centroid, not by x+y / x-y sums.
    # When the plate runs off the frame edge its corners sit on that edge and
    # the sum/diff heuristic assigns the same point twice, giving a degenerate
    # quad and a transform that throws the artwork away.
    c = p.mean(0)
    ang = np.arctan2(p[:, 1] - c[1], p[:, 0] - c[0])
    p = p[np.argsort(ang)]
    start = int(np.argmin(p.sum(1)))                  # begin at the top-left-most
    quad = np.roll(p, -start, axis=0).astype(np.float32)
    assert len(np.unique(quad, axis=0)) == 4, 'degenerate plate quad'
    return quad, cnt, m


def paste_lit(target, source, plate, out, grow=13, feather=2.2,
              floor=0.30, cool=0.055):
    img = cv2.imread(target).astype(np.float32)
    src = cv2.imread(source)
    h, w = img.shape[:2]; sh, sw = src.shape[:2]
    quad, cnt, raw = _plate(img.astype(np.uint8), plate)

    # shading = how dark this pixel is relative to the plate in full sun
    v = img.max(axis=2)
    inside = raw > 0
    lit = np.percentile(v[inside], 97)
    shade = np.clip(v / max(lit, 1.0), floor, 1.06)
    shade = cv2.GaussianBlur(shade, (0, 0), 2.0)

    M = cv2.getPerspectiveTransform(
        np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), quad)
    art = cv2.warpPerspective(src, M, (w, h), flags=cv2.INTER_LANCZOS4,
                              borderMode=cv2.BORDER_REPLICATE).astype(np.float32)

    # White-balance the artwork's paper to the render's own paper, sampled from
    # the cream ring just outside the plate and un-shaded first. Without this a
    # faint tone step survives the shading and still draws a rectangle.
    ring = cv2.dilate(raw, np.ones((41, 41), np.uint8)) & ~cv2.dilate(raw, np.ones((11, 11), np.uint8))
    if ring.sum() > 0:
        # keep only the lit half of the ring, but never let the intersection
        # empty out — an empty ring produced NaN and wrote a corrupt file
        lit_ring = ring & ((v > np.percentile(v[ring > 0], 55)).astype(np.uint8) * 255)
        if lit_ring.sum() > 5000:
            ring = lit_ring
    if ring.sum() > 5000:
        sh_ring = np.clip(shade[ring > 0], 0.35, 1.2)
        target = np.array([np.median(img[..., c][ring > 0] / sh_ring) for c in range(3)])
        bright = art.max(axis=2) > np.percentile(art.max(axis=2), 82)
        srcpap = np.array([np.median(art[..., c][bright]) for c in range(3)])
        gain = np.clip(target / np.maximum(srcpap, 1.0), 0.80, 1.25)
        # a NaN here silently wrote a corrupt file; skip the match rather than
        # multiply the artwork by nothing
        if np.isfinite(gain).all():
            art = np.clip(art * gain, 0, 255)
        else:
            print('  paper match skipped (no usable ring)')

    art *= shade[..., None]
    # shade outdoors is lit by sky, so it cools as it darkens
    tint = np.stack([1 + cool * (1 - shade), np.ones_like(shade),
                     1 - cool * (1 - shade)], axis=2)
    art = np.nan_to_num(np.clip(art * tint, 0, 255), nan=0.0)

    mask = np.zeros((h, w), np.uint8)
    cv2.drawContours(mask, [cnt], -1, 255, -1)
    mask = cv2.dilate(mask, np.ones((grow, grow), np.uint8))
    mask = cv2.GaussianBlur(mask, (0, 0), feather)
    a = (mask.astype(np.float32) / 255)[..., None]
    cv2.imwrite(out, (art * a + img * (1 - a)).astype(np.uint8))
    print(f'{plate}: lit ref {lit:.0f}, shading {shade[inside].min():.2f}'
          f'–{shade[inside].max():.2f} -> {out}')


if __name__ == '__main__':
    import shutil
    shutil.copy('gen/bm-plate3.png', 'fix/bm4.png')
    paste_lit('fix/bm4.png', 'up/bm-left.jpg',  'magenta', 'fix/bm4.png')
    paste_lit('fix/bm4.png', 'up/bm-right.jpg', 'green',   'fix/bm4.png')
    cv2.imwrite('fix/brand-manual3.jpg', cv2.imread('fix/bm4.png'),
                [cv2.IMWRITE_JPEG_QUALITY, 96])
