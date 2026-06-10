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

To enable room sync locally, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to your API server.

The API lives in `api/`. Install and run it separately:

```bash
cd api
npm install
npm start
```

## Build

```bash
npm run build
```

## Room Key API Setup

1. Set `VITE_API_BASE_URL` for the Pages app so it knows where the API is hosted.
2. Set these values for the API server:

```text
OWNER
REPO
GITHUB_TOKEN
BRANCH
CORS_ORIGIN
```

The API stores one draft document per room key in `api/data.json`.

Use the room key flow like this:

```text
Create room -> share link -> others join with room key or full link -> all edits save to the same room.
```

The room key is the access control boundary. If someone has the key, they can load and save that room.

## Deployment

The app is configured for GitHub Pages at `/world-cup-draft/`. Enable Pages in the repository settings and select GitHub Actions as the source. Pushes to `main` will build and deploy the `dist` output.

Set `VITE_API_BASE_URL` in the repository variables or workflow environment so the Pages build can reach the API.

## Next Milestones

- Replace the sample country pool with the finalized tournament field
- Harden the API with auth if you need stronger room protection
- Add admin controls, timer, and pick history
- Add World Cup scoring and standings
