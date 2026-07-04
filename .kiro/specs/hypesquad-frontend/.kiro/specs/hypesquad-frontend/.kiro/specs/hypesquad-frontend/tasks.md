[tasks (1).md](https://github.com/user-attachments/files/29664357/tasks.1.md)
# HypeSquad Frontend — Implementation Tasks

Organized in dependency waves, same convention as the backend spec. Tasks within a wave can run in parallel; each wave depends on the prior wave.

## Wave 1 — Foundation
- [ ] 1.1 Expo project scaffold: package.json, app.json (with `extra` config placeholders), tsconfig, babel config
- [ ] 1.2 Theme tokens (`src/theme/theme.ts`) — light + dark, matching brand (orange accent)
- [ ] 1.3 Supabase client (`src/lib/supabase.ts`) with `expo-secure-store` session persistence
- [ ] 1.4 Base HTTP helpers (`httpGet`/`httpPost`/`httpPatch`/`httpDelete`) per design.md §4, then the full typed API client — every function, snake_case wire format, Bearer token + 401-handling centralized in the base helpers (not repeated per-call), including the OAuth endpoint
- [ ] 1.5 AuthContext + ThemeContext
- [ ] 1.6 RootNavigator (auth gate) + TabNavigator (5 tabs) skeleton per the navigation map in design.md §3a — no screens wired yet

## Wave 2 — Core Loop (fully wired, this is the critical path)
- [ ] 2.1 OnboardingScreen + AuthScreen (phone OTP full flow, including OAuth secondary options)
- [ ] 2.2 SetupScreen (profile creation, routes correctly based on "needs setup")
- [ ] 2.3 HomeFeedScreen — paginated feed, optimistic hype, particle-burst animation on hype tap, pull-to-refresh
- [ ] 2.4 GoalDashboardScreen — goal cards, progress ring, check-in button with correct state + disabled-during-request behavior
- [ ] 2.5 GoalCreationScreen — full form + AI milestone-plan button (3 checkpoints)
- [ ] 2.6 AICoachScreen — chat thread, quick-prompt chips, typing indicator, persisted history across sessions

## Wave 3 — Social & Discovery
- [ ] 3.1 ProfileScreen (own + others' variants) + FollowListScreen (both tabs)
- [ ] 3.2 NewPostScreen — composer, AI draft-assist, goal tag, attachments, visibility
- [ ] 3.3 GoalDetailScreen — hero ring, milestones, related squadmates, share-to-milestone-card entry
- [ ] 3.4 DiscoverScreen + SearchScreen (grouped results, trending tags empty state)
- [ ] 3.5 NotificationsScreen — list, read-on-view behavior, push token registration wired via `src/lib/push.ts`

## Wave 4 — Squads & Realtime
- [ ] 4.1 SquadBrowserScreen + CreateSquadScreen
- [ ] 4.2 SquadChatScreen — Discord-style, realtime subscription per channel, inline check-in cards distinct from text messages, channel switching without reconnect
- [ ] 4.3 BodyDoubleScreen — realtime presence tiles, local Pomodoro timer (client-only), invite flow

## Wave 5 — Media
- [ ] 5.1 ReelsFeedScreen + ReelCard component (separate from PostCard per design.md §3) — vertical snap-scroll, same hype pattern as feed via shared HypeButton
- [ ] 5.2 RecordReelScreen — goal switcher, duration selector, camera controls, press-and-hold record, gallery fallback, streak reminder visible
- [ ] 5.3 MilestoneCardScreen — theme/gradient switcher, native share sheet / image export

## Wave 6 — Monetization & Ranking
- [ ] 6.1 LeaderboardScreen — podium + ranked list, scope/metric toggles
- [ ] 6.2 CoachMarketplaceScreen — coach cards, AI routes to AICoachScreen, human routes to booking/payment
- [ ] 6.3 Razorpay checkout integration for coach booking + Pro subscription upgrade flow
- [ ] 6.4 SettingsScreen — Pro upgrade card, theme toggle (persisted, no save button), all toggles persist immediately

## Wave 7 — Polish & Hardening
- [ ] 7.1 Empty/loading/error states audited across every list screen (feed, reels, notifications, leaderboard, search)
- [ ] 7.2 Network-failure retry affordances audited across all screens making API calls
- [ ] 7.3 Navigation audit: confirm bottom tab bar persists correctly, every immersive screen (Reels, Record Reel, Body Double, Squad Chat) has an explicit back/close control
- [ ] 7.4 `npm run typecheck` passes with zero errors
- [ ] 7.5 README with exact run instructions (`npm install`, set `app.json` extra config, `npx expo start`, scan QR with Expo Go)

## Definition of Done (per task)
- Screen matches its requirements.md section exactly (fields, actions, states)
- API calls match design.md §4 function signatures exactly — no invented endpoints
- No hard-coded URLs or keys anywhere in source — only via `app.json` extra config
- Optimistic-UI screens (hype, feed) handle both success and rollback-on-failure paths
- TypeScript compiles clean
