# Copy to config.sh and edit. config.sh is gitignored — it holds the token.
#   cp config.example.sh config.sh && $EDITOR config.sh
# Then:  source config.sh && ./showreel.py all

# Masters. Subfolder name = category. Loose files get SHOWREEL_DEFAULT_CATEGORY.
export SHOWREEL_SOURCE="/Volumes/DJ BUDA/Video porfolio"

# Web-ready MP4s (flat, named "<title>_<Category>.mp4").
export SHOWREEL_COMPRESSED="/Volumes/DJ BUDA/Video porfolio/Compressed"

# Preview MP4s + poster JPGs. Copied into public/previews/ automatically.
export SHOWREEL_PREVIEWS="/Volumes/DJ BUDA/Video porfolio/Previews"

export SHOWREEL_DEFAULT_CATEGORY="Client Work"

# ── Dropbox ───────────────────────────────────────────────────────────────
export SHOWREEL_DROPBOX_DEST="/Benjamin Arnedo/2026/Benjamin Arnedo/Showreel"

# Team-space namespace id. This account is Dropbox Business: the team root is
# separate from the personal home namespace, and without this the API only
# sees /Apps and looks empty. Find it with:
#   curl -s -X POST https://api.dropboxapi.com/2/users/get_current_account \
#     -H "Authorization: Bearer $DROPBOX_TOKEN" | python3 -m json.tool
# and read root_info.root_namespace_id.
export SHOWREEL_DROPBOX_ROOT_NS="2687205539"

# Short-lived token (~4h) from dropbox.com/developers/apps → your app →
# Settings → Generate. The app needs these four scopes on the Permissions tab:
#   files.metadata.read  files.content.write  sharing.read  sharing.write
# Tick them, press Submit, THEN generate — a token keeps the scopes it was
# born with and never picks up ones added later.
export DROPBOX_TOKEN="paste-here"

# ── Encoding (defaults are fine; override only if you know why) ───────────
# export SHOWREEL_CRF=23
# export SHOWREEL_MAXRATE=8M
# export SHOWREEL_BUFSIZE=16M
