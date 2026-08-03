import { test } from 'node:test';
import assert from 'node:assert/strict';

function validate(files) {
  if (!files || typeof files !== 'object') return { ok: false };
  const REQUIRED = ['package.json', 'app/page.tsx', 'app/layout.tsx', 'app/globals.css'];
  const missing = REQUIRED.filter((p) => !files[p]);
  if (missing.length) return { ok: false, missing };
  try {
    const pkg = JSON.parse(files['package.json']);
    if (!pkg.dependencies?.next && !pkg.dependencies?.react) return { ok: false };
  } catch {
    return { ok: false };
  }
  return { ok: true };
}

test('rejects empty', () => {
  assert.equal(validate(null).ok, false);
});

test('accepts minimal project', () => {
  const r = validate({
    'package.json': JSON.stringify({ dependencies: { next: '15', react: '19' } }),
    'app/page.tsx': 'export default function Page(){return null}',
    'app/layout.tsx': 'export default function L({children}){return children}',
    'app/globals.css': 'body{}',
  });
  assert.equal(r.ok, true);
});
