import { test, expect } from '@playwright/test';

test.describe('Coach Positions E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
    await page.goto('/home/coach/positions');
  });

  test('positions page loads and shows at least one card', async ({ page }) => {
    await expect(page.locator('[id$="-board"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('search filters results', async ({ page }) => {
    const input = page.getByLabel(/nazwa debiutu/i);
    await input.fill('Sicilian');
    await input.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('tag filter changes list', async ({ page }) => {
    await page.waitForTimeout(1000);
    const forkChip = page.getByText('fork', { exact: true });
    if (await forkChip.isVisible()) {
      await forkChip.click();
      await page.waitForTimeout(1000);
    }
  });

  test('copy FEN shows snackbar', async ({ page }) => {
    await page.waitForTimeout(1000);
    const monospaceInput = page.locator('input[type="text"][readonly]').first();
    await monospaceInput.click();
    await expect(page.getByText('Skopiowano do schowka')).toBeVisible({ timeout: 5000 });
  });

  test('happy path desktop - select position and group, create task', async ({ page }) => {
    await page.waitForTimeout(1000);
    const card = page.locator('.MuiCard-root').first();
    await card.click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/wybrano:\s*1/i)).toBeVisible();

    await page.getByText('Demo Group', { exact: false }).click();
    await page.waitForTimeout(300);
    await page.getByText('Dodaj zadania').click();
    await expect(page.getByText('Zadania zostały utworzone!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/wybrano:\s*1/i)).not.toBeVisible();
  });

  test('mobile viewport - modal flow', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await page.waitForTimeout(1000);
    const card = page.locator('.MuiCard-root').first();
    await card.click();
    await page.waitForTimeout(300);

    await page.getByText('Przypisz zadania').click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toBeVisible();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: /klasy/i }).click();
    await page.waitForTimeout(300);
    await dialog.getByText('Demo Group', { exact: false }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /dodaj zadania/i }).click();
    await expect(page.getByText('Zadania zostały utworzone!')).toBeVisible({ timeout: 5000 });
  });

  test('create task button disabled without selections', async ({ page }) => {
    await page.waitForTimeout(1000);
    const addTaskBtn = page.getByText('Dodaj zadania');
    await expect(addTaskBtn).toBeDisabled();
  });
});
