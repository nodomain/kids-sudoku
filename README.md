# Kids Sudoku PWA

A kid-friendly Sudoku progressive web app for children aged 3-7. No ads, no tracking, offline-first.

**Live:** https://nodomain.github.io/kids-sudoku/

## Features

- **Profiles:** Multiple player profiles with avatars, separate progress tracking
- **Age groups:** "Klein" (3-5) with picture puzzles, "Groß" (6-9) with number puzzles
- **Grid sizes:** 4×4, 6×6, 9×9 with difficulty progression
- **Symbol sets:** Animals, fruits, shapes (picture mode), numbers (classic mode)
- **Timer:** Running clock with time-based star rating (1-3 stars)
- **Sound effects:** Synthesized via Web Audio API (tap, place, undo, hint, win fanfare)
- **Unlockables:** New modes unlock as puzzles are solved
- **Hints:** Reveal one correct cell
- **Conflict checking:** Highlight errors on demand
- **PWA:** Installable, works fully offline via Service Worker
- **Cache busting:** Content-hashed filenames for instant updates

## Tech Stack

- Vanilla HTML/CSS/JS, zero dependencies
- Sudoku generator with backtracking, guaranteed unique solutions
- Web Audio API for sound synthesis
- Service Worker for offline caching
- GitHub Pages hosting

## Development

Edit source files in the repo root. The pre-commit hook runs `node build.js` automatically, which:
1. Hashes JS/CSS files with MD5 content hash
2. Rewrites index.html references to hashed filenames
3. Generates a new Service Worker with updated cache name
4. Outputs everything to `docs/` (served by GitHub Pages)

```bash
# Manual build (normally handled by pre-commit hook)
node build.js

# Local preview
python3 -m http.server 8787 --bind 127.0.0.1 --directory docs
```

## Deploy

Push to a feature branch, create PR, squash-merge to main. GitHub Pages auto-deploys from `docs/`.

```bash
git checkout -b feat/my-change
# make changes, commit (build runs automatically)
git push -u origin feat/my-change
gh pr create --base main --title "feat: my change"
gh pr merge --auto --squash
```
