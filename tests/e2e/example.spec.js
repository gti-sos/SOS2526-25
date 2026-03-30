// @ts-check
import { test, expect } from '@playwright/test';

test('Carga la página principal y verifica el título', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1.title')).toHaveText('Team SOS2526-25');
});

test('Navega a la sección de Pablo', async ({ page }) => {
  await page.goto('/');
  await page.locator('text=Pablo Seco Amores').locator('..').locator('text=🖥️ Front-End').click();
  await expect(page.locator('h2')).toContainText('Media de las temperaturas');
});

test('Navega a la sección de Aimar', async ({ page }) => {
  await page.goto('/');
  await page.locator('text=Aimar García Borrego').locator('..').locator('text=🖥️ Front-End').click();
  await expect(page.locator('h2')).toContainText('Llegada internacional de turistas');
});

test('Navega a la sección de Juanlu', async ({ page }) => {
  await page.goto('/');
  await page.locator('text=Juan Luis Rodríguez Artiaga').locator('..').locator('text=🖥️ Front-End').click();
  await expect(page.locator('h2')).toContainText('Consumo del alcohol');
});