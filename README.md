# Next Piece

Source of [nextpiece.co.uk](https://nextpiece.co.uk/), a blog about mechanical puzzle design.
Hugo + the Blowfish theme, deployed to GitHub Pages by GitHub Actions on every push to `main`.
Decisions and the original brief: [HANDOVER.md](HANDOVER.md).

## First-time setup

```bash
brew install hugo
git clone --recurse-submodules https://github.com/sprocket314/nextpiece.git
```

The theme is a Git submodule (`themes/blowfish`). If you cloned without
`--recurse-submodules`, run `git submodule update --init`.

## Write a post

Each post is a folder (a page bundle) holding `index.md` and its images:

```bash
hugo new content --kind puzzle posts/my-puzzle-name
```

That creates `content/posts/my-puzzle-name/index.md` from `archetypes/puzzle/index.md`, with
every front matter field explained. Then:

1. Fill in the front matter. `designers`, `puzzle_types` and `tags` are lists and become
   clickable pages; blank fields are hidden from the facts box.
2. Put the images in the same folder. Name the cover `cover.jpg` (or change `featureimage`).
   It is the hero image, the card thumbnail and the picture shown when the link is shared.
3. Write. Plain Markdown images work: `![alt text](photo.jpg "Optional caption")`.
4. Set `draft: false` when it is ready.

Use JPEG for photos, about 2000 px on the long side. Hugo makes the smaller WebP copies, so
don't pre-shrink them. Keep every file under ~5 MB; the build warns about bigger ones.

For a post that isn't about one puzzle, `hugo new content posts/my-post/index.md` gives a
short front matter.

## Shortcodes

**Puzzle facts box**, built from the front matter:

```
{{< puzzle-facts >}}
```

**Photo gallery**, one file per line, `|` then an optional caption. A misspelt file name stops
the build, so mistakes never go live:

```
{{< photos >}}
pieces.jpg    | All six pieces
assembled.jpg | Assembled
{{< /photos >}}
```

Add `cols="2"` or `cols="4"` (default 3), or show every file in a subfolder with
`{{< photos match="gallery/*" >}}{{< /photos >}}`.

**Disassembly sequence**, numbered steps. Each line is an image, a GIF or a short `.mp4`
(videos loop silently like a GIF at a fraction of the size):

```
{{< disassembly >}}
step-1.jpg     | Slide the key piece up two units
step-2.jpg     | The two halves separate
take-apart.mp4 | The whole sequence
{{< /disassembly >}}
```

**3D model** viewer. Its script loads only on pages that use it:

```
{{< model src="pieces.glb" poster="cover.jpg" caption="The six pieces" >}}
```

Options: `alt="..."` (description for screen readers), `rotate="false"` (no auto-spin).
Anything in the viewer can be downloaded by visitors, so only publish geometry you are happy
to share.

## STL to GLB for the 3D viewer

Export one STL per piece from OpenSCAD, in assembled position, then:

```bash
uv run tools/stl2glb.py a.stl b.stl c.stl -o content/posts/my-puzzle/pieces.glb
```

Each piece gets its own colour, by default from the PLA filaments in stock (Red, Cyan,
Yellow, Bambu Green, Orange, Purple, ...). Options:

- `--explode 3.5` pushes the pieces out from the centre (1.0 = assembled)
- `--row` lays them side by side
- `--colors "#C12E1F,#0086D6"` picks the colours
- `--smooth` for curved parts (the default flat shading keeps blocky pieces crisp)

`uv` installs the script's dependencies (trimesh, numpy) on first run. Blocky puzzle pieces
come out at a few tens of KB. If a model passes 5 MB, lower `$fn` in OpenSCAD.

## Burr Atlas

`/atlas/` is an interactive index of every interlocking puzzle on
[puzzlewillbeplayed.com](https://puzzlewillbeplayed.com/) (Keiichiro Ishino), classified by piece type.
Published with his permission (email of 2026-11-10).
It is a standalone page, outside the theme's layout:

- data: `content/atlas/data.json` and `pieces.json`, inlined into the page at build time
- assembled images: `content/atlas/shapes.png` (Ishino's renders in one sprite, indexed by
  `shapes_index.json`); Hugo serves it as WebP (about 1.9 MB)
- page: `layouts/atlas/single.html`, with `assets/atlas/atlas.css` and `atlas.js`

To refresh the data after a new crawl in `~/claude/burr_design/catalogue`:

```bash
python3 tools/build_atlas.py
```

Then preview and commit. Pieces are drawn from the polycube codes; the assembled images are
Ishino's renders; every puzzle links to its page on his site. To take the atlas down, delete `content/atlas/` and its entry in
`config/_default/menus.en.toml`.

## Comments and analytics

- **Comments** use [giscus](https://giscus.app/): each post's thread is a GitHub Discussion in
  the repo's *Announcements* category. Switch them on or off with `showComments` in
  `config/_default/params.toml` (`[article]`), or per post with `showComments: false` in its
  front matter. Moderate them in the repo's Discussions tab.
- **Analytics** use [GoatCounter](https://www.goatcounter.com/): no cookies, no personal data.
  Set `goatcounter = "CODE"` in `params.toml`; only production builds count visits.

## Preview locally

```bash
hugo server --buildDrafts
```

Open http://localhost:1313. Drafts show up locally but are never published. The page reloads as
you save.

## Publish

```bash
git add -A
git commit -m "New post: my puzzle name"
git push
```

The **Deploy Hugo site to Pages** workflow (Actions tab) builds and deploys in about a minute.
If it fails, the log of its "Build with Hugo" step names the file and line.

## Maintenance

- **Hugo version.** CI pins `HUGO_VERSION` in `.github/workflows/hugo.yml` to the newest
  version the theme supports (see `[module.hugoVersion]` in `themes/blowfish/config.toml`).
  A newer local Hugo usually works but prints a compatibility warning.
- **Update the theme.** Pick a release tag, then build and check before pushing:

  ```bash
  cd themes/blowfish && git fetch --depth 1 origin tag v3.10.0 && git checkout v3.10.0 && cd ../..
  hugo server
  git add themes/blowfish && git commit -m "Update Blowfish to v3.10.0"
  ```

  Raise `HUGO_VERSION` to match the new theme's supported range in the same commit.
- **Site settings** live in `config/_default/`: `hugo.toml` (URL, taxonomies, image quality),
  `params.toml` (theme options), `languages.en.toml` (title, tagline, description),
  `menus.en.toml` (header and footer links).
- **Never edit `themes/blowfish/`.** Site files in `layouts/`, `assets/` and `config/`
  take precedence over the theme's.

## What is custom

| File | Purpose |
|---|---|
| `layouts/_default/_markup/render-image.html` | Markdown images become resized, lazy-loaded WebP |
| `layouts/partials/np/` | Shared image and line-parsing helpers |
| `layouts/shortcodes/` | `photos`, `disassembly`, `puzzle-facts`, `model` |
| `layouts/partials/extend-head-uncached.html` | Loads the 3D viewer script on pages that use it |
| `assets/css/custom.css` | Styles for the shortcodes |
| `assets/vendor/model-viewer/` | Self-hosted `<model-viewer>` 4.4.0 |
| `assets/img/social-card.png` | Share image for pages without a cover |
| `tools/stl2glb.py` | STL pieces to one coloured GLB |
| `layouts/partials/comments.html` | giscus comments, via Blowfish's comments hook |
| `layouts/partials/extend-head.html` | GoatCounter analytics script (production only) |
| `layouts/atlas/single.html`, `assets/atlas/` | The Burr Atlas page |
| `tools/build_atlas.py` | Copies the atlas data in from `burr_design/catalogue` |
