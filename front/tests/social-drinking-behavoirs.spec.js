import { test, expect } from '@playwright/test';

// Ejecución en serie: Si uno falla, los demás no se vuelven locos
test.describe.serial('E2E Consumo de Alcohol (Juanlu)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/social-drinking-behaviors');

        // Evita el clic fantasma del robot.
        await page.waitForTimeout(3000);

        // 2. Le decimos al robot que acepte SIEMPRE cualquier confirm() en toda la prueba
        page.on('dialog', dialog => dialog.accept());
    });

    // 1. PREPARAMOS EL TERRENO (Cumple Listar y Borrar Todos)
    test('1. Limpiar BD, Cargar Iniciales y Listar', async ({ page }) => {
        // A) Borramos todo para empezar con la BD limpia
        await page.locator('.btn-delete-all').click();
        
        // Match exacto con tu Front: "💥 Todos los datos han sido borrados" (sin punto)
        await expect(page.locator('.alert')).toContainText('💥 Todos los datos han sido borrados', { timeout: 10000 });

        // B) Cargamos los datos iniciales
        await page.locator('.btn-load').click();
        
        // Match exacto con tu Front: "🔄 Datos iniciales cargados." (con punto)
        await expect(page.locator('.alert')).toContainText('🔄 Datos iniciales cargados.', { timeout: 10000 });
    });

    test('2. Crear un recurso estático', async ({ page }) => {
        const addForm = page.locator('.form-container');

        // Como la BD está limpia, podemos usar un nombre fijo sin miedo a que se duplique
        await addForm.getByPlaceholder('País', { exact: true }).fill('PlaywrightLand');
        await addForm.getByPlaceholder('Año', { exact: true }).fill('2050');
        await addForm.getByPlaceholder('L. Totales', { exact: true }).fill('15.5');
        await addForm.getByPlaceholder('% Cerveza').fill('50');
        await addForm.getByPlaceholder('% Vino').fill('30');
        await addForm.getByPlaceholder('% Licores').fill('20');

        await addForm.locator('.btn-add').click();

        // Match exacto con tu Front: "✅ Dato añadido correctamente." (con punto)
        await expect(page.locator('.alert')).toContainText('✅ Dato añadido correctamente.', { timeout: 10000 });
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });
    });

    test('3. Buscar un recurso', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Buscar por País');
        
        // 1. Hacemos clic para enfocar la casilla
        await searchInput.click();
        
        // 2. EL ARMA SECRETA: Tecleamos letra a letra como un humano (50 milisegundos por letra)
        // Esto obliga a Svelte a actualizar su variable interna $state sin fallar jamás.
        await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
        
        // 3. Hacemos clic en el botón de buscar
        await page.locator('.btn-search').click();

        // 4. Comprobamos los resultados
        await expect(page.locator('.alert')).toContainText('✅ Búsqueda completada: Mostrando resultados.', { timeout: 10000 });
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible({ timeout: 10000 });
        
        // Limpiamos los filtros al terminar
        await page.locator('.btn-clear').click();
    });

    test('4. Editar recurso en vista separada', async ({ page }) => {
        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-edit').click();

        // Comprobamos que estamos en la vista de edición
        await expect(page).toHaveURL(/.*\/social-drinking-behaviors\/PlaywrightLand\/2050/, { timeout: 10000 });

        // Editamos el primer campo numérico (Litros totales)
        await page.locator('input[type="number"]').first().fill('99.9');
        await page.locator('.btn-update').click();

        // Match exacto con tu Front de Edición (country/year)
        await expect(page.locator('.alert')).toContainText('✅ Dato actualizado correctamente. Volviendo a la tabla...', { timeout: 10000 });

        // Esperamos a que vuelva a la tabla automáticamente (el timeout de 10s cubre el setTimeout de Svelte de 1.5s)
        await expect(page).toHaveURL(/.*\/social-drinking-behaviors/, { timeout: 10000 });

        // Comprobamos la edición
        await expect(page.locator('td', { hasText: '99.9' })).toBeVisible({ timeout: 10000 });
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-delete').click();

        // Match exacto con tu Front: "🗑️ Recurso borrado con éxito." (con punto)
        await expect(page.locator('.alert')).toContainText('🗑️ Recurso borrado con éxito.', { timeout: 10000 });
        
        // Comprobamos que ya no está en la tabla
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).not.toBeVisible();
    });
});