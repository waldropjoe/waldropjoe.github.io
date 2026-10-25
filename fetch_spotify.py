#!/usr/bin/env python3
"""
Pull Joe's listening from Spotify into listening.json.

Runs daily in GitHub Actions (.github/workflows/update-listening.yml).
Standard library only — nothing to install.

What it collects
  • Saved podcast episodes ("Your Episodes") that you've started or finished.
      finished          -> status 'done'
      partway through   -> status 'now'
      saved, not played -> skipped (that's a to-listen queue, not listening)
  • Saved audiobooks -> status 'done' (Spotify doesn't report audiobook progress;
      override with status 'now' in data.js if you're mid-book)

It never removes entries it has seen before, so the log keeps growing even
after you un-save something. If Spotify errors, the existing file is left as is.

Environment (set as GitHub repository secrets):
  SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
"""
import base64
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

TOKEN_URL = "https://accounts.spotify.com/api/token"
API = "https://api.spotify.com/v1"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "listening.json")
KEEP = 80  # newest entries to keep in the file


def access_token():
    cid = os.environ["SPOTIFY_CLIENT_ID"]
    secret = os.environ["SPOTIFY_CLIENT_SECRET"]
    refresh = os.environ["SPOTIFY_REFRESH_TOKEN"]
    body = urllib.parse.urlencode({"grant_type": "refresh_token", "refresh_token": refresh}).encode()
    auth = base64.b64encode(f"{cid}:{secret}".encode()).decode()
    req = urllib.request.Request(TOKEN_URL, data=body, headers={
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]


def get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def paged(path, token, limit=100):
    """Follow Spotify's `next` links until `limit` items are collected."""
    url = f"{API}{path}{'&' if '?' in path else '?'}limit=50"
    items = []
    while url and len(items) < limit:
        page = get(url, token)
        items.extend(page.get("items") or [])
        url = page.get("next")
    return items[:limit]


def pick_image(images):
    """The image closest to 300px wide (big enough for a cover tile, not wasteful)."""
    imgs = [i for i in (images or []) if i and i.get("url")]
    if not imgs:
        return ""
    return min(imgs, key=lambda i: abs((i.get("width") or 300) - 300))["url"]


def month(iso):
    return (iso or "")[:7]


def from_episodes(saved, today):
    out = []
    for item in saved:
        ep = item.get("episode") or {}
        if not ep.get("id"):
            continue
        rp = ep.get("resume_point") or {}
        if rp.get("fully_played"):
            status = "done"
        elif (rp.get("resume_position_ms") or 0) > 0:
            status = "now"
        else:
            continue  # saved but not started: skip
        out.append({
            "id": f"spotify:episode:{ep['id']}",
            "type": "podcast",
            "status": status,
            "title": ep.get("name") or "",
            "by": (ep.get("show") or {}).get("name") or "",
            "date": month(item.get("added_at")) or today,
            "link": (ep.get("external_urls") or {}).get("spotify") or f"https://open.spotify.com/episode/{ep['id']}",
            "cover": pick_image(ep.get("images") or (ep.get("show") or {}).get("images")),
            "source": "spotify",
        })
    return out


def from_audiobooks(saved, today):
    out = []
    for item in saved:
        book = item.get("audiobook") or item  # the API has returned both shapes
        if not book.get("id"):
            continue
        authors = ", ".join(a.get("name", "") for a in (book.get("authors") or []) if a.get("name"))
        out.append({
            "id": f"spotify:audiobook:{book['id']}",
            "type": "audiobook",
            "status": "done",
            "title": book.get("name") or "",
            "by": authors,
            "date": month(item.get("added_at")) or today,
            "link": (book.get("external_urls") or {}).get("spotify") or f"https://open.spotify.com/audiobook/{book['id']}",
            "cover": pick_image(book.get("images")),
            "source": "spotify",
        })
    return out


def merge(existing, fresh):
    """Keep everything seen before; refresh details of items Spotify still returns.
    An item's date is the first month we saw it, unless Spotify gives an added date."""
    by_id = {e["id"]: e for e in existing if isinstance(e, dict) and e.get("id")}
    for item in fresh:
        old = by_id.get(item["id"])
        if old and old.get("date") and item["date"] > old["date"]:
            item["date"] = old["date"]
        by_id[item["id"]] = {**(old or {}), **item}
    merged = sorted(by_id.values(), key=lambda e: (e.get("date") or "", e.get("status") == "now"), reverse=True)
    return merged[:KEEP]


def main():
    try:
        with open(OUT, encoding="utf-8") as f:
            existing = json.load(f)
        if not isinstance(existing, list):
            existing = []
    except (FileNotFoundError, json.JSONDecodeError):
        existing = []

    today = dt.date.today().strftime("%Y-%m")
    try:
        token = access_token()
    except urllib.error.HTTPError as e:
        print(f"Could not refresh the Spotify token ({e.code}). Check the three repository secrets.", file=sys.stderr)
        sys.exit(1)

    fresh = []
    for label, path, convert in (
        ("episodes", "/me/episodes", from_episodes),
        ("audiobooks", "/me/audiobooks", from_audiobooks),
    ):
        try:
            items = convert(paged(path, token), today)
            print(f"{label}: {len(items)}")
            fresh.extend(items)
        except urllib.error.HTTPError as e:
            # one section failing shouldn't wipe the log; keep going with the rest
            print(f"warning: {label} unavailable ({e.code}); keeping previous entries", file=sys.stderr)

    merged = merge(existing, fresh)
    text = json.dumps(merged, indent=2, ensure_ascii=False) + "\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"listening.json: {len(merged)} entries")


if __name__ == "__main__":
    main()
