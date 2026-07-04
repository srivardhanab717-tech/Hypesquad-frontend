# HypeSquad Frontend

React Native / Expo mobile app for HypeSquad — a social accountability platform that combines goal tracking, squad-based communities, AI coaching, and short-form video to help people stay consistent with their commitments.

> This is the **client app only**. It connects to an already-built backend (Supabase + Node/TypeScript API) that is not included in this repository.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 51 |
| Runtime | React Native 0.74 |
| Language | TypeScript 5.3 |
| Navigation | React Navigation 6 (native-stack + bottom-tabs) |
| Backend Client | Supabase JS SDK 2.x |
| Secure Storage | expo-secure-store |
| Realtime | Supabase Realtime (squad chat, body double presence) |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Expo Go** app installed on your physical device ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- A deployed instance of the HypeSquad backend
- A Supabase project with the corresponding schema already applied

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment values

Open `app.json` and set the values under `expo.extra`:

```jsonc
{
  "expo": {
    // ...
    "extra": {
      "apiBaseUrl": "https://<your-deployed-backend-url>",
      "supabaseUrl": "https://<your-project>.supabase.co",
      "supabaseAnonKey": "<your-publishable-anon-key>"
    }
  }
}
```

| Key | Description |
|-----|-------------|
| `apiBaseUrl` | Full URL of your deployed HypeSquad backend API |
| `supabaseUrl` | Your Supabase project URL (found in Project Settings → API) |
| `supabaseAnonKey` | Your Supabase **publishable/anon** key — **NEVER** use the secret/service-role key here |

---

## Running the App

```bash
npx expo start
```

Once the Metro bundler is running:

1. Open **Expo Go** on your device.
2. Scan the QR code displayed in the terminal (or in the browser dev tools page).
3. The app will load on your device.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `npm start` | Start Expo dev server |
| `android` | `npm run android` | Start and open on Android device/emulator |
| `ios` | `npm run ios` | Start and open on iOS simulator |
| `web` | `npm run web` | Start for web (experimental) |
| `ts:check` | `npm run ts:check` | Run TypeScript type-checking (`tsc --noEmit`) |
| `lint` | `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── components/    # Shared UI components (PostCard, HypeButton, ProgressRing, etc.)
├── context/       # React contexts (AuthContext, ThemeContext)
├── lib/           # API client, Supabase client, push notification helpers
├── navigation/    # RootNavigator, TabNavigator
├── screens/       # All 23 app screens
└── theme/         # Light/dark theme tokens
```

---

## Notes

- This app **requires** the HypeSquad backend to be running and accessible at the URL you configure in `apiBaseUrl`. Without it, authentication and all data operations will fail.
- Auth sessions are stored securely via `expo-secure-store` (encrypted at rest) — never in plain AsyncStorage.
- All API communication uses **snake_case** JSON (matching the backend's Postgres column naming).
- No hard-coded URLs or keys exist in the source code; everything is read from `app.json` → `expo.extra`.
