import { test, expect } from '@playwright/test';

// Ejecución en serie: Si uno falla, los demás no se vuelven locos
test.describe.serial('E2E Llegadas de Turistas Internacionales (AGB)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/international-tourist-arrivals');
        await page.waitForTimeout(3000);
        page.on('dialog', dialog => dialog.accept());
    });

    test('1. Limpiar BD, Cargar Iniciales y Listar', async ({ page }) => {
        await page.locator('.btn-delete-all').click();
        await expect(page.locator('.alert')).toContainText('💥 Todos los datos han sido borrados', { timeout: 10000 });

        await page.locator('.btn-load').click();
        await expect(page.locator('.alert')).toContainText('🔄 Datos iniciales cargados.', { timeout: 10000 });
    });

    test('2. Crear un recurso estático', async ({ page }) => {
        // El formulario de AÑADIR está dentro de .form-container, así acotamos
        // los inputs para no confundirlos con los del buscador (mismo placeholder "País" y "Año")
        const addForm = page.locator('.form-container');

        await addForm.getByPlaceholder('País').fill('PlaywrightLand');
        await addForm.getByPlaceholder('Año').fill('2050');
        await addForm.getByPlaceholder('Llegadas (Aire)').fill('100');
        await addForm.getByPlaceholder('Llegadas (Agua)').fill('200');
        await addForm.getByPlaceholder('Llegadas (Tierra)').fill('300');

        await addForm.locator('.btn-add').click();

        await expect(page.locator('.alert')).toContainText('✅ Dato añadido correctamente.', { timeout: 10000 });

        // El buscador también tiene placeholder "País", lo acotamos a .search-container
        const searchInput = page.locator('.search-container').getByPlaceholder('País');
        await searchInput.click();
        await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
        await page.locator('.btn-search').click();

        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });
    });

    test('3. Buscar un recurso', async ({ page }) => {
        // Acotamos siempre el input de búsqueda a .search-container
        const searchInput = page.locator('.search-container').getByPlaceholder('País');

        await searchInput.click();
        await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
        await page.locator('.btn-search').click();

        await expect(page.locator('.alert')).toContainText('✅ Búsqueda completada: Mostrando resultados.', { timeout: 10000 });
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });

        await page.locator('.btn-clear').click();
    });

    test('4. Editar recurso en vista separada', async ({ page }) => {
        const searchInput = page.locator('.search-container').getByPlaceholder('País');
        await searchInput.click();
        await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
        await page.locator('.btn-search').click();

        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-edit').click();

        await expect(page).toHaveURL(/.*\/international-tourist-arrivals\/PlaywrightLand\/2050/, { timeout: 10000 });

        await page.locator('input[type="number"]').first().fill('999');
        await page.locator('.btn-update').click();

        await expect(page.locator('.alert')).toContainText('✅ Dato actualizado correctamente. Volviendo a la tabla...', { timeout: 10000 });
        await expect(page).toHaveURL(/.*\/international-tourist-arrivals/, { timeout: 10000 });

        const searchInput2 = page.locator('.search-container').getByPlaceholder('País');
        await searchInput2.click();
        await searchInput2.pressSequentially('PlaywrightLand', { delay: 50 });
        await page.locator('.btn-search').click();

        await expect(page.locator('td', { hasText: '999' })).toBeVisible({ timeout: 10000 });
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const searchInput = page.locator('.search-container').getByPlaceholder('País');
        await searchInput.click();
        await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
        await page.locator('.btn-search').click();

        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-delete').click();

        await expect(page.locator('.alert')).toContainText('🗑️ Recurso borrado con éxito.', { timeout: 10000 });
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).not.toBeVisible();
    });
});