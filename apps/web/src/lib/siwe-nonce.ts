const nonces = new Map<string, { nonce: string; exp: number }>();

export function setNonce(address: string, nonce: string, ttlMs = 10 * 60 * 1000) {
  nonces.set(address.toLowerCase(), { nonce, exp: Date.now() + ttlMs });
}

export function consumeNonce(address: string, nonce: string): boolean {
  const key = address.toLowerCase();
  const entry = nonces.get(key);
  if (!entry) return false;
  if (Date.now() > entry.exp) {
    nonces.delete(key);
    return false;
  }
  if (entry.nonce !== nonce) return false;
  nonces.delete(key);
  return true;
}
