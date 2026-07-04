[requirements (1).md](https://github.com/user-attachments/files/29664335/requirements.1.md)
# HypeSquad Frontend — Requirements

## Context
React Native / Expo mobile app for HypeSquad. This is the client that talks to the **already-built backend** at `hypesquad-backend` (Supabase + Node/TypeScript API — see backend's design.md for exact endpoints/schema). Do not re-derive backend behavior here; this spec covers UI, navigation, and wiring only.

**23 screens total**, per the original product brief. Each screen below maps to a specific backend endpoint already implemented.

---

## 1. Auth & Onboarding

- WHEN the app opens for the first time THEN it SHALL show Onboarding (logo, tagline "not Instagram, not LinkedIn", waitlist count) with a single CTA into phone-based sign-in.
- WHEN a user enters a phone number THEN the app SHALL call the backend's OTP request endpoint and show an OTP entry screen.
- WHEN a valid OTP is submitted THEN the app SHALL receive and securely store the session token (via `expo-secure-store`, never plain storage).
- IF the session indicates "needs setup" THEN the app SHALL route to Setup before anything else; ELSE route to Home Feed.
- Google/Apple sign-in SHALL be offered as secondary options on the same screen.

## 2. Setup

- Setup SHALL collect: name, avatar colour, interest chips (Fitness, Career, Learning, Creative, Finance, Wellness, Reading, Startup), default visibility (public/squad).
- The continue button SHALL stay disabled until name is non-empty.
- On submit, the app SHALL call the profile-setup endpoint and route to Goal Creation or Dashboard on success.

## 3. Goal Creation

- Reachable from onboarding AND from a persistent "New commitment" action elsewhere in the app.
- Fields: category, free-text description, deadline, cadence (daily/weekly/custom), target check-in count, visibility toggle.
- An "AI milestone plan" button SHALL call the AI milestone-plan endpoint and display exactly 3 suggested checkpoints before final submit.
- On successful creation, the app SHALL show a confirmation and route to the Goal Dashboard.

## 4. Home Feed

- A stories-style bar at top SHALL show the viewer's own check-in status plus squadmates ranked by streak length.
- A quick-access row SHALL link to AI Coach, Reels, Discover, and Body Double.
- The feed SHALL be a paginated (cursor-based, infinite scroll, pull-to-refresh) list of post cards showing author, linked goal, timestamp, type badge (win/progress/needs-hype), Hype button, comment count, save option.
- Tapping Hype SHALL optimistically update the UI immediately, then reconcile with the server response; on failure, the app SHALL roll back the optimistic state.
- The Hype tap SHALL trigger a small particle-burst animation, not a plain heart fill.

## 5. Discover

- SHALL show an AI Coach banner (for users without a squad), a row of trending tags, and a list of suggested squads with one-tap Join.
- Entirely read-only — no user-submitted content on this screen.

## 6. Search

- A search field; empty state shows trending tags (never a blank screen).
- Results SHALL be grouped into People, Goals, Squads sections.

## 7. Squad Browser

- SHALL show a "Create a squad" CTA, the user's current squads, and suggested squads with member counts and Join buttons.

## 8. Create Squad

- Fields: emoji picker, name, category, visibility (public/private — note: squad visibility vocabulary differs from goal/post visibility, per backend design.md).
- Default channels (general, check-ins, wins, accountability) are created server-side automatically — the app does not need to create them.

## 9. Squad Chat

- Styled like Discord: channel header, check-in cards rendered inline and distinctly from plain messages, own-vs-other message styling, AI Coach entry point, message composer.
- Messages SHALL arrive in real time via the backend's realtime channel subscription (Supabase Realtime) — implement with a subscription hook per channel.
- Switching channels SHALL swap history without a full screen reload/reconnect.

## 10. Goal Dashboard

- "New commitment" button routes to Goal Creation.
- One card per goal: progress ring, current streak, Check-in button whose state (available / done today / goal complete) reflects server-computed goal status — never computed client-side.
- Tapping Check-in SHALL call the check-in endpoint; on success, animate the progress ring forward and show a small celebration moment. The app SHALL NOT allow multiple rapid taps to fire multiple requests (disable button during in-flight request).
- Tapping a card opens Goal Detail.

## 11. Goal Detail

- Hero progress ring with percentage, stat row (progress/streak/total check-ins), milestone checkpoints at 25/50/75/100% (server-computed, from the `milestones` table — distinct from the AI-suggested plan from Goal Creation), a row of related squadmates, check-in button, share-to-Milestone-Card action.

## 12. Profile

- Avatar, name, handle, bio, stat row (streak/posts/followers/following — tapping opens respective lists).
- Own profile: Edit action. Others' profiles: Follow + Message actions.
- Menu: Stats, Achievements, Share a milestone, Coach Marketplace, Saved posts, Settings.
- Own posts listed below.

## 13. Followers / Following

- Two tabs. Each row: person, their current goal, their streak, follow/unfollow button inline.

## 14. New Post

- Text composer, "Help me write this" AI-assist button (grounded in the user's actual goals), goal tag, attachment options (photo/progress snapshot/milestone), visibility choice, Share button.

## 15. Notifications

- List: hypes, comments, new followers, squad joins/invites, milestone events, AI tips. Clear unread state.
- Viewing a notification SHALL mark it read without a separate user action (per backend behavior).
- The app SHALL register its push token with the backend's device-registration endpoint on login/app-open (required for push to work at all).

## 16. Leaderboard

- Podium for top 3, ranked list below. Toggle: streak vs hype metric; toggle: squad-scoped vs global.

## 17. AI Coach

- Coach intro, quick-prompt chips ("Plan my week," "I want to quit," "I missed 3 days," "Hype me up"), chat thread, typing indicator while awaiting response, composer, link to Coach Marketplace.
- Conversation history SHALL persist across app sessions (fetched from the backend on screen open, not stored only locally).

## 18. Coach Marketplace

- Coach cards: name, AI/human badge, specialty, rating, price. "Chat" (AI) routes to AI Coach; "Book" (human) routes into a scheduling/payment flow (Razorpay checkout — see backend booking endpoint).

## 19. Body Double Room

- Participant tiles with avatar + "focusing" status (via realtime presence), Pomodoro timer (25 min default, start/pause/reset — **client-local only**, not synced server-side), invite option.

## 20. Milestone Card

- Renders a shareable card (streak/achievement + name + brand mark), theme/gradient switcher, Share action (native share sheet or image export).

## 21. Settings

- Pro upgrade card (entry to subscription flow), light/dark theme toggle, push/visibility/AI-tips toggles, edit profile, privacy sub-page, invite, about, sign out.
- All toggles SHALL persist immediately on change — no save button anywhere on this screen.

## 22. Reels Feed

- Full-screen vertical snap-scroll. Each reel: linked goal, caption, author, side actions (hype/comment/share), record-new entry point, close action.
- Hype behavior SHALL match the main feed (optimistic + reconcile).

## 23. Record Reel

- Shows target goal (switchable), duration selector (15/30/60s), camera flip/timer/music/filter tools, press-and-hold record with visible recording animation, auto-post on finish, gallery-upload fallback.
- A streak reminder SHALL be visible somewhere on this screen.

---

## Cross-cutting Requirements

- The app SHALL read backend base URL and Supabase keys from `app.json`'s `extra` config — never hard-coded in source files.
- The app SHALL NEVER store the Supabase secret/service-role key — only the publishable/anon key belongs in the client.
- Auth session SHALL be stored via `expo-secure-store`, not `AsyncStorage` (secure-store encrypts at rest).
- All list screens (feed, reels, notifications, leaderboard) SHALL handle empty states and loading states explicitly — never a blank white screen.
- Network failures SHALL show a retry affordance, not a silent failure.
- The bottom tab bar SHALL persist on all browse/detail screens and hide only on immersive flows (Reels, Record Reel, Body Double, Squad Chat) — each immersive screen SHALL have its own explicit back/close affordance since the tab bar is hidden.

## Open Decisions — Same as Backend, Plus Two Frontend-Specific Items

Per the backend spec's §19: un-hype, leave-squad, comment-deletion, and squad-transfer/deletion are OUT OF SCOPE for this build. Do not build UI for these.

Additionally, out of scope for this build (matching backend's existing endpoints with no corresponding UI needed yet):
1. **Private-squad join-request approval UI** — the backend has approve/reject endpoints; no "pending requests" review screen is built in this pass.
2. **JSON wire format**: all API request/response bodies use snake_case (matching backend's Postgres columns), not camelCase — see design.md §4. This is a fixed decision, not left ambiguous.
