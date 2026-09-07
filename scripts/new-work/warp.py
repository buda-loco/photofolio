"""Warp a flat source image onto a quad in a target photo.

The generative model reproduces layout well but rewrites small text — it turned
a client's phone number into a different phone number. So the artwork gets
composited in from the real file rather than trusted from the render.
"""
import cv2, numpy as np, sys, json
from PIL import Image

def warp(target, source, quad, out, feather=3, match_light=True):
    tgt = cv2.imread(target); src = cv2.imread(source)
    h, w = tgt.shape[:2]; sh, sw = src.shape[:2]
    dst = np.float32(quad)
    M = cv2.getPerspectiveTransform(np.float32([[0,0],[sw,0],[sw,sh],[0,sh]]), dst)
    warped = cv2.warpPerspective(src, M, (w,h), flags=cv2.INTER_LANCZOS4)
    mask = np.zeros((h,w), np.uint8)
    cv2.fillConvexPoly(mask, dst.astype(np.int32), 255)
    if feather: mask = cv2.GaussianBlur(mask, (0,0), feather)
    if match_light:
        # borrow the render's shading so the pasted artwork sits in the same light
        m3 = (mask>128).astype(np.uint8)
        if m3.sum() > 0:
            tl = cv2.cvtColor(tgt, cv2.COLOR_BGR2LAB)[:,:,0][m3==1].mean()
            wl = cv2.cvtColor(warped, cv2.COLOR_BGR2LAB)[:,:,0][m3==1].mean()
            gain = float(np.clip(tl/max(wl,1), 0.65, 1.5))
            warped = np.clip(warped.astype(np.float32)*gain, 0, 255).astype(np.uint8)
    a = (mask.astype(np.float32)/255.0)[...,None]
    comp = (warped.astype(np.float32)*a + tgt.astype(np.float32)*(1-a)).astype(np.uint8)
    cv2.imwrite(out, comp, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print('wrote', out)

if __name__ == '__main__':
    cfg = json.loads(sys.argv[1])
    warp(cfg['target'], cfg['source'], cfg['quad'], cfg['out'],
         cfg.get('feather',3), cfg.get('match_light',True))


PLATES = {           # HSV ranges for the flat placeholder colours we ask for
    'magenta': ((140, 90, 90), (170, 255, 255)),
    'green':   (( 40, 90, 90), ( 85, 255, 255)),
    'cyan':    (( 85, 90, 90), (105, 255, 255)),
    'yellow':  (( 20, 90, 90), ( 35, 255, 255)),
}


def find_placeholder(path, lo=(140, 90, 90), hi=(170, 255, 255), plate=None):
    """Find the corners of a flat magenta placeholder rectangle.

    The model is asked to render the screen (or any artwork panel) as flat
    #FF00FF and never sees the real artwork. Detecting that block by hue beats
    reading corners off a grid by hand, and it cannot drift.
    Returns corners ordered TL, TR, BR, BL.
    """
    if plate:
        lo, hi = PLATES[plate]
    img = cv2.imread(path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array(lo, np.uint8), np.array(hi, np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        raise SystemExit('no magenta placeholder found')
    c = max(cnts, key=cv2.contourArea)
    peri = cv2.arcLength(c, True)
    for eps in (0.02, 0.03, 0.05, 0.08):
        ap = cv2.approxPolyDP(c, eps * peri, True)
        if len(ap) == 4:
            pts = ap.reshape(4, 2).astype(np.float32)
            break
    else:
        pts = cv2.boxPoints(cv2.minAreaRect(c)).astype(np.float32)
    s = pts.sum(1); d = np.diff(pts, axis=1).ravel()
    quad = [pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]]
    return [[float(x), float(y)] for x, y in quad], float(cv2.contourArea(c))


def scrub_plates(path, out=None, sat=110, val=90, dilate=3):
    """Inpaint any placeholder colour left showing at the edge of a paste.

    A warp that lands a pixel or two short leaves a bright fringe, which is far
    more obvious than the crop you would lose by expanding. Cheaper to clean up
    after than to fit the quad perfectly.
    """
    img = cv2.imread(path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    m = np.zeros(hsv.shape[:2], np.uint8)
    for lo, hi in PLATES.values():
        lo = (lo[0], max(lo[1], sat), max(lo[2], val))
        m |= cv2.inRange(hsv, np.array(lo, np.uint8), np.array(hi, np.uint8))
    if m.sum() == 0:
        print('no plate residue'); return
    m = cv2.dilate(m, np.ones((dilate, dilate), np.uint8))
    fixed = cv2.inpaint(img, m, 4, cv2.INPAINT_TELEA)
    cv2.imwrite(out or path, fixed, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f'scrubbed {int(m.sum()/255)} residual plate px -> {out or path}')


def paste_plate(target, source, plate, out, grow=13, feather=2.2):
    """Composite artwork onto a coloured placeholder, edge transition included.

    Two things the naive version got wrong, both visible as border artifacts:
    the 4-point fit misses a page's slight curve, so alpha comes from the plate's
    real contour; and the plate's own dark edge transition sits just outside it,
    so the mask is grown past that band rather than landing exactly on the colour.

    Ask the generator to inset the plate inside natural paper or bezel. A plate
    that runs to the physical edge leaves coloured thickness nothing can cover.
    """
    img = cv2.imread(target); src = cv2.imread(source)
    h, w = img.shape[:2]; sh, sw = src.shape[:2]
    lo, hi = PLATES[plate]
    m = cv2.inRange(cv2.cvtColor(img, cv2.COLOR_BGR2HSV),
                    np.array(lo, np.uint8), np.array(hi, np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnt = max(cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0],
              key=cv2.contourArea)
    ap = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
    if len(ap) != 4:
        ap = cv2.boxPoints(cv2.minAreaRect(cnt)).reshape(-1, 1, 2)
    pts = ap.reshape(-1, 2).astype(np.float32)
    s_, d_ = pts.sum(1), np.diff(pts, axis=1).ravel()
    quad = np.float32([pts[np.argmin(s_)], pts[np.argmin(d_)],
                       pts[np.argmax(s_)], pts[np.argmax(d_)]])
    M = cv2.getPerspectiveTransform(
        np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), quad)
    warped = cv2.warpPerspective(src, M, (w, h), flags=cv2.INTER_LANCZOS4,
                                 borderMode=cv2.BORDER_REPLICATE)
    mask = np.zeros((h, w), np.uint8)
    cv2.drawContours(mask, [cnt], -1, 255, -1)
    mask = cv2.dilate(mask, np.ones((grow, grow), np.uint8))
    mask = cv2.GaussianBlur(mask, (0, 0), feather)
    a = (mask.astype(np.float32) / 255)[..., None]
    cv2.imwrite(out, (warped * a + img * (1 - a)).astype(np.uint8))
    print(f'pasted {plate} -> {out}')
