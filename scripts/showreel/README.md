# Showreel pipeline

Adds videos to `/showreel`. One command from masters to a live gallery.

```bash
cd scripts/showreel
cp config.example.sh config.sh    # first time only
$EDITOR config.sh                 # paths + Dropbox token
source config.sh
./showreel.py all
```

Then commit `src/content/showreel.json` and `public/previews/`, and push.

## Adding new videos later

Drop them into a category folder under `SHOWREEL_SOURCE`, get a fresh Dropbox
token into `config.sh`, and run `./showreel.py all` again. Every stage skips
work already done, so only the new files are touched. A run with nothing new
takes seconds.

Check what's pending without changing anything:

```bash
./showreel.py status
```

Run single stages if you want to split the offline work from the network work:

```bash
./showreel.py compress previews     # no token needed
./showreel.py upload links manifest # needs a live token
```

## The stages

| Stage | Does | Needs token |
|---|---|---|
| `compress` | masters → web-ready MP4 | no |
| `previews` | web MP4 → 3s silent loop + poster, copied to `public/previews/` | no |
| `upload` | web MP4 → Dropbox, hash-verified | yes |
| `links` | creates public share links | yes |
| `manifest` | rebuilds `src/content/showreel.json` | no |

Categories come from the folder names under `SHOWREEL_SOURCE`. A file sitting
loose gets `SHOWREEL_DEFAULT_CATEGORY`. The category is baked into the
filename as `<title>_<Category>.mp4` and read back out from there.

## Things that will bite you

**Regenerate the token after changing scopes.** A Dropbox token carries the
scopes it was born with. Ticking new permissions does nothing for a token that
already exists — tick, press Submit, *then* generate. Getting this wrong looks
exactly like a broken script.

**This is a Business team space.** The team root is a different namespace from
the personal home folder. Every API call sends a `Dropbox-API-Path-Root`
header; without it the API sees only `/Apps` and reports your Dropbox as
empty. The namespace id lives in `config.sh`.

**TLS interception breaks Python but not curl.** Something on this machine
intercepts HTTPS. curl trusts it through the macOS keychain; Python's bundled
certifi does not, and dies with `CERTIFICATE_VERIFY_FAILED`. The script builds
a combined CA bundle (certifi + keychain roots) into `.ca-bundle.pem` on first
run rather than disabling verification. Delete that file to rebuild it.

**Don't run `npm run build` while `npm run dev` is live.** They share `.next`
and the dev server starts throwing 500s. `rm -rf .next` and restart.

**Hand-edited titles survive a rebuild.** `manifest` preserves `title` and
`category` on entries that already exist, so cleaning up an ugly export name in
`showreel.json` is safe. Only genuinely new entries get a derived title.

## Encoding, and why

**H.264, `yuv420p`, MP4.** The only combination every browser plays. H.265
would roughly halve the size but Chrome and Firefox won't stream it.

**CRF 23 with an 8 Mbps ceiling.** For Dropbox the ceiling matters more than
the quality target: Dropbox serves the raw file and the browser has to keep up.
Unbounded CRF 21 on the original set produced a 15 Mbps stream that was barely
smaller than the master and would stall on a normal connection.

**`-movflags +faststart`.** Moves the index to the head so playback starts
after a second or two instead of after the whole file downloads. Most videos
that "won't stream from Dropbox" are just missing this.

**Short side capped at 1080.** Capping the short side rather than the height
keeps 9:16 and 1:1 correct. Capping height would leave a 1080×1920 vertical
untouched while squashing a 1920×1920 square.

**Already-web-ready masters get remuxed, not re-encoded.** Re-encoding an
existing web export adds generation loss and can make it bigger — that happened
to 4 of the original 64, one growing 55%. A remux (`-c copy`) keeps the pixels
and still adds faststart. The one trap: a remux faithfully copies HEVC, so the
script re-encodes anything that isn't already H.264.

**Previews are silent looping MP4, not GIF.** Measured on one file, same 3
seconds: GIF 2281 KB vs MP4 105 KB — 142 MB vs 6 MB across 64 files, and the
GIF was half the frame rate at a quarter of the colour depth. They're sampled
20% into the video because frame 0 is usually a fade or a black hold.

## Streaming from Dropbox

Links are created as public share links and the site converts `?dl=0` to
`?raw=1` in `src/lib/videoEmbed.ts`. Verified: `206 Partial Content` on range
requests with `accept-ranges: bytes`, so seeking works. Dropbox mislabels the
content type as `application/json`, which would break a bare `<video>` tag but
is fine through OneLinePlayer.

Public share links have a daily bandwidth cap — 1 TB/day on Business. If the
gallery ever gets enough traffic to hit that, links start failing and the fix
is moving to Cloudflare Stream, Bunny or Mux.

## Requirements

`ffmpeg` and `ffprobe` on PATH (`brew install ffmpeg`). Python 3.9+, standard
library only — `certifi` is used if present but isn't required.
