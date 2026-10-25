#!/usr/bin/env python3
"""
One-time Spotify login. Run this on your own computer:

    python3 scripts/spotify_login.py

It asks for your app's Client ID and Client Secret, opens Spotify in your
browser so you can approve access, then prints a REFRESH TOKEN. Paste that
token into your GitHub repository as the secret SPOTIFY_REFRESH_TOKEN.

Your Spotify app must list this exact Redirect URI:
    http://127.0.0.1:8888/callback

Access requested (read-only):
    user-library-read           your saved episodes and audiobooks
    user-read-playback-position how far you got through each episode
    playlist-read-private       read your curation playlist, even if it's private
Nothing here can change your account, play music or see your password.
"""
import base64
import os
import getpass
import http.server
import json
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

REDIRECT = "http://127.0.0.1:8888/callback"
SCOPES = "user-library-read user-read-playback-position playlist-read-private"

result = {}


class Callback(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.urlparse(self.path)
        if q.path != "/callback":
            self.send_response(404); self.end_headers(); return
        params = dict(urllib.parse.parse_qsl(q.query))
        result.update(params)
        ok = "code" in params and params.get("state") == result.get("expected_state")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        msg = "Done — you can close this tab and go back to the terminal." if ok else "Something went wrong — check the terminal."
        self.wfile.write(f"<p style='font:16px system-ui;padding:40px'>{msg}</p>".encode())
        threading.Thread(target=self.server.shutdown, daemon=True).start()

    def log_message(self, *args):
        pass


def main():
    print(__doc__.split("Your Spotify app")[0].strip(), "\n")
    cid = input("Client ID: ").strip()
    secret = getpass.getpass("Client Secret (hidden as you type): ").strip()
    if not cid or not secret:
        sys.exit("Both the Client ID and Client Secret are needed.")

    # random state value (os.urandom avoids clashing with any local file named secrets.py)
    state = base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip('=')
    result["expected_state"] = state
    url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode({
        "client_id": cid,
        "response_type": "code",
        "redirect_uri": REDIRECT,
        "scope": SCOPES,
        "state": state,
    })

    try:
        server = http.server.HTTPServer(("127.0.0.1", 8888), Callback)
    except OSError:
        sys.exit("Port 8888 is busy. Close whatever is using it and try again.")
    print("\nOpening Spotify in your browser. If nothing opens, paste this link into a browser:\n")
    print(url, "\n")
    webbrowser.open(url)
    server.serve_forever()

    if result.get("state") != state or "code" not in result:
        sys.exit(f"Login didn't complete: {result.get('error', 'no code returned')}")

    body = urllib.parse.urlencode({"grant_type": "authorization_code", "code": result["code"], "redirect_uri": REDIRECT}).encode()
    auth = base64.b64encode(f"{cid}:{secret}".encode()).decode()
    req = urllib.request.Request("https://accounts.spotify.com/api/token", data=body, headers={
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            tokens = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Spotify refused the login ({e.code}): {e.read().decode(errors='replace')}")

    print("Success. Add these three secrets to your GitHub repository")
    print("(Settings → Secrets and variables → Actions → New repository secret):\n")
    print("  SPOTIFY_CLIENT_ID      =", cid)
    print("  SPOTIFY_CLIENT_SECRET  = (the secret you just typed)")
    print("  SPOTIFY_REFRESH_TOKEN  =", tokens["refresh_token"])
    print("\nKeep the refresh token private — don't paste it anywhere public.")


if __name__ == "__main__":
    main()
