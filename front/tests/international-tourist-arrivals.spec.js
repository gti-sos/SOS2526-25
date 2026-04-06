import { test, expect } from '@playwright/test';

// Ejecución en serie: Si uno falla, los demás no se vuelven locos
test.describe.serial('E2E Llegadas de Turistas Internacionales (AGB)', () => {

    test.beforeEach(async ({ page }) => {
        // Asegúrate de que el puerto coincida con el que estés usando (ej: 8082 o 5173)
        await page.goto('http://localhost:8082/international-tourist-arrivals');

        // Evita el clic fantasma del robot dando tiempo a que la página cargue bien
        await page.waitForTimeout(3000);

        // Le decimos al robot que acepte SIEMPRE cualquier confirm() en toda la prueba
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
        await addForm.getByPlaceholder('Llegadas (Aire)').fill('100');
        await addForm.getByPlaceholder('Llegadas (Agua)').fill('200');
        await addForm.getByPlaceholder('Llegadas (Tierra)').fill('300');

        await addForm.locator('.btn-add').click();

        // Match exacto con tu Front: "✅ Dato añadido correctamente."
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

        // Comprobamos que estamos en la vista de edición (tu ruta)
        await expect(page).toHaveURL(/.*\/international-tourist-arrivals\/PlaywrightLand\/2050/, { timeout: 10000 });

        // Editamos el primer campo numérico (Llegadas por Aire)
        await page.locator('input[type="number"]').first().fill('999');
        await page.locator('.btn-update').click();

        // Match exacto con tu Front de Edición
        await expect(page.locator('.alert')).toContainText('✅ Dato actualizado correctamente. Volviendo a la tabla...', { timeout: 10000 });

        // Esperamos a que vuelva a la tabla automáticamente
        await expect(page).toHaveURL(/.*\/international-tourist-arrivals/, { timeout: 10000 });

        // Comprobamos la edición
        await expect(page.locator('td', { hasText: '999' })).toBeVisible({ timeout: 10000 });
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-delete').click();

        // Match exacto con tu Front
        await expect(page.locator('.alert')).toContainText('🗑️ Recurso borrado con éxito.', { timeout: 10000 });
        
        // Comprobamos que ya no está en la tabla
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).not.toBeVisible();
    });
});