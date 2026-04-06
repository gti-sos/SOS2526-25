import { test, expect } from '@playwright/test';

test.describe.serial('E2E Average Annual Temperatures (Pablo)', () => {

  test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/average-annual-temperatures');

        // Evita el clic fantasma del robot.
        await page.waitForTimeout(3000);

        // Aceptamos siempre los dialogos de confirm()
        page.on('dialog', dialog => dialog.accept());
    });

  test('1. Limpiar BD, Cargar Iniciales y Listar', async ({ page }) => {
    // Borramos todo
    await page.locator('.btn-delete-all').click();
    await expect(page.locator('.alert')).toContainText('Todos los datos han sido borrados', { timeout: 10000 });

    // Cargamos datos
    await page.locator('.btn-load').click();
    await expect(page.locator('.alert')).toContainText('Datos iniciales cargados', { timeout: 10000 });
  });

  test('2. Permite crear un nuevo registro de temperatura', async ({ page }) => {
    const addForm = page.locator('.form-container');
    
    // Al estar limpia, forzamos un dato
    await addForm.getByPlaceholder('País', { exact: true }).fill('PlaywrightLand');
    await addForm.getByPlaceholder('Año', { exact: true }).fill('2050');
    await addForm.getByPlaceholder('Emisiones CO2').fill('100');
    await addForm.getByPlaceholder('Precipitación').fill('50');
    await addForm.getByPlaceholder('Temperatura').fill('25');
    
    await addForm.locator('.btn-add').click();
    
    await expect(page.locator('.alert')).toContainText('Dato añadido correctamente', { timeout: 10000 });
    await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });
  });

  test('3. Buscar un recurso', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por País');
    await searchInput.click();
    await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
    await page.locator('.btn-search').click();

    await expect(page.locator('.alert')).toContainText('Búsqueda completada: Mostrando resultados', { timeout: 10000 });
    await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });
    
    await page.locator('.btn-clear').click();
  });

  test('4. Editar recurso en vista separada', async ({ page }) => {
    const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
    await row.locator('.btn-edit').click();

    // Verificamos la url
    await expect(page).toHaveURL(/.*\/average-annual-temperatures\/PlaywrightLand\/2050/, { timeout: 10000 });

    // Editamos temperatura
    await page.locator('input[type="number"]').last().fill('99.9');
    await page.locator('.btn-update').click();

    await expect(page.locator('.alert')).toContainText('Dato actualizado correctamente', { timeout: 10000 });

    // Redirige automáticamente
    await expect(page).toHaveURL(/.*\/average-annual-temperatures/, { timeout: 10000 });
    await expect(page.locator('td', { hasText: '99.9' })).toBeVisible({ timeout: 10000 });
  });

  test('5. Permite borrar un registro de temperatura', async ({ page }) => {
    const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
    await row.locator('.btn-delete').click();
    
    await expect(page.locator('.alert')).toContainText('Recurso borrado con éxito', { timeout: 10000 });
    await expect(page.locator('td', { hasText: 'PlaywrightLand' })).not.toBeVisible();
  });

});