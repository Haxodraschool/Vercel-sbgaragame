// ============================================
// API Helper — Fetch wrapper with JWT
// ============================================

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Lỗi không xác định',
      response.status,
      data
    );
  }

  return data as T;
}

// ─── Auth ───
export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: Record<string, unknown> }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (username: string, password: string) =>
      request<{ token: string; user: Record<string, unknown> }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },

  // ─── User ───
  user: {
    profile: () => request<Record<string, unknown>>('/user/profile'),
    inventory: () => request<Record<string, unknown>>('/user/inventory'),
    crew: () => request<Record<string, unknown>>('/user/crew'),
  },

  // ─── Quest ───
  quest: {
    daily: () => request<Record<string, unknown>>('/quest/daily'),
    generateDaily: () => request<Record<string, unknown>>('/quest/daily', { method: 'POST' }),
    complete: (questId: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/quest/${questId}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Cards ───
  cards: {
    list: () => request<Record<string, unknown>>('/cards'),
    get: (id: number) => request<Record<string, unknown>>(`/cards/${id}`),
    combos: (cardId?: number) =>
      request<Record<string, unknown>>(`/cards/combos${cardId ? `?cardId=${cardId}` : ''}`),
  },

  // ─── Workshop ───
  workshop: {
    test: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/workshop/test', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Shop ───
  shop: {
    items: () => request<Record<string, unknown>>('/shop/items'),
    buy: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/shop/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reroll: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/shop/reroll', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Events ───
  events: {
    random: () => request<Record<string, unknown>>('/events/random'),
    respond: (eventId: number, accepted: boolean) =>
      request<Record<string, unknown>>('/events/random', {
        method: 'POST',
        body: JSON.stringify({ eventId, accepted }),
      }),
    smuggler: () => request<Record<string, unknown>>('/events/smuggler'),
    smugglerBuy: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/events/smuggler', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Game ───
  game: {
    endDay: () => request<Record<string, unknown>>('/game/end-day'),
    endDayPost: () => request<Record<string, unknown>>('/game/end-day', { method: 'POST' }),
    stats: () => request<Record<string, unknown>>('/game/stats'),
    leaderboard: (sortBy?: string) =>
      request<Record<string, unknown>>(`/game/leaderboard${sortBy ? `?sortBy=${sortBy}` : ''}`),
    endings: () => request<Record<string, unknown>>('/game/endings'),
    config: () => request<Record<string, unknown>>('/game/config'),
    perks: () => request<Record<string, unknown>>('/game/perks'),
    upgrade: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/game/upgrade', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reset: () => request<Record<string, unknown>>('/game/reset', { method: 'POST' }),
    finalRound: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/game/final-round', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Achievements ───
  achievements: {
    list: () => request<Record<string, unknown>>('/achievements'),
    secret: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/achievements/secret', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Boss ───
  boss: {
    configs: (id?: number) =>
      request<Record<string, unknown>>(`/boss/configs${id ? `?id=${id}` : ''}`),
  },
};

export const apiCall = request;
