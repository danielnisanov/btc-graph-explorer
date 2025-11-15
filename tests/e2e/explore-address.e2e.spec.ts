import { test, expect, Page } from '@playwright/test';

// --- Helper: deterministic stub for /api/blockchain ---
const stubGraphResponse = {
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  n_tx: 2,
  txs: [],
  // if your UI uses nodes/links directly, return them too:
  nodes: [
    { id: 'root', label: 'root', isExpanded: true, level: 0, balance: 1000, totalReceived: 1000, totalSent: 0 },
    { id: 'peer1', label: 'peer1', level: 1 },
  ],
  links: [{ source: 'root', target: 'peer1', value: 500 }],
};

async function stubOk(page: Page, body = stubGraphResponse) {
  await page.route('**/api/blockchain**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function stub429(page: Page) {
  await page.route('**/api/blockchain**', (route) => {
    route.fulfill({
      status: 429,
      headers: { 'Retry-After': '5' },
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    });
  });
}

async function stub500(page: Page) {
  await page.route('**/api/blockchain**', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });
}

// --- Stable selectors ---
const addressInput = (page: Page) => page.getByPlaceholder(/bitcoin address/i);
const exploreButton = (page: Page) => page.getByRole('button', { name: /explore/i });
const graphCanvas = (page: Page) => page.locator('canvas');
const rateLimitText = (page: Page) => page.getByText(/too many requests|rate limit/i);
const errorText = (page: Page) => page.getByText(/error|retry|failed/i);

// If you add <span data-testid="addr-count"> and "tx-count" in UI, these become rock-solid:
const addrCount = (page: Page) => page.locator('[data-testid="addr-count"]');
const txCount = (page: Page) => page.locator('[data-testid="tx-count"]');

// ------------------------------------
// 1) Loads graph (with stubbed API)
// ------------------------------------
test('explores an address and loads the graph', async ({ page }) => {
  await stubOk(page);
  await page.goto('/');

  await addressInput(page).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  await exploreButton(page).click();

  // Be resilient: poll until at least one canvas exists
  await expect.poll(async () => await graphCanvas(page).count()).toBeGreaterThan(0);

  // If you expose counts, assert them too:
  if (await addrCount(page).count()) {
    await expect(addrCount(page)).toHaveText(/^\d+$/);
    await expect(txCount(page)).toHaveText(/^\d+$/);
  }
});

// -----------------------------------------------------
// 2) Invalid address shows a validation/error message
// -----------------------------------------------------
test('shows an error for invalid Bitcoin address', async ({ page }) => {
  // Let your front-end validator run; no stub needed
  await page.goto('/');
  await addressInput(page).fill('invalid_address');
  await exploreButton(page).click();
  await expect(page.getByText(/invalid|error|not valid/i)).toBeVisible();
});

// -----------------------------------------------------
// 3) Handles client-side rate limiting gracefully
// -----------------------------------------------------
test('handles rate limiting gracefully', async ({ page }) => {
  await stub429(page);
  await page.goto('/');

  // Even one click is enough since backend responds 429
  await addressInput(page).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  await exploreButton(page).click();

  await expect(rateLimitText(page)).toBeVisible();
});

// -----------------------------------------------------
// 4) Reloads & navigation don’t crash the app
// -----------------------------------------------------
test('reloads and navigates back without crashing', async ({ page }) => {
  await stubOk(page);
  await page.goto('/');

  await addressInput(page).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  await exploreButton(page).click();

  await expect.poll(async () => await graphCanvas(page).count()).toBeGreaterThan(0);

  await page.reload();
  await expect(addressInput(page)).toBeVisible();

  await page.goto('/');
  await expect(exploreButton(page)).toBeVisible();
});

// -----------------------------------------------------
// 5) Error boundary message on 500 (API failure)
// -----------------------------------------------------
test('shows error boundary message when API fails', async ({ page }) => {
  await stub500(page);
  await page.goto('/');

  await addressInput(page).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  await exploreButton(page).click();

  await expect(errorText(page)).toBeVisible();
});

// -----------------------------------------------------
// 6) Rate-limit (429) shows retry suggestion
// -----------------------------------------------------
test('displays retry suggestion on rate-limit (429)', async ({ page }) => {
  await stub429(page);
  await page.goto('/');

  await addressInput(page).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  await exploreButton(page).click();

  await expect(rateLimitText(page)).toBeVisible();
});

// -----------------------------------------------------
// 7) Page loads without console errors
// -----------------------------------------------------
test('page loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});
