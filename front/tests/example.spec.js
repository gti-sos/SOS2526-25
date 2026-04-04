import { test, expect } from '@playwright/test';

test.describe.serial('E2E Average Annual Temperatures (Pablo)', () => {

  test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/averge-annual-temperatures');

        // Evita el clic fantasma del robot.
        await page.waitForTimeout(3000);

        // 2. Le decimos al robot que acepte SIEMPRE cualquier confirm() en toda la prueba
        page.on('dialog', dialog => dialog.accept());
    });

  test('1. Preparar el terreno (Borrar todo y Cargar Iniciales)', async ({ page }) => {
    // A) Borramos todo para empezar con la BD limpia
    await page.locator('.btn-delete-all').click();
    await expect(page.locator('.alert')).toContainText('Todos los datos han sido borrados', { timeout: 10000 });

    // B) Cargamos los datos iniciales
    await page.locator('.btn-load').click();
    await expect(page.locator('.alert')).toContainText('Datos iniciales cargados', { timeout: 10000 });
  });

  test('2. Permite crear un nuevo registro de temperatura', async ({ page }) => {
    const addForm = page.locator('.form-container');
    
    await addForm.getByPlaceholder('País').fill('PlaywrightLand');
    await addForm.getByPlaceholder('Año').fill('2099');
    await addForm.getByPlaceholder('Emisiones CO2').fill('100');
    await addForm.getByPlaceholder('Precipitación').fill('50');
    await addForm.getByPlaceholder('Temperatura').fill('25');
    
    await addForm.locator('.btn-add').click();
    
    await expect(page.locator('.alert')).toContainText('Dato añadido correctamente', { timeout: 10000 });
    await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });
  });

  test('3. Permite buscar un registro de temperatura por país', async ({ page }) => {
    const searchForm = page.locator('.search-container');
    
    await searchForm.getByPlaceholder('País').fill('PlaywrightLand');
    await searchForm.locator('.btn-search').click();
    
    await expect(page.locator('.alert')).toContainText('Búsqueda completada', { timeout: 10000 });
    await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });

    await searchForm.locator('.btn-clear').click();
  });

  test('4. Permite borrar un registro de temperatura', async ({ page }) => {
    const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
    await row.locator('.btn-delete').click();
    
    await expect(page.locator('.alert')).toContainText('borrado con éxito', { timeout: 10000 });
    await expect(page.locator('td', { hasText: 'PlaywrightLand' })).not.toBeVisible();
  });

});