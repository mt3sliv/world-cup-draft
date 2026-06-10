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

To enable cross-device sync locally, copy `.env.example` to `.env.local` and fill in your Firebase web app config values.

## Build

```bash
npm run build
```

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app in Project settings.
3. Create a Firestore database.
4. Add these values from the Firebase web app config to `.env.local` for local development and to GitHub repository secrets for Pages deploys:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

The app stores one document per room at `draftRooms/{roomId}`.

For a friends-only draft, this simple Firestore rule is enough to get started while you are sharing room IDs privately:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /draftRooms/{roomId} {
      allow read, write: if true;
    }
  }
}
```

Before sharing broadly, replace that open rule with authentication or a room invite/passcode rule.

## Deployment

The app is configured for GitHub Pages at `/world-cup-draft/`. Enable Pages in the repository settings and select GitHub Actions as the source. Pushes to `main` will build and deploy the `dist` output.

## Next Milestones

- Replace the sample country pool with the finalized tournament field
- Add Firebase league rooms and real-time sync
- Add admin controls, timer, and pick history
- Add World Cup scoring and standings
