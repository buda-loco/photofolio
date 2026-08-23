#!/usr/bin/env python3
"""
Showreel pipeline — add videos to /showreel end to end.

    compress  masters            -> web-ready MP4 (H.264, faststart, 8 Mbps cap)
    previews  web MP4            -> 3s silent looping preview + poster JPG
    upload    web MP4            -> Dropbox (hash-verified, resumable)
    links     Dropbox            -> public share links
    manifest  everything         -> src/content/showreel.json
    all       run the lot in order

Every stage is INCREMENTAL and safe to re-run: work already done is skipped.
Nothing is ever overwritten in place without a hash or size check first.

Usage:
    ./showreel.py all
    ./showreel.py compress previews          # offline stages only
    ./showreel.py status                     # what's done, what's pending

Config lives in config.sh (copy config.example.sh). See README.md.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

# ── Config ────────────────────────────────────────────────────────────────

def env(name, default=None, required=False):
    v = os.environ.get(name, default)
    if required and not v:
        sys.exit(f"error: {name} is not set — see scripts/showreel/README.md")
    return v

HERE       = os.path.dirname(os.path.abspath(__file__))
SITE       = os.path.abspath(os.path.join(HERE, "..", ".."))

SOURCE     = env("SHOWREEL_SOURCE")            # folders of masters (categories)
COMPRESSED = env("SHOWREEL_COMPRESSED")        # flat web-ready MP4s
PREVIEWS   = env("SHOWREEL_PREVIEWS")          # preview MP4 + poster JPG
PUBLIC     = os.path.join(SITE, "public", "previews")
MANIFEST   = os.path.join(SITE, "src", "content", "showreel.json")

DBX_DEST   = env("SHOWREEL_DROPBOX_DEST", "/Benjamin Arnedo/2026/Benjamin Arnedo/Showreel")
DBX_ROOT   = env("SHOWREEL_DROPBOX_ROOT_NS", "2687205539")
DBX_TOKEN  = env("DROPBOX_TOKEN")

# Category for masters sitting loose in SOURCE rather than in a subfolder.
DEFAULT_CATEGORY = env("SHOWREEL_DEFAULT_CATEGORY", "Client Work")

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".avi", ".mkv"}

# ── Encoding settings ─────────────────────────────────────────────────────
# CRF 23 with an 8 Mbps ceiling. For Dropbox the CEILING matters more than the
# quality target: Dropbox serves the raw file and the browser has to keep up,
# so an unbounded 15 Mbps stream stalls on a normal connection.
CRF        = env("SHOWREEL_CRF", "23")
MAXRATE    = env("SHOWREEL_MAXRATE", "8M")
BUFSIZE    = env("SHOWREEL_BUFSIZE", "16M")

# Cap the SHORT side at 1080. Doing it by short side (not height) keeps 9:16
# and 1:1 correct — capping height would leave a 1080x1920 vertical untouched
# while squashing a 1920x1920 square.
SCALE = ("scale='if(gt(iw,ih),-2,min(iw,1080))':"
         "'if(gt(iw,ih),min(ih,1080),-2)':flags=lanczos")

# Keyframe every 2s (48 frames @24fps), closed GOP — makes scrubbing responsive.
X264_PARAMS = "keyint=48:min-keyint=48:scenecut=0"

PREVIEW_SECONDS  = 3
PREVIEW_LONGEDGE = 640
PREVIEW_CRF      = "30"
# Sample this far into the video. Frame 0 is usually a fade or a black hold.
PREVIEW_AT       = 0.20

CHUNK      = 8 * 1024 * 1024
SIMPLE_MAX = 100 * 1024 * 1024      # Dropbox single-shot upload limit is 150MB

# ── Small helpers ─────────────────────────────────────────────────────────

def log(msg):
    print(msg, flush=True)

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def probe(path):
    """width, height, duration, codec, pix_fmt, bitrate — or None if unreadable."""
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height,codec_name,pix_fmt",
             "-show_entries", "format=duration,bit_rate", "-of", "json", path])
    if r.returncode:
        return None
    try:
        d = json.loads(r.stdout)
        s = d["streams"][0]
        return {
            "w": s["width"], "h": s["height"],
            "codec": s.get("codec_name"), "pix_fmt": s.get("pix_fmt"),
            "duration": float(d["format"].get("duration") or 0),
            "bitrate": int(d["format"].get("bit_rate") or 0),
        }
    except (KeyError, IndexError, ValueError):
        return None

def slugify(s):
    s = re.sub(r"[’'`]", "", s.lower())
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", s).strip("-"))

def slug_map():
    """
    {compressed filename: slug} for every web file, deduped.

    Two different videos can slug identically — "Winter in the City Promo"
    (Shortform) and "Winter in the city Promo" (Client Work) differ only by
    case. Collisions get -2, -3 … in sorted filename order.

    Every stage MUST derive slugs from here rather than calling slugify()
    directly, or previews, links and the manifest end up disagreeing about
    which file a slug refers to.
    """
    out, seen = {}, {}
    for name in sorted(f for f in os.listdir(COMPRESSED)
                       if f.endswith(".mp4") and not f.startswith(".")):
        base = slugify(name[:-4].rsplit("_", 1)[0])
        seen[base] = seen.get(base, 0) + 1
        out[name] = base if seen[base] == 1 else f"{base}-{seen[base]}"
    return out

def has_faststart(path):
    with open(path, "rb") as f:
        return b"moov" in f.read(4096)

def orientation_of(w, h):
    return "vertical" if h > w else "square" if h == w else "landscape"

def iter_masters():
    """(source_path, category, output_name) for every master under SOURCE."""
    if not SOURCE or not os.path.isdir(SOURCE):
        sys.exit(f"error: SHOWREEL_SOURCE not a directory: {SOURCE}")
    skip = {os.path.basename(p) for p in (COMPRESSED or "", PREVIEWS or "") if p}
    out = []
    for entry in sorted(os.listdir(SOURCE)):
        if entry.startswith("."):
            continue
        p = os.path.join(SOURCE, entry)
        if os.path.isdir(p):
            if entry in skip:
                continue
            for f in sorted(os.listdir(p)):
                if f.startswith(".") or os.path.splitext(f)[1].lower() not in VIDEO_EXT:
                    continue
                out.append((os.path.join(p, f), entry,
                            f"{os.path.splitext(f)[0]}_{entry}.mp4"))
        elif os.path.splitext(entry)[1].lower() in VIDEO_EXT:
            out.append((p, DEFAULT_CATEGORY,
                        f"{os.path.splitext(entry)[0]}_{DEFAULT_CATEGORY}.mp4"))
    return out

# ── Stage: compress ───────────────────────────────────────────────────────

def encode(src, dest):
    return run(["ffmpeg", "-nostdin", "-v", "error", "-i", src,
                "-c:v", "libx264", "-profile:v", "high", "-level:v", "4.0",
                "-preset", "slow", "-crf", CRF, "-pix_fmt", "yuv420p",
                "-maxrate", MAXRATE, "-bufsize", BUFSIZE,
                "-vf", SCALE, "-x264-params", X264_PARAMS,
                "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
                "-movflags", "+faststart", "-y", dest])

def remux(src, dest):
    """Repackage without touching pixels — adds faststart, no generation loss."""
    return run(["ffmpeg", "-nostdin", "-v", "error", "-i", src,
                "-c", "copy", "-movflags", "+faststart", "-y", dest])

def stage_compress():
    os.makedirs(COMPRESSED, exist_ok=True)
    items = iter_masters()
    log(f"compress: {len(items)} masters found")
    done = skipped = failed = 0

    for i, (src, _cat, name) in enumerate(items, 1):
        dest = os.path.join(COMPRESSED, name)
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            skipped += 1
            continue

        info = probe(src)
        if not info:
            log(f"  [{i}/{len(items)}] FAIL unreadable: {name}")
            failed += 1
            continue

        # An already-web-ready master only needs repackaging. Re-encoding it
        # adds generation loss and can make the file BIGGER — that happened to
        # 4 of the original 64.
        already_ok = (
            info["codec"] == "h264" and info["pix_fmt"] == "yuv420p"
            and min(info["w"], info["h"]) <= 1080
            and 0 < info["bitrate"] <= 9_000_000
        )

        t0 = time.time()
        if already_ok:
            r = remux(src, dest)
            how = "remux"
        else:
            r = encode(src, dest)
            how = "encode"
            # If the encode didn't actually save anything, prefer the original
            # pixels — but ONLY when the source codec plays in every browser.
            # A remux faithfully copies HEVC, which Chrome and Firefox won't play.
            if (r.returncode == 0 and os.path.exists(dest)
                    and os.path.getsize(dest) >= os.path.getsize(src) * 0.85
                    and info["codec"] == "h264" and info["pix_fmt"] == "yuv420p"):
                r2 = remux(src, dest)
                if r2.returncode == 0:
                    how = "encode->remux (no saving)"

        if r.returncode or not os.path.exists(dest) or os.path.getsize(dest) == 0:
            log(f"  [{i}/{len(items)}] FAIL {name}: {r.stderr[:120]}")
            failed += 1
            if os.path.exists(dest):
                os.remove(dest)
            continue

        # Guard the browser-compat invariant no matter which path we took.
        out = probe(dest)
        if not out or out["codec"] != "h264" or not has_faststart(dest):
            log(f"  [{i}/{len(items)}] re-encoding {name} (not h264/faststart after {how})")
            if encode(src, dest).returncode:
                failed += 1
                continue

        o, n = os.path.getsize(src), os.path.getsize(dest)
        log(f"  [{i}/{len(items)}] {o//2**20}MB -> {n//2**20}MB "
            f"({time.time()-t0:.0f}s, {how})  {name}")
        done += 1

    log(f"compress: {done} new, {skipped} already done, {failed} failed")
    return failed

# ── Stage: previews ───────────────────────────────────────────────────────

def stage_previews():
    os.makedirs(PREVIEWS, exist_ok=True)
    os.makedirs(PUBLIC, exist_ok=True)
    slugs = slug_map()
    files = sorted(slugs)
    log(f"previews: {len(files)} web files")
    done = skipped = failed = 0
    vf = (f"scale='if(gt(iw,ih),{PREVIEW_LONGEDGE},-2)':"
          f"'if(gt(iw,ih),-2,{PREVIEW_LONGEDGE})':flags=lanczos")

    for i, name in enumerate(files, 1):
        src  = os.path.join(COMPRESSED, name)
        slug = slugs[name]
        mp4  = os.path.join(PREVIEWS, slug + ".mp4")
        jpg  = os.path.join(PREVIEWS, slug + ".jpg")

        if os.path.exists(mp4) and os.path.exists(jpg):
            skipped += 1
        else:
            info = probe(src)
            if not info:
                failed += 1
                continue
            dur   = info["duration"]
            start = 0.0 if dur < 5 else round(dur * PREVIEW_AT, 2)
            clip  = min(PREVIEW_SECONDS, max(1.0, dur - start))
            r1 = run(["ffmpeg", "-nostdin", "-v", "error", "-ss", str(start),
                      "-t", str(clip), "-i", src, "-an", "-vf", f"fps=24,{vf}",
                      "-c:v", "libx264", "-profile:v", "main", "-crf", PREVIEW_CRF,
                      "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", mp4])
            r2 = run(["ffmpeg", "-nostdin", "-v", "error", "-ss", str(start),
                      "-i", src, "-frames:v", "1", "-vf", vf, "-q:v", "4", "-y", jpg])
            if r1.returncode or r2.returncode:
                log(f"  [{i}/{len(files)}] FAIL {slug}")
                failed += 1
                continue
            log(f"  [{i}/{len(files)}] {os.path.getsize(mp4)//1024}KB + "
                f"{os.path.getsize(jpg)//1024}KB  {slug}")
            done += 1

        # Keep public/ in step with the preview store.
        for ext in (".mp4", ".jpg"):
            s, d = os.path.join(PREVIEWS, slug + ext), os.path.join(PUBLIC, slug + ext)
            if not os.path.exists(d) or os.path.getmtime(s) > os.path.getmtime(d):
                with open(s, "rb") as fs, open(d, "wb") as fd:
                    fd.write(fs.read())

    log(f"previews: {done} new, {skipped} already done, {failed} failed")
    return failed

# ── Dropbox ───────────────────────────────────────────────────────────────

def ca_bundle():
    """
    Some machines run TLS interception (corporate proxy / security software).
    curl trusts it via the macOS keychain; Python's bundled certifi does not,
    and fails with CERTIFICATE_VERIFY_FAILED. Build a combined bundle rather
    than disabling verification. Cached next to this script.
    """
    out = os.path.join(HERE, ".ca-bundle.pem")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return out
    try:
        import certifi
        data = open(certifi.where(), "rb").read()
    except ImportError:
        data = b""
    if sys.platform == "darwin":
        for kc in ("/Library/Keychains/System.keychain",
                   "/System/Library/Keychains/SystemRootCertificates.keychain"):
            r = run(["security", "find-certificate", "-a", "-p", kc])
            if r.returncode == 0:
                data += r.stdout.encode()
    if not data:
        return None
    with open(out, "wb") as f:
        f.write(data)
    return out

def dbx(endpoint, arg, data=None, content=False, retries=5):
    host = "content" if content else "api"
    url = f"https://{host}.dropboxapi.com/2/{endpoint}"
    ca = ca_bundle()
    import ssl
    ctx = ssl.create_default_context(cafile=ca) if ca else None
    for attempt in range(retries):
        req = urllib.request.Request(url, method="POST")
        req.add_header("Authorization", "Bearer " + DBX_TOKEN)
        req.add_header("Dropbox-API-Path-Root",
                       json.dumps({".tag": "root", "root": DBX_ROOT}))
        if content:
            req.add_header("Dropbox-API-Arg", json.dumps(arg))
            req.add_header("Content-Type", "application/octet-stream")
            req.data = data
        else:
            req.add_header("Content-Type", "application/json")
            req.data = json.dumps(arg).encode()
        try:
            with urllib.request.urlopen(req, timeout=300, context=ctx) as r:
                body = r.read().decode()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 409:
                return {"_conflict": body}
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"{e.code} {body[:200]}")
        except Exception:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
    raise RuntimeError("retries exhausted")

def content_hash(path):
    """Dropbox content hash: sha256 over the concatenated sha256 of 4MB blocks."""
    blocks = []
    with open(path, "rb") as f:
        while True:
            b = f.read(4 * 1024 * 1024)
            if not b:
                break
            blocks.append(hashlib.sha256(b).digest())
    return hashlib.sha256(b"".join(blocks)).hexdigest()

def dbx_list(path):
    out = {}
    try:
        res = dbx("files/list_folder", {"path": path, "limit": 2000})
    except RuntimeError:
        return out
    while True:
        for e in res.get("entries", []):
            if e[".tag"] == "file":
                out[e["name"]] = e.get("content_hash")
        if not res.get("has_more"):
            return out
        res = dbx("files/list_folder/continue", {"cursor": res["cursor"]})

def stage_upload():
    if not DBX_TOKEN:
        sys.exit("error: DROPBOX_TOKEN not set — see README.md")
    dbx("files/create_folder_v2", {"path": DBX_DEST, "autorename": False})
    existing = dbx_list(DBX_DEST)
    files = sorted(f for f in os.listdir(COMPRESSED)
                   if f.endswith(".mp4") and not f.startswith("."))
    log(f"upload: {len(files)} files, {len(existing)} already in Dropbox")
    done = skipped = failed = 0

    for i, name in enumerate(files, 1):
        path = os.path.join(COMPRESSED, name)
        size = os.path.getsize(path)
        try:
            local = content_hash(path)
            if existing.get(name) == local:
                skipped += 1
                continue
            t0 = time.time()
            commit = {"path": f"{DBX_DEST}/{name}", "mode": "overwrite",
                      "autorename": False, "mute": True}
            if size <= SIMPLE_MAX:
                with open(path, "rb") as f:
                    meta = dbx("files/upload", commit, data=f.read(), content=True)
            else:
                with open(path, "rb") as f:
                    first = f.read(CHUNK)
                    sess = dbx("files/upload_session/start", {"close": False},
                               data=first, content=True)
                    sid, off = sess["session_id"], len(first)
                    while True:
                        b = f.read(CHUNK)
                        if not b:
                            break
                        dbx("files/upload_session/append_v2",
                            {"cursor": {"session_id": sid, "offset": off}, "close": False},
                            data=b, content=True)
                        off += len(b)
                    meta = dbx("files/upload_session/finish",
                               {"cursor": {"session_id": sid, "offset": off},
                                "commit": commit}, data=b"", content=True)
            if meta.get("content_hash") != local:
                log(f"  [{i}/{len(files)}] HASH MISMATCH {name}")
                failed += 1
                continue
            el = time.time() - t0
            log(f"  [{i}/{len(files)}] {size//2**20}MB in {el:.0f}s "
                f"({size/2**20/max(el,0.1):.1f} MB/s) hash-ok  {name}")
            done += 1
        except Exception as e:
            log(f"  [{i}/{len(files)}] FAIL {name} :: {str(e)[:160]}")
            failed += 1

    log(f"upload: {done} new, {skipped} already there, {failed} failed")
    return failed

def stage_links():
    if not DBX_TOKEN:
        sys.exit("error: DROPBOX_TOKEN not set — see README.md")
    # NB: sharing/list_shared_links with a FOLDER path returns links for that
    # folder, not for the files inside it — so there's no useful bulk prefetch.
    # Ask per file: a 409 conflict means a link already exists, and we read it
    # back rather than making a second one.
    slugs = slug_map()
    remote = set(dbx_list(DBX_DEST))
    links, created, reused, missing = {}, 0, 0, []
    for name, slug in sorted(slugs.items()):
        if name not in remote:
            missing.append(name)
            continue
        r = dbx("sharing/create_shared_link_with_settings",
                {"path": f"{DBX_DEST}/{name}",
                 "settings": {"requested_visibility": "public",
                              "audience": "public", "access": "viewer"}})
        if "_conflict" in r:
            lr = dbx("sharing/list_shared_links", {"path": f"{DBX_DEST}/{name}"})
            url = lr["links"][0]["url"] if lr.get("links") else None
            reused += 1
        else:
            url = r.get("url")
            created += 1
        if url:
            links[slug] = url
    if missing:
        log(f"  not uploaded yet, skipped: {len(missing)}")
    log(f"links: {created} created, {reused} reused, {len(links)} total")

    with open(os.path.join(HERE, ".links.json"), "w") as f:
        json.dump(links, f, indent=2)
    return 0

# ── Stage: manifest ───────────────────────────────────────────────────────

def stage_manifest():
    """
    Rebuild showreel.json, PRESERVING hand-edited fields on existing entries.
    Titles get cleaned up by hand (typos, ugly export names) — a rebuild must
    never stomp them.
    """
    existing = {}
    if os.path.exists(MANIFEST):
        for it in json.load(open(MANIFEST)):
            existing[it["id"]] = it

    links_path = os.path.join(HERE, ".links.json")
    links = json.load(open(links_path)) if os.path.exists(links_path) else {}

    slugs = slug_map()
    items, added = [], 0
    for name, slug in sorted(slugs.items()):
        title, category = (name[:-4].rsplit("_", 1) + [DEFAULT_CATEGORY])[:2]
        info = probe(os.path.join(COMPRESSED, name))
        if not info:
            continue
        prev = existing.get(slug, {})
        if not prev:
            added += 1
        items.append({
            "id": slug,
            # Hand-edited title and category win over anything derived here.
            "title": prev.get("title") or re.sub(r"\s+", " ", title.replace("_", " ")).strip(),
            "category": prev.get("category") or category,
            "preview": f"/previews/{slug}.mp4",
            "poster":  f"/previews/{slug}.jpg",
            "width": info["w"], "height": info["h"],
            "aspect": f"{info['w']}/{info['h']}",
            "orientation": orientation_of(info["w"], info["h"]),
            "duration": round(info["duration"]),
            "dropboxUrl": links.get(slug) or prev.get("dropboxUrl", ""),
        })

    items.sort(key=lambda x: (x["category"], x["title"].lower()))
    with open(MANIFEST, "w") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    blank = [i["id"] for i in items if not i["dropboxUrl"]]
    log(f"manifest: {len(items)} entries ({added} new), "
        f"{len(items)-len(blank)} with a Dropbox link")
    if blank:
        log(f"  no link yet: {', '.join(blank[:8])}{' …' if len(blank) > 8 else ''}")
    return 0

# ── Stage: status ─────────────────────────────────────────────────────────

def stage_status():
    masters = iter_masters()
    comp = [f for f in os.listdir(COMPRESSED) if f.endswith(".mp4")] if os.path.isdir(COMPRESSED) else []
    prev = [f for f in os.listdir(PREVIEWS) if f.endswith(".mp4")] if os.path.isdir(PREVIEWS) else []
    pub  = [f for f in os.listdir(PUBLIC) if f.endswith(".mp4")] if os.path.isdir(PUBLIC) else []
    man  = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else []
    linked = sum(1 for i in man if i.get("dropboxUrl"))
    log(f"masters      {len(masters)}")
    log(f"compressed   {len(comp)}")
    log(f"previews     {len(prev)}   (public/: {len(pub)})")
    log(f"manifest     {len(man)}   with links: {linked}")
    if DBX_TOKEN:
        try:
            log(f"in Dropbox   {len(dbx_list(DBX_DEST))}")
        except Exception as e:
            log(f"in Dropbox   unavailable ({str(e)[:60]})")
    else:
        log("in Dropbox   (DROPBOX_TOKEN not set)")
    return 0

# ── Main ──────────────────────────────────────────────────────────────────

STAGES = {
    "compress": stage_compress,
    "previews": stage_previews,
    "upload":   stage_upload,
    "links":    stage_links,
    "manifest": stage_manifest,
    "status":   stage_status,
}
ALL = ["compress", "previews", "upload", "links", "manifest"]

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("stages", nargs="+",
                    help="one or more of: " + ", ".join(STAGES) + ", all")
    args = ap.parse_args()

    stages = ALL if "all" in args.stages else args.stages
    for s in stages:
        if s not in STAGES:
            sys.exit(f"unknown stage: {s}")

    for s in stages:
        log(f"\n── {s} " + "─" * (68 - len(s)))
        if STAGES[s]():
            sys.exit(f"\n{s} reported failures — stopping")
    log("\ndone")

if __name__ == "__main__":
    main()
