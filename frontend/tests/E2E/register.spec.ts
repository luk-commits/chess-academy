import { test, expect } from '@playwright/test';

const FULL_NAME_INPUT = 'input[required][type="text"], input[required]:not([type])';
const EMAIL_INPUT = 'input[type="email"]';
const PASSWORD_INPUT = 'input[type="password"]:first-of-type';
const SUBMIT_BTN = 'button[type="submit"]';

// Helpers
async function fillName(page: any, value: string) {
  await page.locator('label', { hasText: 'Imię i Nazwisko' }).locator('..').locator('input').fill(value);
}
async function fillEmail(page: any, value: string) {
  await page.locator('input[type="email"]').fill(value);
}
async function fillPassword(page: any, value: string) {
  await page.locator('label', { hasText: /^Hasło/ }).locator('..').locator('input').fill(value);
}
async function fillConfirmPassword(page: any, value: string) {
  await page.locator('label', { hasText: 'Potwierdź hasło' }).locator('..').locator('input').fill(value);
}
async function fillValidForm(page: any, overrides: { email?: string; password?: string; confirm?: string; name?: string } = {}) {
  const unique = Date.now();
  await fillName(page, overrides.name ?? 'Jan Kowalski');
  await fillEmail(page, overrides.email ?? `test${unique}@chess.local`);
  await fillPassword(page, overrides.password ?? 'Password123!');
  await fillConfirmPassword(page, overrides.confirm ?? 'Password123!');
}

test.describe('Formularz Rejestracji', () => {

  // --- Stan przycisku submit ---

  test('przycisk submit jest nieaktywny gdy wszystkie pola są puste', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy brak imienia i nazwiska', async ({ page }) => {
    await page.goto('/register');
    await fillEmail(page, 'jan@chess.local');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy brak e-mail', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Jan Kowalski');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy brak hasła', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Jan Kowalski');
    await fillEmail(page, 'jan@chess.local');
    await fillConfirmPassword(page, 'Password123!');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy brak potwierdzenia hasła', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Jan Kowalski');
    await fillEmail(page, 'jan@chess.local');
    await fillPassword(page, 'Password123!');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

    test('przycisk submit jest nieaktywny gdy hasła się nie zgadzają', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Jan Kowalski');
    await fillEmail(page, 'jan@chess.local');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'InneHaslo!');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

  test('przycisk submit jest nieaktywny gdy hasło jest za krótkie', async ({ page }) => {
    await page.goto('/register');
    await fillValidForm(page, { password: 'Ab1!', confirm: 'Ab1!' });
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
    await expect(page.getByText('Hasło musi mieć co najmniej 8 znaków').first()).toBeVisible();
  });

  test('przycisk submit jest nieaktywny gdy hasło nie zawiera dużej litery', async ({ page }) => {
    await page.goto('/register');
    await fillValidForm(page, { password: 'password123!', confirm: 'password123!' });
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 dużą literę').first()).toBeVisible();
  });

  test('przycisk submit jest nieaktywny gdy hasło nie zawiera małej litery', async ({ page }) => {
    await page.goto('/register');
    await fillValidForm(page, { password: 'PASSWORD123!', confirm: 'PASSWORD123!' });
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 małą literę').first()).toBeVisible();
  });

  test('przycisk submit jest aktywny gdy wszystkie pola są poprawnie wypełnione', async ({ page }) =>
 {
    await page.goto('/register');
    await fillValidForm(page);
    await expect(page.locator(SUBMIT_BTN)).toBeEnabled();
  });

  test('przycisk submit jest nieaktywny gdy email jest nieprawidlowy', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Jan Kowalski');
    await fillEmail(page, 'invalid-email');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await expect(page.locator(SUBMIT_BTN)).toBeDisabled();
  });

  // --- Walidacja email ---

  test('wyswietla sie komunikat o nieprawidlowym adresie email', async ({ page }) => {
    await page.goto('/register');
    await fillEmail(page, 'invalid-email');
    await expect(page.getByText('Nieprawidłowy adres email').first()).toBeVisible();
  });

  test('komunikat o nieprawidlowym emailu znika po podaniu poprawnego emaila', async ({ page }) => {
    await page.goto('/register');
    await fillEmail(page, 'invalid-email');
    await expect(page.getByText('Nieprawidłowy adres email').first()).toBeVisible();
    await fillEmail(page, 'valid@chess.local');
    await expect(page.getByText('Nieprawidłowy adres email').first()).not.toBeVisible();
  });

  test('komunikat o nieprawidlowym emailu nie pojawia sie gdy pole jest puste', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Nieprawidłowy adres email').first()).not.toBeVisible();
  });

  // --- Walidacja zgodności haseł ---

  test('komunikat o niezgodnych hasłach pojawia się gdy potwierdzenie jest różne', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Inne456!');
    await expect(page.getByText('Hasła nie są identyczne').first()).toBeVisible();
  });

  test('komunikat o niezgodnych hasłach nie pojawia się gdy hasła są zgodne', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await expect(page.getByText('Hasła nie są identyczne').first()).not.toBeVisible();
  });

  test('komunikat o niezgodnych hasłach nie pojawia się gdy pole potwierdzenia jest puste', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Password123!');
    await expect(page.getByText('Hasła nie są identyczne').first()).not.toBeVisible();
  });

  test('komunikat o niezgodnych hasłach znika po poprawieniu hasła', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Zlel');
    await expect(page.getByText('Hasła nie są identyczne').first()).toBeVisible();
    await fillConfirmPassword(page, 'Password123!');
    await expect(page.getByText('Hasła nie są identyczne').first()).not.toBeVisible();
  });

  // --- Walidacja haseł na żywo (live) ---

  test('live: za krótkie hasło wyświetla komunikat o min 8 znakach', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Ab1!');
    await expect(page.getByText('Hasło musi mieć co najmniej 8 znaków').first()).toBeVisible();
  });

  test('live: hasło bez dużej litery wyświetla odpowiedni komunikat', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'password123!');
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 dużą literę').first()).toBeVisible();
  });

  test('live: hasło bez małej litery wyświetla odpowiedni komunikat', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'PASSWORD123!');
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 małą literę').first()).toBeVisible();
  });

  test('live: komunikat o małej literze znika po dodaniu małej litery', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'PASSWORD123!');
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 małą literę').first()).toBeVisible();
    await fillPassword(page, 'Password123!');
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 małą literę').first()).not.toBeVisible();
  });

  test('live: komunikat o dużej literze znika po dodaniu dużej litery', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'password123!');
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 dużą literę').first()).toBeVisible();
    await fillPassword(page, 'Password123!');
    await expect(page.getByText('Hasło musi zawierać co najmniej 1 dużą literę').first()).not.toBeVisible();
  });

  test('live: komunikat o min 8 znakach znika po wydłużeniu hasła', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Ab1!');
    await expect(page.getByText('Hasło musi mieć co najmniej 8 znaków').first()).toBeVisible();
    await fillPassword(page, 'Abcdef12!');
    await expect(page.getByText('Hasło musi mieć co najmniej 8 znaków').first()).not.toBeVisible();
  });

  // --- Atrybuty pól ---

  test('pole e-mail ma typ email', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toHaveCount(1);
  });

  test('pole hasła ma domyślnie typ password', async ({ page }) => {
    await page.goto('/register');
    const inputs = page.locator('label', { hasText: /^Hasło/ }).locator('..').locator('input');
    await expect(inputs).toHaveAttribute('type', 'password');
  });

  test('pole potwierdzenia hasła ma domyślnie typ password', async ({ page }) => {
    await page.goto('/register');
    const inputs = page.locator('label', { hasText: 'Potwierdź hasło' }).locator('..').locator('input');
    await expect(inputs).toHaveAttribute('type', 'password');
  });

  // --- Przełącznik widoczności hasła ---

  test('kliknięcie ikony oka zmienia typ pola hasło na text', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Password123!');
    // Oba pola hasła mają wspólny stan showPassword
    await page.locator('.MuiInputAdornment-positionEnd button').first().click();
    const inputType = await page.locator('label', { hasText: /^Hasło/ }).locator('..').locator('input').getAttribute('type');
    expect(inputType).toBe('text');
  });

  test('kliknięcie ikony oka zmienia typ pola potwierdź hasło na text', async ({ page }) => {
    await page.goto('/register');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator('.MuiInputAdornment-positionEnd button').first().click();
    const inputType = await page.locator('label', { hasText: 'Potwierdź hasło' }).locator('..').locator('input').getAttribute('type');
    expect(inputType).toBe('text');
  });

  test('ponowne kliknięcie ikony oka przywraca typ password', async ({ page }) => {
    await page.goto('/register');
    await fillPassword(page, 'Password123!');
    const toggleBtn = page.locator('.MuiInputAdornment-positionEnd button').first();
    await toggleBtn.click();
    await toggleBtn.click();
    const inputType = await page.locator('label', { hasText: /^Hasło/ }).locator('..').locator('input').getAttribute('type');
    expect(inputType).toBe('password');
  });

  // --- Wybór roli ---

  test('domyślnie wybrana rola to Gracz', async ({ page }) => {
    await page.goto('/register');
    const graczbtn = page.getByRole('button', { name: 'Gracz' });
    await expect(graczbtn).toHaveAttribute('class', /MuiButton-contained/);
  });

  test('kliknięcie Trener zmienia aktywną rolę', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Trener' }).click();
    await expect(page.getByRole('button', { name: 'Trener' })).toHaveAttribute('class', /MuiButton-contained/);
    await expect(page.getByRole('button', { name: 'Gracz' })).toHaveAttribute('class', /MuiButton-outlined/);
  });

  test('kliknięcie Gracz po wybraniu Trener wraca do roli Gracz', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Trener' }).click();
    await page.getByRole('button', { name: 'Gracz' }).click();
    await expect(page.getByRole('button', { name: 'Gracz' })).toHaveAttribute('class', /MuiButton-contained/);
  });

  // --- Pomyślna rejestracja ---

  test('pomyślna rejestracja przekierowuje na /login', async ({ page }) => {
    await page.goto('/register');
    await fillValidForm(page);
    await page.locator(SUBMIT_BTN).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('pomyślna rejestracja z rolą Trener przekierowuje na /login', async ({ page }) => {
    await page.goto('/register');
    const unique = Date.now();
    await fillName(page, 'Anna Nowak');
    await fillEmail(page, `coach${unique}@chess.local`);
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.getByRole('button', { name: 'Trener' }).click();
    await page.locator(SUBMIT_BTN).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('spacje wokół adresu e-mail są ignorowane (trimming)', async ({ page }) => {
    await page.goto('/register');
    const unique = Date.now();
    await fillName(page, 'Jan Trim');
    await page.locator('input[type="email"]').fill(`  trim${unique}@chess.local  `);
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  // --- Błędy serwera ---

  test('rejestracja z już istniejącym e-mailem wyświetla komunikat błędu', async ({ page }) => {
    await page.goto('/register');
    // Pierwsza rejestracja
    const unique = Date.now();
    const email = `dup${unique}@chess.local`;
    await fillName(page, 'Duplikat Kowalski');
    await fillEmail(page, email);
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Druga rejestracja z tym samym e-mailem
    await page.goto('/register');
    await fillName(page, 'Duplikat Kowalski');
    await fillEmail(page, email);
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('rejestracja na istniejące konto demo (coach@chess.local) wyświetla błąd', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Coach Demo');
    await fillEmail(page, 'coach@chess.local');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('rejestracja na istniejące konto demo (player@chess.local) wyświetla błąd', async ({ page }) => {
    await page.goto('/register');
    await fillName(page, 'Player Demo');
    await fillEmail(page, 'player@chess.local');
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('komunikat błędu serwera znika po poprawieniu danych i ponownym submit', async ({ page }) => {
    await page.goto('/register');
    const unique = Date.now();
    const email = `retry${unique}@chess.local`;

    // Zarejestruj raz żeby wywołać duplikat
    await page.goto('/register');
    await fillName(page, 'Retry User');
    await fillEmail(page, email);
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await page.goto('/register');
    await fillName(page, 'Retry User');
    await fillEmail(page, email);
    await fillPassword(page, 'Password123!');
    await fillConfirmPassword(page, 'Password123!');
    await page.locator(SUBMIT_BTN).click();
    await expect(page.getByRole('alert')).toBeVisible();

    // Popraw e-mail - użyj nowego unikalnego
    await fillEmail(page, `retry_fixed${unique}@chess.local`);
    await page.locator(SUBMIT_BTN).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  // --- Nawigacja ---

  test('link "Masz już konto? Zaloguj się" przekierowuje na /login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /Masz już konto\? Zaloguj się/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('zalogowany użytkownik wchodzący na /register widzi formularz rejestracji', async ({ page }) => {
    // Rejestracja nie loguje — strona /register powinna być dostępna bez autoryzacji
    await page.goto('/register');
    await expect(page.locator(SUBMIT_BTN)).toBeVisible();
  });

  // --- Wygląd formularza ---

  test('strona /register renderuje przycisk submit z tekstem "Zarejestruj się"', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator(SUBMIT_BTN)).toHaveText('Zarejestruj się');
  });

  test('strona /register zawiera cztery pola formularza', async ({ page }) => {
    await page.goto('/register');
    // Imię i Nazwisko, Email, Hasło, Potwierdź hasło
    await expect(page.locator('input')).toHaveCount(4);
  });

});
