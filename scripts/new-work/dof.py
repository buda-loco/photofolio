"""Apply a tilted depth-of-field to a flat render.

Doing the blur last, over the finished composite, is what makes a paste
undetectable in the soft areas: the artwork and the render around it are blurred
by the same kernel at the same radius, so there is no edge left to see.
"""
import cv2, numpy as np


def tilted_dof(src, dst, near, far, focus=0.42, width=0.0, max_far=46,
               max_near=30, levels=9, gamma=2.2):
    img = cv2.imread(src).astype(np.float32) / 255.0
    h, w = img.shape[:2]
    near = np.array(near, np.float32); far = np.array(far, np.float32)
    axis = far - near
    L = np.linalg.norm(axis); axis /= L

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = ((xx - near[0]) * axis[0] + (yy - near[1]) * axis[1]) / L   # 0 near, 1 far
    d = np.clip(d, -0.35, 1.5)

    # circle of confusion grows either side of the focal plane; the far side
    # goes softer than the near side, as a real lens does
    # `width` is the slab of depth that stays sharp. Without it the sharp zone
    # is a single plane and only one logo survives.
    dev = np.abs(d - focus) - width
    dev = np.maximum(dev, 0.0)
    coc = np.where(d >= focus,
                   dev / max(1e-6, (1.5 - focus - width)) * max_far,
                   dev / max(1e-6, (focus + 0.35 - width)) * max_near)
    coc = cv2.GaussianBlur(coc, (0, 0), 25)

    # blur in linear light or the bokeh dirties the highlights
    lin = np.power(img, gamma)
    radii = np.linspace(0, max(max_far, max_near), levels)
    stack = [lin if r < 0.5 else cv2.GaussianBlur(lin, (0, 0), r) for r in radii]

    out = np.zeros_like(lin)
    for i in range(levels - 1):
        lo, hi = radii[i], radii[i + 1]
        t = np.clip((coc - lo) / (hi - lo), 0, 1)[..., None]
        band = ((coc >= lo) & (coc < hi))[..., None]
        out += band * (stack[i] * (1 - t) + stack[i + 1] * t)
    out += (coc >= radii[-1])[..., None] * stack[-1]

    out = np.power(np.clip(out, 0, 1), 1 / gamma)
    cv2.imwrite(dst, (out * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 96])
    print(f'dof -> {dst}  coc {coc.min():.1f}–{coc.max():.1f}px, '
          f'{(coc < 2).mean():.0%} of frame sharp')
