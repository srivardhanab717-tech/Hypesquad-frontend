[design (1).md](https://github.com/user-attachments/files/29664351/design.1.md)
# HypeSquad Frontend — Design

## 1. Stack (fixed, do not re-derive)

- Expo SDK 51, React Native 0.74, TypeScript
- Navigation: React Navigation 6 (native-stack + bottom-tabs)
- Auth/session: `@supabase/supabase-js` (phone OTP) + `expo-secure-store`
- Push: `expo-notifications` + `expo-device`
- No Redux — use React Context + hooks; screens fetch via a typed API client (below)
- Backend base URL and Supabase keys live in `app.json` → `expo.extra`

## 2. Config (app.json → extra)

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://<your-deployed-backend-url>",
      "supabaseUrl": "https://<project>.supabase.co",
      "supabaseAnonKey": "<publishable key — NEVER the secret key>"
    }
  }
}
```

## 3. Project structure

```
App.tsx                        providers (Auth, Theme) + navigation root + push registration
src/
  lib/
    supabase.ts                 Supabase client, secure-store session persistence
    api.ts                      typed fetch client — one function per backend endpoint
    push.ts                     expo-notifications registration + POST /devices/register
  theme/
    theme.ts                    light/dark tokens: colors, spacing, typography
  context/
    AuthContext.tsx              session state, sign-in/out, "needs setup" flag
    ThemeContext.tsx             theme + AsyncStorage-persisted preference (non-sensitive)
  navigation/
    RootNavigator.tsx            auth gate: Onboarding/Setup stack vs main app
    TabNavigator.tsx             Home · Goals · Coach · Squads · Me (5 tabs)
  components/
    PostCard.tsx                 feed list-item card, optimistic hype (compact layout)
    ReelCard.tsx                 full-screen vertical video card, optimistic hype (NOT the same
                                  component as PostCard — a feed list-item and a full-screen video
                                  are different layouts; they may share a HypeButton sub-component
                                  but must not share the outer card component)
    HypeButton.tsx               shared particle-burst hype control, used by both cards above
    ProgressRing.tsx             shared goal progress ring
    EmptyState.tsx               shared empty/loading/error states
  screens/
    OnboardingScreen.tsx
    AuthScreen.tsx                phone OTP entry
    SetupScreen.tsx
    GoalCreationScreen.tsx
    HomeFeedScreen.tsx
    DiscoverScreen.tsx
    SearchScreen.tsx
    SquadBrowserScreen.tsx
    CreateSquadScreen.tsx
    SquadChatScreen.tsx
    GoalDashboardScreen.tsx
    GoalDetailScreen.tsx
    ProfileScreen.tsx
    FollowListScreen.tsx
    NewPostScreen.tsx
    NotificationsScreen.tsx
    LeaderboardScreen.tsx
    AICoachScreen.tsx
    CoachMarketplaceScreen.tsx
    BodyDoubleScreen.tsx
    MilestoneCardScreen.tsx
    SettingsScreen.tsx
    ReelsFeedScreen.tsx
    RecordReelScreen.tsx
```

## 3a. Navigation map (fixed — do not let Kiro invent hierarchy)

```
RootNavigator (auth gate)
├── [not authed] → AuthStack: OnboardingScreen → AuthScreen (OTP)
└── [authed, needs setup] → SetupScreen
└── [authed, setup complete] → MainTabs

MainTabs (bottom tabs, persist on all of these + their pushed children)
├── Tab: Home        → HomeFeedScreen
│                         ├─ push → GoalDetailScreen (from post's linked goal)
│                         ├─ push → ProfileScreen (from post author)
│                         ├─ push → NewPostScreen (modal, from compose button)
│                         ├─ push → NotificationsScreen (from bell icon)
│                         ├─ push (tab bar hidden) → ReelsFeedScreen (from quick-access row)
│                         │                              └─ push (tab bar hidden) → RecordReelScreen
│                         ├─ push → DiscoverScreen (from quick-access row)
│                         │                              └─ push → SearchScreen
│                         │                              └─ push → SquadBrowserScreen → CreateSquadScreen
│                         │                                                          → SquadChatScreen (tab bar hidden)
│                         └─ push (tab bar hidden) → BodyDoubleScreen (from quick-access row)
├── Tab: Goals       → GoalDashboardScreen
│                         ├─ push → GoalCreationScreen (modal, from "New commitment")
│                         └─ push → GoalDetailScreen
│                                        └─ push → MilestoneCardScreen (from share action)
├── Tab: Coach        → AICoachScreen
│                         └─ push → CoachMarketplaceScreen
├── Tab: Squads       → SquadBrowserScreen (same destinations as under Discover above)
└── Tab: Me           → ProfileScreen (own)
                            ├─ push → FollowListScreen (followers/following)
                            ├─ push → LeaderboardScreen
                            └─ push → SettingsScreen
```

Any screen not explicitly placed above (e.g. reaching another user's Profile from a Leaderboard row, or Squad Chat from a squad card) is reached via the same push pattern shown for its type elsewhere in this map — screens are not duplicated per entry point, there is one instance of each screen type per navigator.

## 3b. Squad join-request approval (out of scope for this build)

The backend has approve/reject endpoints for private-squad join requests (see `squads.joinRequests`/`approveJoinRequest`/`rejectJoinRequest` in the API client below), but **no screen or UI for reviewing them is in scope for this build** — consistent with the backend spec's own out-of-scope list. The API client functions exist so a future pass can wire them without touching the backend; do not build a "pending requests" screen now.

## 4. API client (`src/lib/api.ts`)

### Wire format — fixed decision, do not re-derive
All request and response JSON bodies use **snake_case**, matching the backend's Postgres column names exactly (`goal_id`, `target_checkins`, `period_start`, etc.) — not camelCase. TypeScript interfaces for request/response shapes SHALL use snake_case field names at the wire boundary. Do not add a camelCase mapping layer; it's an unnecessary translation step that only introduces bugs.

### Base HTTP helpers (define these first, everything else calls them)
```ts
// src/lib/api.ts — base helpers, defined before the endpoint map below
async function request(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) {
  const token = await getAccessToken(); // from AuthContext/Supabase session
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    await signOut(); // from AuthContext — triggers route to Auth
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const httpGet = (path: string) => request('GET', path);
const httpPost = (path: string, body?: unknown) => request('POST', path, body);
const httpPatch = (path: string, body?: unknown) => request('PATCH', path, body);
const httpDelete = (path: string) => request('DELETE', path);
```

**Naming rule to avoid a real footgun:** endpoint functions below take parameters like `goal`, `post`, `patch` — these MUST NOT be named the same as the HTTP helpers (`httpGet`/`httpPost`/`httpPatch`/`httpDelete` are deliberately prefixed with `http` specifically to prevent parameter names from shadowing them).

One function per backend endpoint, matching `hypesquad-backend`'s design.md §4 exactly:

```ts
export const api = {
  auth: {
    requestOtp: (phone: string) => httpPost('/auth/otp/request', { phone }),
    verifyOtp: (phone: string, code: string) => httpPost('/auth/otp/verify', { phone, code }),
    oauth: (provider: 'google' | 'apple', payload: OAuthPayload) =>
      httpPost(`/auth/oauth/${provider}`, payload),
  },
  profile: {
    getMe: () => httpGet('/profile/me'),
    updateMe: (patch: ProfilePatch) => httpPatch('/profile/me', patch),
  },
  goals: {
    create: (goal: GoalInput) => httpPost('/goals', goal),
    mine: () => httpGet('/goals/mine'),
    detail: (id: string) => httpGet(`/goals/${id}`),
    milestonePlan: (id: string) => httpPost(`/goals/${id}/milestone-plan`),
    checkin: (id: string) => httpPost(`/goals/${id}/checkins`),   // no period data sent — server computes it
  },
  feed: {
    list: (cursor?: string) => httpGet(`/feed${cursor ? `?cursor=${cursor}` : ''}`),
  },
  posts: {
    create: (input: PostInput) => httpPost('/posts', input),
    hype: (id: string) => httpPost(`/posts/${id}/hype`),
    comments: (id: string) => httpGet(`/posts/${id}/comments`),
    addComment: (id: string, body: string) => httpPost(`/posts/${id}/comments`, { body }),
    draftAssist: (goal_id: string) => httpPost('/posts/draft-assist', { goal_id }),
  },
  discover: () => httpGet('/discover'),
  search: (q: string) => httpGet(`/search?q=${encodeURIComponent(q)}`),
  squads: {
    mine: () => httpGet('/squads/mine'),
    suggested: () => httpGet('/squads/suggested'),
    create: (input: SquadInput) => httpPost('/squads', input),
    join: (id: string) => httpPost(`/squads/${id}/join`),
    joinRequests: (id: string) => httpGet(`/squads/${id}/join-requests`),
    approveJoinRequest: (squadId: string, reqId: string) =>
      httpPost(`/squads/${squadId}/join-requests/${reqId}/approve`),
    rejectJoinRequest: (squadId: string, reqId: string) =>
      httpPost(`/squads/${squadId}/join-requests/${reqId}/reject`),
  },
  channels: {
    messages: (id: string) => httpGet(`/channels/${id}/messages`),
    send: (id: string, body: string) => httpPost(`/channels/${id}/messages`, { body }),
  },
  social: {
    followers: (user_id: string) => httpGet(`/users/${user_id}/followers`),
    following: (user_id: string) => httpGet(`/users/${user_id}/following`),
    follow: (user_id: string) => httpPost(`/users/${user_id}/follow`),
    unfollow: (user_id: string) => httpDelete(`/users/${user_id}/follow`),
  },
  notifications: {
    list: () => httpGet('/notifications'),
    markRead: (id: string) => httpPost(`/notifications/${id}/read`),
  },
  leaderboard: (scope: 'squad' | 'global', metric: 'streak' | 'hype') =>
    httpGet(`/leaderboard?scope=${scope}&metric=${metric}`),
  aiCoach: {
    send: (message: string) => httpPost('/ai-coach/messages', { message }),
    history: () => httpGet('/ai-coach/history'),
  },
  coaches: {
    list: () => httpGet('/coaches'),
    book: (id: string, payload: BookingInput) => httpPost(`/coaches/${id}/book`, payload),
  },
  milestoneCards: (input: MilestoneCardInput) => httpPost('/milestone-cards', input),
  reels: {
    upload: (input: ReelInput) => httpPost('/reels', input),
    feed: (cursor?: string) => httpGet(`/reels/feed${cursor ? `?cursor=${cursor}` : ''}`),
  },
  settings: {
    update: (input: SettingsPatch) => httpPatch('/settings', input),
    upgradeSubscription: (payload: UpgradeInput) => httpPost('/subscriptions/upgrade', payload),
  },
  devices: {
    register: (token: string, platform: 'ios' | 'android') =>
      httpPost('/devices/register', { token, platform }),
  },
};
```

All requests attach the Supabase session's access token as a Bearer header, sourced from `AuthContext` (handled inside the `request()` helper above, not repeated per-call). A 401 response SHALL trigger sign-out and route to Auth (also handled centrally in `request()`).

## 5. Realtime (Squad Chat, Body Double)

Use Supabase Realtime channels directly from the client (not through the REST API), matching the backend's channel naming convention:
- `squad:{squad_id}:channel:{channel_id}` for chat
- `bodydouble:{room_id}` for presence

Subscribe on screen focus, unsubscribe on blur/unmount — never leave dangling subscriptions across screens.

## 6. Optimistic UI pattern (Hype)

1. On tap: immediately flip local hype state + increment count in component state
2. Fire the API call in the background
3. On success: reconcile with server response (usually a no-op if optimistic state matched)
4. On failure: revert local state, show a brief non-blocking error toast

Apply the same pattern to check-in taps, but disable the button during the in-flight request (check-ins are not safely re-tappable the way hype is, since a double-tap racing the "already checked in today" state would show a confusing flash).

## 7. Theming

Light: white background, orange (#FF6B35 or similar — match existing brand mark) as accent.
Dark: near-black background, same orange accent.
Theme choice persists via `AsyncStorage` (this is a non-sensitive preference — do not use secure-store for this).

## 8. Push notifications

On login (and periodically on app open), request notification permission, get the Expo push token, and call `api.devices.register()`. Do not block app usage if the user denies permission — just skip registration.

## 9. What's "fully wired" vs "scaffolded" for the first build pass

To keep Kiro's first pass focused and avoid enormous scope in one go, tasks.md sequences the **core loop** first (Auth → Home Feed → Goal Dashboard/check-in → AI Coach) as fully wired end-to-end, then expands to the remaining 19 screens using the identical patterns (same API client, same theme, same navigation conventions) established by the core loop.
