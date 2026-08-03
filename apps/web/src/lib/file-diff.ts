export function summarizeDiff(
  before: Record<string, string>,
  after: Record<string, string>
): { added: string[]; removed: string[]; changed: string[]; summary: string } {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (!(k in before)) added.push(k);
    else if (!(k in after)) removed.push(k);
    else if (before[k] !== after[k]) changed.push(k);
  }
  const parts: string[] = [];
  if (changed.length)
    parts.push(
      `изменено: ${changed.slice(0, 8).join(', ')}${changed.length > 8 ? '…' : ''}`
    );
  if (added.length) parts.push(`добавлено: ${added.slice(0, 5).join(', ')}`);
  if (removed.length) parts.push(`удалено: ${removed.slice(0, 5).join(', ')}`);
  return {
    added,
    removed,
    changed,
    summary: parts.join(' · ') || 'без изменений файлов',
  };
}
