const BLOCKED = [
  /\b(child\s*porn|csam|child\s*sex)\b/i,
  /\b(make\s+a\s+bomb|build\s+an\s+explosive)\b/i,
  /\b(credit\s*card\s*dump|carding\s+tutorial)\b/i,
  /\b(ransomware\s+builder|malware\s+kit)\b/i,
];

const WARN = [/\b(hack\s+into|steal\s+password|phishing\s+page)\b/i];

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string; soft?: boolean };

export function moderatePrompt(prompt: string): GuardResult {
  const text = (prompt || '').trim();
  if (!text) return { ok: false, reason: 'Пустой запрос' };
  if (text.length > 20_000) return { ok: false, reason: 'Слишком длинный запрос' };
  for (const re of BLOCKED) {
    if (re.test(text)) {
      return { ok: false, reason: 'Запрос нарушает правила OmniDev' };
    }
  }
  for (const re of WARN) {
    if (re.test(text)) {
      return {
        ok: false,
        soft: true,
        reason: 'Запрос похож на вредоносный. Переформулируй.',
      };
    }
  }
  return { ok: true };
}
