# Deckle

A frictionless, spaced-repetition flashcard app. Everything runs client-side —
no backend, no account, no server-side database. Your data lives in your
browser's IndexedDB and never leaves it unless you export it yourself.

## Features

- **Projects → Decks → Cards** — a flat, simple hierarchy (no nesting, no tags)
- **FSRS scheduling** — modern spaced-repetition algorithm (the same one Anki
  now defaults to), not the older SM-2
- **Basic and Cloze cards**, with image/audio embeds and a live markdown preview
  while you write
- **Review session** built for both desktop and mobile: keyboard shortcuts
  (`Space` to reveal, `1`-`4` to grade) and swipe gestures, with next-interval
  previews on every grade button
- **Dashboard** showing what's due today, broken down by project
- **Stats** — retention rate, review streak, 7-day due forecast
- **Reminders** — a daily time + minimum-due threshold, surfaced as a browser
  notification when the installed app is open
- **Passphrase lock screen** (a UI gate, not encryption — see below)
- **Dark/light theme**, defaulting to system preference, overridable anytime
- **Manual JSON backup** (export/import), with a nudge if it's been a while
- **Installable PWA** — works offline once loaded, add-to-home-screen on
  mobile and desktop

### Known limitations (by design, for now)

- No sync between devices/browsers — the manual JSON export/import is the only
  way to move data around
- The passphrase lock is a UI gate only; data is **not** encrypted at rest
- No AI-assisted card generation (e.g. from a photo) — everything is typed or
  pasted in by hand

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Angular (standalone components, Signals, zoneless change detection) |
| Scheduling | [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) |
| Storage | [Dexie](https://dexie.org/) over IndexedDB |
| Styling | Tailwind CSS v4 |
| UI components | [spartan-ng](https://www.spartan.ng/) — headless components on Angular CDK |
| Markdown | `marked`, rendered through Angular's built-in sanitizer |
| Hosting | GitHub Pages, deployed via GitHub Actions |

## Project structure

```
src/app/
  core/
    data/       Dexie database definition
    models/     Project, Deck, Card, ReviewLogEntry, MediaAsset, AppSettings
    services/   FSRS, project/deck/card CRUD, review, settings, theme, lock,
                backup, notifications, media, markdown rendering
    utils/      cloze parsing, interval formatting, id generation
  features/     one folder per screen (dashboard, projects, decks, cards,
                review, stats, settings, lock)
  shared/       app shell (nav), reusable components (theme toggle, card
                preview)
libs/ui/        generated spartan-ng components (button, dialog, card, …)
```

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
