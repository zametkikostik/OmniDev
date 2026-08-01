import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('OmniDev smoke', () => {
  test('health endpoint', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('omnidev');
  });

  test('landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/landing`);
    await expect(page.getByText('OmniDev')).toBeVisible();
  });

  test('main chat UI loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText('OmniDev')).toBeVisible();
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await expect(page.locator('body')).toContainText(/OpenRouter|Ollama|Настрой/i);
  });

  test('billing page loads', async ({ page }) => {
    await page.goto(`${BASE}/billing`);
    await expect(page.locator('body')).toContainText(/Starter|Pro|MetaMask|Stripe|пополн/i);
  });

  test('generate API responds', async ({ request }) => {
    const res = await request.post(`${BASE}/api/generate`, {
      data: { prompt: 'hello world landing', settings: { activeProvider: 'openrouter' } },
    });
    expect([200, 400, 401, 402, 500]).toContain(res.status());
    const body = await res.json();
    if (res.ok() && body.files) {
      expect(body.files['package.json'] || body.demo).toBeTruthy();
    }
  });

  test('admin rejects without secret', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/credits?list=1`);
    expect(res.status()).toBe(401);
  });
});
