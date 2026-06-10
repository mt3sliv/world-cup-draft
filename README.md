# World Cup Draft

A React + TypeScript snake draft board for a World Cup fantasy league. The current version is a polished local-first draft room that runs entirely in the browser and saves progress to local storage.

## Features

- Editable league name and manager order
- Snake draft engine with automatic turn tracking
- Country pool with search and rating indicators
- Draft board, rosters, undo, and reset controls
- Responsive layout for desktop and mobile
- GitHub Pages deployment workflow

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

The app is configured for GitHub Pages at `/world-cup-draft/`. Enable Pages in the repository settings and select GitHub Actions as the source. Pushes to `main` will build and deploy the `dist` output.

## Next Milestones

- Replace the sample country pool with the finalized tournament field
- Add Firebase league rooms and real-time sync
- Add admin controls, timer, and pick history
- Add World Cup scoring and standings
