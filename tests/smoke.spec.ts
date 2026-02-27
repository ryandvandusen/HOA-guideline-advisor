import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify the core pages load and key UI elements are present.
 * These tests do NOT call the Claude API or submit real data.
 */

test.describe('Homeowner Portal', () => {
  // Authenticate through the passcode gate before each homeowner test.
  test.beforeEach(async ({ page }) => {
    const passcode = process.env.HOMEOWNER_PASSCODE ?? 'murrayhill2026';
    await page.goto('/gate');
    await page.getByPlaceholder('Passcode').fill(passcode);
    await page.getByRole('button', { name: 'Enter Portal' }).click();
    await page.waitForURL('/');
  });

  test('homepage loads with header and all three tabs', async ({ page }) => {
    await page.goto('/');

    // Header
    await expect(page.getByRole('heading', { name: 'Murrayhill HOA Guideline Advisor' })).toBeVisible();

    // All three tab triggers
    await expect(page.getByRole('tab', { name: /Check Compliance/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /HOA Guidelines/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Report a Violation/i })).toBeVisible();

    // Admin link in header
    await expect(page.getByRole('link', { name: /Admin/i })).toBeVisible();
  });

  test('Check Compliance tab is active by default and shows upload area', async ({ page }) => {
    await page.goto('/');

    const complianceTab = page.getByRole('tab', { name: /Check Compliance/i });
    await expect(complianceTab).toHaveAttribute('data-state', 'active');

    // Upload/drop zone prompt text
    await expect(page.getByText(/drag.*drop|upload|photo/i).first()).toBeVisible();
  });

  test('HOA Guidelines tab switches and renders PDF viewer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: /HOA Guidelines/i }).click();

    // The guidelines panel renders an iframe embedding the combined PDF
    await expect(page.locator('iframe[title="HOA Design Guidelines"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Report a Violation tab shows the report form', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: /Report a Violation/i }).click();

    // Form fields
    await expect(page.getByLabel(/property address/i)).toBeVisible();
    await expect(page.getByLabel(/describe the violation/i)).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /submit anonymous report/i })).toBeVisible();
  });

  test('footer is present on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Murrayhill HOA.*Beaverton/i)).toBeVisible();
  });
});

test.describe('Admin Portal', () => {
  test('/admin renders the login form', async ({ page }) => {
    await page.goto('/admin');

    // Login form elements
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('admin login rejects bad credentials', async ({ page }) => {
    await page.goto('/admin');

    await page.getByLabel(/username/i).fill('wrong');
    await page.getByLabel(/password/i).fill('wrong');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should show an error message, not navigate away
    await expect(page.getByText(/invalid|incorrect|failed|unauthorized/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).toHaveURL(/\/admin/);
  });
});
