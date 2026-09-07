
import sys, subprocess
from PIL import Image
Image.MAX_IMAGE_PIXELS=None

FPS, DUR = 60, 20.0
W = H = 1080
page = Image.open("scroll-page.png")
chrome = Image.open("scroll-chrome.png").convert("RGBA")
VW, VH, X, Y = 940, 740, 70, 234
MAXY = page.height - VH
NAVY = (0x14, 0x24, 0x36)

# A real person scrolls in flicks: a fast push that decelerates, then a beat to
# read, then another. One linear ramp reads like a machine panning.
FLICKS = 6
ACTIVE, PAUSE = 2.05, 1.28        # seconds; 6 * 3.33 = 20.0

def ease_out_cubic(x):
    return 1 - (1 - x) ** 3

def offset(t):
    span = ACTIVE + PAUSE
    i = min(int(t // span), FLICKS - 1)
    local = t - i * span
    frac = ease_out_cubic(min(local / ACTIVE, 1.0))
    start, end = i / FLICKS, (i + 1) / FLICKS
    return (start + (end - start) * frac) * MAXY

ff = subprocess.Popen([
    "ffmpeg", "-y", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-r", str(FPS), "website-scroll-1x1.mp4",
], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

n = int(DUR * FPS)
for f in range(n):
    y = int(round(offset(f / FPS)))
    frame = Image.new("RGB", (W, H), NAVY)
    frame.paste(page.crop((0, y, VW, y + VH)), (X, Y))
    frame.paste(chrome, (0, 0), chrome)
    frame.save(ff.stdin, "JPEG", quality=95)
    if f % 200 == 0:
        print(f"  {f}/{n}", file=sys.stderr)
ff.stdin.close()
ff.wait()
print("done", n, "frames")

