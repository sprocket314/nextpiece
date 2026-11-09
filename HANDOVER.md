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
| Sample post | The owner will write the real posts. The sample is an explicitly labelled **example post** (a classic six-piece burr from Cutler's tabulation, so none of the owner's unpublished designs become downloadable) that proves images, taxonomies and the 3D viewer work live. Renders, not photos, for now. |

Anything in a `model` viewer can be downloaded by any visitor: publishing a GLB publishes that
design's geometry.

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
