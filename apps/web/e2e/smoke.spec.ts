import { test, expect } from '@playwright/test';

test('health / home', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('generate API returns files or demo', async ({ request }) => {
  const res = await request.post('/api/generate', {
    data: { prompt: 'landing page for coffee shop' },
  });
  expect(res.status()).toBeLessThan(500);
  const data = await res.json();
  if (res.ok) {
    expect(data.files || data.demo).toBeTruthy();
    if (data.files) {
      expect(data.files['package.json'] || data.files['app/page.tsx']).toBeTruthy();
    }
  }
});
