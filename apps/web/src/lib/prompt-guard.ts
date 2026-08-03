export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string; soft?: boolean; code?: string };

const BLOCKED: RegExp[] = [
  /child\s*porn|csam|педофил/i,
  /\b(make|build|craft)\b.{0,40}\b(bomb|explosive|ricin|sarin)\b/i,
  /как\s+(сделать|собрать).{0,30}(бомб|взрывчат)/i,
  /\bkill\s+(yourself|himself|herself)\b/i,
];

const WARN: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*prompt|jailbreak|DAN\s*mode/i,
  /выведи\s+(свой|system)\s*промпт/i,
  /steal\s+(api\s*)?keys?|exfiltrat/i,
  /sql\s*injection|xss\s*payload/i,
  /ransomware|keylogger/i,
];

export function moderatePrompt(prompt: string): GuardResult {
  const text = (prompt || '').trim();
  if (!text) return { ok: false, reason: 'Пустой запрос', code: 'empty' };
  if (text.length > 20_000) return { ok: false, reason: 'Слишком длинный запрос', code: 'too_long' };

  for (const re of BLOCKED) {
    if (re.test(text)) {
      return {
        ok: false,
        reason: 'Запрос нарушает правила использования OmniDev',
        code: 'blocked',
      };
    }
  }
  for (const re of WARN) {
    if (re.test(text)) {
      return {
        ok: false,
        soft: true,
        reason: 'Запрос похож на вредоносный. Переформулируй без обхода защиты.',
        code: 'soft_block',
      };
    }
  }
  return { ok: true };
}
