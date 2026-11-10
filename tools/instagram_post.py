#!/usr/bin/env python3
"""Post new blog posts to Instagram through Meta's official API (v27.0).

Run by the deploy workflow after each deploy:

    python3 tools/instagram_post.py --feed public/instagram.json [--dry-run] [--max 2]

- Reads the post list Hugo writes to /instagram.json (layouts/index.instagram.json).
- Posts every post not yet recorded in data/instagram_posted.json: cover image + caption.
- Records each success at once (atomic write), so a re-run never posts twice.
- Needs IG_ACCESS_TOKEN in the environment; without it, it reports what it would post and
  exits 0. Either kind of token works, detected automatically:
    * Instagram Login token  -> graph.instagram.com
    * Facebook Login token (a Page token, or a user token for a Page linked to the Instagram
      Creator/Business account) -> graph.facebook.com
    * Unified login / business-portfolio token (its assigned Instagram accounts) -> graph.facebook.com

Caption: post-specific `instagram_caption` from front matter if set, otherwise
title, summary, a pointer to the blog, then hashtags from tags, puzzle types and
params.instagram.hashtags (max 30). Instagram captions cannot hold clickable links.
"""
import argparse
import json
import os
import re
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

IG_HOST = "https://graph.instagram.com/v27.0"
FB_HOST = "https://graph.facebook.com/v27.0"
STATE = Path(__file__).resolve().parent.parent / "data" / "instagram_posted.json"
MAX_CAPTION = 2200
MAX_TAGS = 30


class ApiError(RuntimeError):
    pass


def call(method, path, token, host=IG_HOST, **params):
    """One Graph API call. The token goes in the body/query, never into messages."""
    params["access_token"] = token
    data = urllib.parse.urlencode(params).encode()
    url = f"{host}/{path}"
    if method == "GET":
        req = urllib.request.Request(f"{url}?{data.decode()}")
    else:
        req = urllib.request.Request(url, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            err = json.load(e).get("error", {})
            msg = f"{err.get('type', 'error')} {err.get('code', '')}: {err.get('message', '')}"
        except Exception:
            msg = f"HTTP {e.code}"
        raise ApiError(f"{method} /{path.split('?')[0]} failed: {msg}") from None


def hashtag(word):
    return re.sub(r"[^0-9a-z]", "", word.lower())


def caption_for(post, base_tags, home):
    if post.get("caption"):
        return post["caption"][:MAX_CAPTION]
    tags, seen = [], set()
    for w in post.get("tags", []) + post.get("puzzle_types", []) + base_tags:
        h = hashtag(w)
        if h and h not in seen and not h.isdigit():
            seen.add(h)
            tags.append("#" + h)
    host = urllib.parse.urlparse(home).netloc or home
    parts = [post["title"]]
    if post.get("summary"):
        parts.append(post["summary"])
    parts.append(f"Read the full post on {host} (link in bio).")
    text = "\n\n".join(parts)
    if len(text) > MAX_CAPTION:
        text = text[: MAX_CAPTION - 1].rstrip() + "…"
    tag_line = " ".join(tags[:MAX_TAGS])
    room = MAX_CAPTION - len(text) - 2
    if len(tag_line) > room:  # drop whole hashtags until the caption fits
        tag_line = tag_line[:room].rsplit(" ", 1)[0] if room > 10 else ""
    return text + ("\n\n" + tag_line if tag_line else "")


def load_state():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save_state(state):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=STATE.parent, suffix=".tmp")
    with os.fdopen(fd, "w") as f:
        json.dump(state, f, indent=2, sort_keys=True)
        f.write("\n")
    os.replace(tmp, STATE)


def wait_for_image(url, tries=20, pause=15):
    """GitHub Pages can take a minute to serve a new deploy; Instagram fetches the image itself."""
    for _ in range(tries):
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status == 200 and "image/jpeg" in r.headers.get("Content-Type", ""):
                    return
        except urllib.error.URLError:
            pass
        time.sleep(pause)
    raise ApiError(f"cover image never became reachable: {url}")


def find_account(token):
    """Which host accepts this token, and which Instagram account does it reach?"""
    tried = []
    known = os.environ.get("IG_USER_ID", "").strip()
    if known:  # account ID given explicitly (repo variable): just confirm the token reaches it
        for host in (FB_HOST, IG_HOST):
            try:
                me = call("GET", known, token, host, fields="username")
                return host, known, me.get("username", "?")
            except ApiError as e:
                tried.append(str(e))
    try:
        me = call("GET", "me", token, IG_HOST, fields="user_id,username")
        return IG_HOST, me["user_id"], me.get("username", "?")
    except ApiError as e:
        tried.append(str(e))
    try:  # a Page token: the Page's linked Instagram account
        me = call("GET", "me", token, FB_HOST, fields="instagram_business_account{id,username}")
        if me.get("instagram_business_account"):
            a = me["instagram_business_account"]
            return FB_HOST, a["id"], a.get("username", "?")
    except ApiError as e:
        tried.append(str(e))
    try:  # a user token: the first Page with a linked Instagram account
        pages = call("GET", "me/accounts", token, FB_HOST,
                     fields="name,instagram_business_account{id,username}").get("data", [])
        for page in pages:
            if page.get("instagram_business_account"):
                a = page["instagram_business_account"]
                return FB_HOST, a["id"], a.get("username", "?")
        tried.append("no Facebook Page with a linked Instagram professional account")
    except ApiError as e:
        tried.append(str(e))
    try:  # a business-portfolio (Unified login / system user) token: its assigned accounts
        accts = call("GET", "me/assigned_instagram_accounts", token, FB_HOST,
                     fields="id,username").get("data", [])
        if accts:
            return FB_HOST, accts[0]["id"], accts[0].get("username", "?")
        tried.append("no Instagram account assigned to this token")
    except ApiError as e:
        tried.append(str(e))
    raise ApiError("the token reaches no Instagram account: " + " | ".join(tried))


def publish(post, caption, token, ig_id, host):
    wait_for_image(post["image"])
    container = call("POST", f"{ig_id}/media", token, host, image_url=post["image"], caption=caption,
                     alt_text=post.get("alt", "")[:1000])["id"]
    for _ in range(30):  # Meta: images are usually FINISHED at once; allow up to ~5 minutes
        status = call("GET", container, token, host, fields="status_code").get("status_code")
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            raise ApiError(f"media container {status}")
        time.sleep(10)
    else:
        raise ApiError("media container still not ready after 5 minutes")
    media_id = call("POST", f"{ig_id}/media_publish", token, host, creation_id=container)["id"]
    link = call("GET", media_id, token, host, fields="permalink").get("permalink", "")
    return media_id, link


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--feed", required=True, help="path or URL of instagram.json")
    ap.add_argument("--dry-run", action="store_true", help="show what would be posted, post nothing")
    ap.add_argument("--max", type=int, default=2, help="most posts to publish in one run (default 2)")
    args = ap.parse_args()

    if args.feed.startswith("http"):
        with urllib.request.urlopen(args.feed, timeout=60) as r:
            feed = json.load(r)
    else:
        feed = json.loads(Path(args.feed).read_text())

    state = load_state()
    todo = [p for p in sorted(feed["posts"], key=lambda p: p["date"]) if p["slug"] not in state]
    if not todo:
        print("Instagram: nothing new to post.")
        return 0

    token = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    dry = args.dry_run or not token
    if not token and not args.dry_run:
        print("::notice::IG_ACCESS_TOKEN is not set, so nothing was posted (dry run).")

    ig_id = host = None
    if not dry:
        try:
            host, ig_id, username = find_account(token)
        except ApiError as e:
            print(f"::error::{e}")
            return 1
        print(f"Instagram: posting as @{username} via {host.split('/')[2]}")

    failures = 0
    for post in todo[: args.max]:
        caption = caption_for(post, feed.get("hashtags", []), feed.get("home", ""))
        if dry:
            print(f"--- would post {post['slug']}\nimage: {post['image']}\n{caption}\n")
            continue
        try:
            media_id, link = publish(post, caption, token, ig_id, host)
        except ApiError as e:
            failures += 1
            print(f"::error::Instagram post for {post['slug']} failed: {e}")
            continue
        state[post["slug"]] = {"media_id": media_id, "permalink": link,
                               "posted": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
        save_state(state)
        print(f"Instagram: posted {post['slug']} -> {link or media_id}")
    if len(todo) > args.max:
        print(f"::notice::{len(todo) - args.max} more post(s) wait for the next run (limit --max {args.max}).")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
