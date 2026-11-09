# Next Piece blog

Hugo + Blowfish site deployed to GitHub Pages (sprocket314/nextpiece) at nextpiece.co.uk.
Decisions and the original brief live in the files below; read them before changing anything.

@HANDOVER.md
@README.md

- Never edit files under `themes/blowfish/` (a pinned submodule). Override from the site's
  `layouts/`, `assets/` or `config/` instead, and prefer config over overrides.
- Build-check with the CI Hugo version (see `.github/workflows/hugo.yml`) before pushing.
- Keep any committed file under ~5 MB; the workflow warns about larger ones.
