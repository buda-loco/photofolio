"""Cast a procedural foliage gobo over a composited mockup.

Sending the image back to a generative model to "add dappled light" would let it
redraw the artwork, which is the one thing we never allow. This darkens pixels
instead, so every glyph on the page survives untouched.
"""
import numpy as np, cv2
from PIL import Image


def _octave(h, w, res, rng):
    small = rng.random((res, max(2, int(res * w / h))))
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)


def foliage_mask(h, w, seed=7, octaves=(3, 6, 12, 26), coverage=0.46):
    """1.0 = full sun, 0.0 = deepest leaf shadow."""
    rng = np.random.default_rng(seed)
    n = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
    for res in octaves:
        n += amp * _octave(h, w, res, rng); tot += amp; amp *= 0.55
    n /= tot
    n = (n - n.min()) / (np.ptp(n) + 1e-9)
    # Set the cut by percentile so `coverage` means what it says. Thresholding
    # against a fixed value put 91% of the frame in shade the first time, which
    # reads as flat underexposure rather than dapple.
    thr = np.percentile(n, coverage * 100.0)
    band = 0.055
    return np.clip((n - thr) / band + 0.5, 0, 1)


def apply_gobo(src, dst, seed=7, strength=0.30, angle=-18.0, scale=1.0,
               soft=(9, 41), cool=(1.00, 0.985, 0.94)):
    img = cv2.imread(src).astype(np.float32) / 255.0
    h, w = img.shape[:2]
    m = foliage_mask(int(h * scale), int(w * scale), seed)
    m = cv2.resize(m, (w, h))
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.15)
    m = cv2.warpAffine(m, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    # two blur radii: near leaves read crisper than the canopy behind them
    near = cv2.GaussianBlur(m, (0, 0), soft[0])
    far = cv2.GaussianBlur(m, (0, 0), soft[1])
    m = np.clip(0.45 * near + 0.55 * far, 0, 1)

    shade = 1.0 - strength * (1.0 - m)          # 1 in sun, <1 in shadow
    out = img * shade[..., None]
    # shadow is lit by blue sky, so it cools rather than just darkening
    tint = 1.0 + (np.array(cool[::-1], np.float32) - 1.0) * (1.0 - m)[..., None]
    out = np.clip(out * tint, 0, 1)
    cv2.imwrite(dst, (out * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f'gobo -> {dst}  strength {strength}  shadow covers '
          f'{(m < 0.5).mean():.0%} of frame')


if __name__ == '__main__':
    import sys
    apply_gobo(*sys.argv[1:3])
