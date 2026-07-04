import Constants from 'expo-constants';
import { supabase } from './supabase';

// ---------- Config ----------
const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string;

// ---------- Token + sign-out helpers ----------
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ---------- Base HTTP helpers ----------
async function request(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    await signOut();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const httpGet = (path: string) => request('GET', path);
const httpPost = (path: string, body?: unknown) => request('POST', path, body);
const httpPatch = (path: string, body?: unknown) => request('PATCH', path, body);
const httpDelete = (path: string) => request('DELETE', path);

// ---------- Wire-format types (snake_case, matching Postgres columns) ----------

export interface OAuthPayload {
  id_token: string;
  nonce?: string;
}

export interface ProfilePatch {
  name?: string;
  avatar_color?: string;
  interests?: string[];
  default_visibility?: 'public' | 'squad';
  bio?: string;
}

export interface GoalInput {
  category: string;
  description: string;
  deadline: string;
  cadence: 'daily' | 'weekly' | 'custom';
  target_checkins: number;
  visibility: 'public' | 'squad';
}

export interface PostInput {
  body: string;
  goal_id?: string;
  type?: 'win' | 'progress' | 'needs_hype';
  attachment_url?: string;
}

export interface SquadInput {
  emoji: string;
  name: string;
  category: string;
  visibility: 'public' | 'private';
}

export interface BookingInput {
  slot: string;
  notes?: string;
}

export interface MilestoneCardInput {
  goal_id: string;
  milestone_percent: number;
}

export interface ReelInput {
  goal_id: string;
  video_url: string;
  caption?: string;
  duration: number;
}

export interface SettingsPatch {
  push_enabled?: boolean;
  visibility?: 'public' | 'squad';
  ai_tips_enabled?: boolean;
  theme?: 'light' | 'dark';
}

export interface UpgradeInput {
  plan: string;
  payment_token: string;
}

// ---------- Typed API client ----------

export const api = {
  auth: {
    requestOtp: (phone: string) => httpPost('/auth/otp/request', { phone }),
    verifyOtp: (phone: string, code: string) =>
      httpPost('/auth/otp/verify', { phone, code }),
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
    checkin: (id: string) => httpPost(`/goals/${id}/checkins`),
  },
  feed: {
    list: (cursor?: string) =>
      httpGet(`/feed${cursor ? `?cursor=${cursor}` : ''}`),
  },
  posts: {
    create: (input: PostInput) => httpPost('/posts', input),
    hype: (id: string) => httpPost(`/posts/${id}/hype`),
    comments: (id: string) => httpGet(`/posts/${id}/comments`),
    addComment: (id: string, body: string) =>
      httpPost(`/posts/${id}/comments`, { body }),
    draftAssist: (goal_id: string) =>
      httpPost('/posts/draft-assist', { goal_id }),
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
    send: (id: string, body: string) =>
      httpPost(`/channels/${id}/messages`, { body }),
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
    book: (id: string, payload: BookingInput) =>
      httpPost(`/coaches/${id}/book`, payload),
  },
  milestoneCards: (input: MilestoneCardInput) =>
    httpPost('/milestone-cards', input),
  reels: {
    upload: (input: ReelInput) => httpPost('/reels', input),
    feed: (cursor?: string) =>
      httpGet(`/reels/feed${cursor ? `?cursor=${cursor}` : ''}`),
  },
  settings: {
    update: (input: SettingsPatch) => httpPatch('/settings', input),
    upgradeSubscription: (payload: UpgradeInput) =>
      httpPost('/subscriptions/upgrade', payload),
  },
  devices: {
    register: (token: string, platform: 'ios' | 'android') =>
      httpPost('/devices/register', { token, platform }),
  },
};
