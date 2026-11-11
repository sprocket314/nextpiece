# Handover: Next Piece, a puzzle design blog (Hugo + GitHub Pages)

The original brief is kept verbatim at the bottom. **Decisions** records what the owner has
settled since; it wins over the brief where they differ.

## Decisions (2026-11-09)

| Topic | Decision |
|---|---|
| Blog name | **Next Piece** |
| Tagline | **What will be the next piece?** (author headline on the home page) |
| Domain | **nextpiece.co.uk**, registered at **IONOS UK** (not Cloudflare/Porkbun as the brief assumed) |
| GitHub | personal account **sprocket314**, public repo **sprocket314/nextpiece** (a free plan needs a public repo for Pages) |
| Theme | **Blowfish**, Git submodule at `themes/blowfish`, pinned to tag **v3.9.0**, `shallow = true` (the theme repo is ~600 MB) |
| Hugo | CI pins **0.167.0**, the newest version Blowfish v3.9.0 declares support for (`themes/blowfish/config.toml`, `[module.hugoVersion]`). A newer local Hugo works but prints a compatibility warning. Bump both together. |
| Pages source | GitHub Actions; set via the API by Claude with the owner's OK. Custom domain `nextpiece.co.uk` set on the repo before the DNS change, as GitHub advises |
| Commit identity | Repo-local git config: `sprocket314` with GitHub's no-reply address, so the global work email never lands in this public repo |
| 3D viewer | Google `<model-viewer>` 4.4.0 with GLB, **self-hosted** in `assets/vendor/model-viewer/` and loaded only on pages that use the `model` shortcode. STL to GLB with `tools/stl2glb.py`. Chosen over three.js + STLLoader because it needs no custom JS. |
| Images | Site-level `render-image` hook and shortcodes produce resized **WebP** with lazy loading (Blowfish's own hook keeps the original format). No JPEG fallback: every current browser reads WebP. |
| Language | `en`, with `locale = "en-GB"` |
| Sample post | The owner will write the real posts. The sample is an explicitly labelled **example post** (a classic six-piece burr from Cutler's tabulation, so none of the owner's unpublished designs become downloadable) that proves images, taxonomies and the 3D viewer work live. Renders, not photos, for now. **Deleted on 2026-11-11** (owner's decision); its files are in git history (last in `3207548`). No live page uses the `model` viewer until a post does. |

Anything in a `model` viewer can be downloaded by any visitor: publishing a GLB publishes that
design's geometry.

## Decisions (2026-11-10)

| Topic | Decision |
|---|---|
| Burr Atlas | Published at `/atlas/` (menu: "Burr Atlas"), built from `~/claude/burr_design/catalogue` by `tools/build_atlas.py`. The data is the puzzlewillbeplayed.com index by **Ishino Keiichiro** (written family name first, as he signs; the site's contact, k16@chiba.email.ne.jp; earlier notes wrongly said "K. Kotani", a designer in the data). **Permission granted** by Ishino on 2026-11-10 in reply to the owner's email asking to publish the atlas on this blog, non-commercially: "That's wonderful. I have no problems at all." The page credits him and links every puzzle to its page on his site. His assembled-shape renders are included too (owner's decision, 2026-11-10, after the permission), served as one WebP sprite. Private-use wording ("send me the URL", "private research", crawl status) was removed. |
| Comments | giscus on posts (not About or the Atlas); threads in the repo's Discussions, *Announcements* category, mapped by page path. Theme follows the OS light/dark setting. |
| Instagram | Automatic posting of each new post via Meta's official API (owner's choice of option 2, 2026-11-10), not by logging in as the owner (against Instagram's terms; risks the account). Meta app *Next Piece* in business portfolio *Next Piece*, **Unified login** (Meta's current route; the Facebook-login setup is legacy, the Instagram-login setup unavailable to new apps). Token: system-user token from the dashboard, secret `IG_ACCESS_TOKEN`; account ID in repo variable `IG_USER_ID`. Verified 2026-11-10: token reaches @sprocket314 and created an unpublished test container. No renewal needed; a workflow checks it on the 1st and 15th. The owner sets secrets; Claude never handles their values. The portfolio also has a second, unused system user named `sprocket314` (Develop app role, Instagram Content access, full access to the Next Piece Page, no tokens), kept by the owner's choice; posting does not use it. |
| Instagram picture | Every Instagram picture carries **nextpiece.co.uk** across the top (owner's request, 2026-11-11): white DejaVu Sans Bold on a blurred, darkened band, added at build time in `layouts/index.instagram.json` (`[instagram] overlay` in `params.toml`). The first post went out without it, so the owner deleted it on Instagram and it was reposted with the band. Instagram cannot swap a published post's picture: changing one means deleting the post in the app, removing its entry from `data/instagram_posted.json`, and pushing. |
| Share card and blurb | (owner's decision, 2026-11-11) Pages without a cover, such as the homepage, share `static/img/social-card-frankenburr.png` (new file name, so caches fetch the new picture), set by Hugo's `images` in `params.toml` instead of Blowfish's `defaultSocialImage`, so link previews show it **large** (`summary_large_image`; owner's choice) rather than as a small thumbnail: the **Frankenburr illustration from the SEPP flyer** on the flyer's navy, with "Next Piece", the tagline and the address (it replaced a classic six-piece burr). Made by `inbox/social-card/make_card.py` (gitignored) from the flyer PDF. The site `description` (the blurb in link previews) is "What will be the next piece? Mechanical puzzle design: my new designs and failed attempts, puzzles I love, playtesting, and the Burr Atlas." Discord caches previews: re-share with `?v=2` to refresh. |
| Analytics | GoatCounter (code `nextpiece`), production builds only. Chosen over Cloudflare Web Analytics: no Cloudflare account needed, no cookies. |

## How posts get written (owner's decision, 2026-11-10)

The owner writes **through Claude**, not in an editor or CMS. The routine:

1. The owner gives the topic or rough notes and drops raw material (photos, STLs, OpenSCAD
   files) into `inbox/<slug>/` in this repo folder (gitignored, never published), or names a path.
2. Claude creates the post with `hugo new content --kind puzzle posts/<slug>`, keeps `draft: true`,
   writes it in the owner's voice from their notes (no invented facts: ask when a detail is
   missing), adds photos (JPEG, about 2000 px), a `model` viewer (`tools/stl2glb.py`) and
   disassembly steps where they fit, and fills in the front matter.
   For the first multi-part post, also uncomment the footer **Series** link in
   `config/_default/menus.en.toml` (hidden since 2026-11-10 while there are no series).
3. Claude previews it locally (`hugo server --buildDrafts`, launch config "hugo") and shows the
   owner; it build-checks with the CI Hugo version.
4. **Only on the owner's explicit OK**: set `draft: false`, commit, push. The deploy publishes it
   and posts it to Instagram (cover + caption) automatically, so the OK covers both. Then Claude
   confirms the live page and the Instagram step in the run log.

**Series of design posts (owner's decision, 2026-11-11):** after the first post, one post per
month of design history, going through the owner's designs in the order they were made until
caught up with the present. Put them in one `series`, and uncomment the footer Series link with
the first of them (step 2 above). The month-by-month list lives in the gitignored `inbox/`.

**Designers taxonomy (owner's decision, 2026-11-11):** a post's `designers` lists every
designer whose puzzles it discusses or who features in it, including Carlos for his own designs,
so a designer's page finds every post that mentions them. Reviewers, bloggers and friends who
are not mentioned as designers are not tagged. Use the full name in the form the puzzle world
uses (e.g. "Fumio Tsuburai"), even where the text says "Tsuburai-san". Named designers only:
when the designer is unknown, leave `designers` empty, never a placeholder such as "Unknown". Caveat: the
`puzzle-facts` box shows every `designers` term as "Designer", so on a post that uses the box,
list only that puzzle's designers (or give the box its own field first).
Designer pages are plain lists; a short bio can go in `content/designers/<slug>/_index.md`,
which Blowfish shows above the list. None written yet.

## Status (2026-11-09)

Live at **https://nextpiece.co.uk**. Let's Encrypt certificate for the apex and `www`, renewed
automatically by GitHub; Enforce HTTPS is on; `www` and `sprocket314.github.io/nextpiece`
redirect to the apex. The domain is verified on the sprocket314 account (TXT
`_github-pages-challenge-sprocket314`).

DNS at IONOS: four `A` and four `AAAA` records on `@` to GitHub Pages, `CNAME www` to
`sprocket314.github.io`, plus IONOS's own mail records (MX, SPF, DKIM, DMARC, autodiscover), which
must stay. Don't switch on IONOS's SSL: GitHub serves the certificate.

Lessons from the switch-over:
- IONOS refuses a `www` CNAME while `www` still has A/AAAA records; delete those first.
  GitHub rejects `www` as an A record anyway.
- GitHub's domain check kept stale DNS for about an hour (the old records' TTL). Once both names
  passed, removing and re-adding the custom domain started the certificate at once.
- The build takes its base URL from GitHub's Pages settings, so redeploy after changing the
  domain or enforcing HTTPS.

Comments (giscus app installed on `sprocket314/nextpiece`) and analytics (GoatCounter code
`nextpiece`, dashboard https://nextpiece.goatcounter.com) are on since 2026-11-10.

---

## Original brief (verbatim)

### Goal
Set up a personal blog about mechanical puzzle design and puzzles I like (burrs, interlocking/kumiki, take-apart puzzles, my own designs). Static site, built with Hugo, hosted free on GitHub Pages, served from my own custom domain.

### Decisions already made (don't revisit)
- **Generator:** Hugo (extended edition).
- **Hosting:** GitHub Pages, deployed via GitHub Actions (not the legacy `gh-pages` branch method).
- **Domain:** my own domain, registered at Cloudflare or Porkbun. DNS points to GitHub Pages; HTTPS is enforced.
- **Cost target:** domain only. No paid services.
- **Content format:** Markdown. Each post is a page bundle (`content/posts/<slug>/index.md` with images alongside).

### Ask me before starting
1. Blog name and tagline.
2. Domain name, and whether I've bought it yet. If not, build on `<user>.github.io` first and add the domain at the end.
3. GitHub username and repo name.
4. Theme preference. Suggest 2–3 clean, image-friendly, maintained themes (e.g. PaperMod, Blowfish, Congo), each with a one-line trade-off. Install as a Git submodule or Hugo module, not a copied folder.

### Build steps
1. Install Hugo extended locally and confirm the version.
2. `hugo new site`, initialise git, add the theme, set up `hugo.toml` (baseURL, title, language `en-gb`, taxonomies).
3. Add `.github/workflows/hugo.yml` using GitHub's official Hugo Pages workflow. Pin the Hugo version.
4. Tell me exactly which repo settings to change: Settings → Pages → Source: GitHub Actions.
5. Create a sample post and an About page. Push, then verify the live site.
6. Custom domain: give me the exact DNS records to add (apex A/AAAA records for GitHub Pages plus a `www` CNAME). Set the domain in repo settings, wait for the certificate, then enable "Enforce HTTPS". If using Cloudflare, warn me about proxy/SSL mode conflicts.

### Puzzle-specific features
- **Taxonomies:** `tags`, `designers`, `puzzle_types` (burr, board burr, interlocking, sequential, etc.), and `series` for multi-part posts.
- **Front matter archetype for puzzle posts:** title, designer, maker, year, type, piece count, level (e.g. 5.4.2), difficulty, where acquired, cover image.
- **Image handling:** use Hugo image processing to generate resized/WebP versions and lazy loading. Add a simple gallery shortcode.
- **3D viewer shortcode:** an embeddable interactive model viewer for my puzzle pieces. I export from OpenSCAD (STL). Either use `<model-viewer>` with GLB (convert STL → GLB) or three.js with STLLoader. Recommend one; load scripts only on pages that use it.
- **Optional shortcode for disassembly sequences:** step images or an animated GIF/video with captions.

### Nice-to-haves (after the core works)
- Comments via giscus (GitHub Discussions, free).
- Privacy-friendly free analytics (Cloudflare Web Analytics or GoatCounter).
- RSS: confirm Hugo's built-in feed works and is linked.
- Open Graph/social card images.

### Constraints and risks to handle
- **Repo size:** GitHub Pages sites have a ~1 GB limit and repos should stay small. Compress images before committing, keep STL/GLB files small, and flag anything over ~5 MB. Don't use Git LFS with Pages unless you confirm it works with the Actions build.
- **No secrets** in the repo.
- Keep the setup boring and maintainable. Prefer theme config over overriding theme templates, and avoid custom JS beyond the 3D viewer.

### Definition of done
- The site builds and deploys on every push to `main`.
- It's live on my custom domain with HTTPS.
- One real sample puzzle post exists, with images, taxonomy terms and a working 3D viewer.
- A short `README.md` explains how to write a new post, preview locally (`hugo server`) and publish.
