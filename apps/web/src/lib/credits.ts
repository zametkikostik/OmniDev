export const CREDIT_COSTS = {
  generate: 10,
  edit: 3,
  vision: 15,
  heal: 5,
  chat: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

const LOCAL_KEY = 'omnidev_credits_v1';

export function getLocalCredits(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw === null) {
      localStorage.setItem(LOCAL_KEY, '50');
      return 50;
    }
    return parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

export function setLocalCredits(n: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, String(Math.max(0, n)));
}

export function deductLocalCredits(action: CreditAction): { ok: boolean; remaining: number; cost: number } {
  const cost = CREDIT_COSTS[action];
  const current = getLocalCredits();
  if (current < cost) return { ok: false, remaining: current, cost };
  const remaining = current - cost;
  setLocalCredits(remaining);
  return { ok: true, remaining, cost };
}
