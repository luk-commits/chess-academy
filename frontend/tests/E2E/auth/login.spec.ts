import { test, expect } from '@playwright/test';

test.describe('Formularz Logowania', () => {

  // --- Stany przycisku submit ---

  test('przycisk submit jest nieaktywny gdy oba pola są puste', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy wypełniony tylko e-mail', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy wypełnione tylko hasło', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('przycisk submit jest aktywny gdy oba pola są wypełnione', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  // --- Atrybuty pól ---

  test('pole e-mail ma atrybut required', async ({ page }) => {
    await page.goto('/login');
    const isRequired = await page.locator('input[autocomplete="email"]').getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('pole hasła ma atrybut required', async ({ page }) => {
    await page.goto('/login');
    const isRequired = await page.locator('input[autocomplete="current-password"]').getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('pole hasła ma domyślnie typ password (hasło jest zasłonięte)', async ({ page }) => {
    await page.goto('/login');
    const inputType = await page.locator('input[autocomplete="current-password"]').getAttribute('type');
    expect(inputType).toBe('password');
  });

  // --- Przełącznik widoczności hasła ---

  test('przełącznik widoczności hasła zmienia typ pola na text', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="current-password"]', 'password123');

    await page.click('button[aria-label="toggle password visibility"]');

    const inputType = await page.locator('input[autocomplete="current-password"]').getAttribute('type');
    expect(inputType).toBe('text');
  });

  // --- Pomyślne logowanie ---

  test('poprawne dane logowania przekierowują na /home', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

  test('spacje wokół adresu e-mail są ignorowane (trimming)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', '  coach@chess.local  ');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

  // --- Błędy uwierzytelnienia ---

  test('błędne hasło wyświetla komunikat błędu i nie przekierowuje', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'zle_haslo');
    await page.click('button[type="submit"]');

    const error = page.getByRole('alert').filter({ hasText: /Invalid credentials|Nieprawidłowe dane logowania/i });
    await expect(error).toBeVisible();
    await expect(page).not.toHaveURL(/\/home/);
  });

  test('nieistniejący użytkownik wyświetla komunikat błędu', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'nieistnieje@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).not.toHaveURL(/\/home/);
  });

  test('komunikat błędu znika po poprawnym zalogowaniu po wcześniejszym błędzie', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'zle_haslo');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('alert')).toBeVisible();

    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

  // --- Walidacja formatu emaila ---

  test('nieprawidłowy format emaila wyświetla błąd i blokuje submit', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'nieprawidlowy');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.getByText(/nieprawidłowy adres email/i)).toBeVisible();
  });

  test('poprawienie formatu emaila usuwa błąd walidacji', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'nieprawidlowy');
    await expect(page.getByText(/nieprawidłowy adres email/i)).toBeVisible();
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await expect(page.getByText(/nieprawidłowy adres email/i)).not.toBeVisible();
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  // --- Ochrona tras ---

  test('niezalogowany użytkownik próbujący wejść na /home jest przekierowany na /login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('zalogowany użytkownik wchodzący na /login jest przekierowany na /home', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/home/);
  });

  // --- Pełen cykl: logowanie → wylogowanie → ponowne logowanie ---

  test('pełen cykl: logowanie → wylogowanie → ponowne logowanie', async ({ page }) => {
    // Krok 1: Zaloguj
    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'coach@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    // Krok 2: Wyloguj się z /home
    await page.goto('/logout');
    await expect(page).toHaveURL(/\/login/);

    // Krok 3: Ponowne logowanie z innym kontem
    await page.fill('input[autocomplete="email"]', 'player@chess.local');
    await page.fill('input[autocomplete="current-password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

});
