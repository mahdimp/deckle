# Deckle

A frictionless, spaced-repetition flashcard app. Local-only data (IndexedDB via
Dexie), no backend, installable as a PWA, deployed to GitHub Pages.

- **Scheduling**: [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) (via `ts-fsrs`)
- **Storage**: IndexedDB via Dexie — nothing leaves the browser
- **Stack**: Angular (standalone, Signals, zoneless), Tailwind CSS, spartan-ng (headless UI on Angular CDK)
- **Cards**: Basic front/back and Cloze deletion, with image/audio embeds
- **Backup**: manual JSON export/import (Settings) — this is the only way to move data between browsers/devices

## Development

Requires Node 22 (see `.nvmrc`).

```bash
npm install
ng serve
```

Open `http://localhost:4200/`.

```bash
ng build   # production build to dist/deckle
ng test    # unit tests (Vitest)
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app
with `--base-href /<repo-name>/` and publishes it to GitHub Pages via GitHub
Actions.

Before the first deploy:

1. The repo must be **public** (GitHub Pages needs a paid plan to publish from a private repo).
2. In the repo's Settings → Pages, set **Build and deployment → Source** to **GitHub Actions**.
