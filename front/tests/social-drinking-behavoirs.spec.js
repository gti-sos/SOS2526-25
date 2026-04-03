import { test, expect } from '@playwright/test';

// Usamos 'serial' para que los tests se ejecuten en orden.
test.describe.serial('E2E Consumo de Alcohol (Juanlu)', () => {

    test.beforeEach(async ({ page }) => {
        // Asegúrate de que el puerto sea el que sale en tu terminal al hacer npm run dev
        await page.goto('http://localhost:5173/social-drinking-behaviors');
    });

    test('1. Listar todos los recursos', async ({ page }) => {
        // Ahora busca exactamente la frase que tienes en tu h2
        await expect(page.locator('h2', { hasText: 'Consumo del alcohol' })).toBeVisible();
        await expect(page.locator('table')).toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        // Le decimos al robot que se fije SOLO en la tarjeta de añadir (la que tiene la clase form-container)
        const addForm = page.locator('.form-container');

        // Ahora le pedimos que busque los placeholders dentro de esa tarjeta específica
        await addForm.getByPlaceholder('País', { exact: true }).fill('PlaywrightLand');
        await addForm.getByPlaceholder('Año', { exact: true }).fill('2050');
        await addForm.getByPlaceholder('L. Totales', { exact: true }).fill('15.5');
        await addForm.getByPlaceholder('% Cerveza').fill('50');
        await addForm.getByPlaceholder('% Vino').fill('30');
        await addForm.getByPlaceholder('% Licores').fill('20');

        await addForm.locator('.btn-add').click();

        // Le damos un segundito a Svelte para que recargue la tabla
        await page.waitForTimeout(500);

        await expect(page.locator('.alert')).toContainText('✅ Dato añadido correctamente');
        // Comprobamos que el nuevo país está en la primera celda de alguna fila
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible();
    });

    test('3. Buscar un recurso', async ({ page }) => {
        // IMPORTANTE: Según tu código, el placeholder es "Buscar por País" (con la 'P' mayúscula y tilde)
        await page.getByPlaceholder('Buscar por País').fill('PlaywrightLand');
        await page.locator('.btn-search').click();

        await page.waitForTimeout(500);

        await expect(page.locator('.alert')).toContainText('✅ Búsqueda completada');
        await expect(page.locator('td', { hasText: 'PlaywrightLand' })).toBeVisible();
        
        // Limpiamos los filtros para el siguiente test
        await page.locator('.btn-clear').click();
    });

    test('4. Editar recurso en vista separada', async ({ page }) => {
        // Busca la fila de nuestro país inventado y hace clic en su botón Editar
        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-edit').click();

        // Comprueba que la URL ha cambiado a la ruta dinámica
        await expect(page).toHaveURL(/.*\/social-drinking-behaviors\/PlaywrightLand\/2050/);

        // En tu página de edición, el primer input de número es Litros Totales
        // Llenamos un valor loco para comprobar que se guarda
        await page.locator('input[type="number"]').first().fill('99.9');
        await page.locator('.btn-update').click();

        await expect(page.locator('.alert')).toContainText('✅ Dato actualizado correctamente');

        // Playwright espera mágicamente el setTimeout() de 1.5s y comprueba que volvemos a la tabla
        await expect(page).toHaveURL(/.*\/social-drinking-behaviors/);
        
        await page.waitForTimeout(500);

        // Comprueba que el valor nuevo (99.9) está en la tabla
        await expect(page.locator('td', { hasText: '99.9' })).toBeVisible();
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        // Le decimos a Playwright que pulse "Aceptar" cuando salga el confirm
        page.on('dialog', dialog => dialog.accept());

        const row = page.locator('tr').filter({ hasText: 'PlaywrightLand' });
        await row.locator('.btn-delete').click();

        await page.waitForTimeout(500);

        // Comprobamos el mensaje verde
        await expect(page.locator('.alert')).toContainText('borrado con éxito');
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        await page.locator('.btn-delete-all').click();

        await page.waitForTimeout(500);

        await expect(page.locator('.alert')).toContainText('💥 Todos los datos han sido borrados.');
        await expect(page.locator('.text-center', { hasText: 'No hay datos para mostrar.' })).toBeVisible(); // Ojo, tu código tiene un punto al final de la frase
    });
});