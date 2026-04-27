// @ts-check
import { test, expect } from '@playwright/test';

test.describe.serial('Suite de pruebas SOS2526-25', () => {

    test.beforeEach(async ({ page }) => {
        // Aceptamos cualquier confirm() de borrar todo
        page.on('dialog', dialog => dialog.accept());
        await page.goto('/average-annual-temperatures');
        await page.waitForLoadState('networkidle');
    });

    test('1. Limpiar base de datos', async ({ page }) => {
        const btnDeleteAll = page.locator('button.btn-delete-all');
        await btnDeleteAll.click();
        // Esperamos a que el mensaje de borrado aparezca
        await expect(page.locator('.alert')).toBeVisible({ timeout: 10000 });
    });

    test('2. Permite crear un nuevo registro de temperatura', async ({ page }) => {
        const paisUnico = `Testland_${Date.now()}`;

        // Rellenamos usando 'type' que simula pulsaciones de teclas reales una a una
        // Esto es lo mejor para Svelte 5 Runes
        await page.locator('input[placeholder="País"]').pressSequentially(paisUnico, { delay: 100 });
        await page.locator('input[placeholder="Año"]').pressSequentially('2025', { delay: 100 });
        await page.locator('input[placeholder="Emisiones CO2"]').pressSequentially('100', { delay: 100 });
        await page.locator('input[placeholder="Precipitación"]').pressSequentially('200', { delay: 100 });
        await page.locator('input[placeholder="Temperatura"]').pressSequentially('15', { delay: 100 });

        // Hacemos clic en añadir
        await page.locator('button.btn-add').click();

        // ESPERAMOS LA ALERTA
        const alerta = page.locator('.alert');
        // Aumentamos el timeout a 20 segundos por si el servidor va lento
        await expect(alerta).toBeVisible({ timeout: 20000 });
        await expect(alerta).toContainText('Dato añadido correctamente');
        
        // Verificamos que el país está en la tabla
        await expect(page.locator('table')).toContainText(paisUnico);
    });

    test('3. Navegación a las secciones de compañeros', async ({ page }) => {
        await page.goto('/');
        // Aimar
        await page.click('text=Aimar García Borrego >> xpath=.. >> text=🖥️ Front-End');
        await expect(page.locator('h2')).toContainText('Llegadas de Turistas');
        
        await page.goto('/');
        // Juanlu
        await page.click('text=Juan Luis Rodríguez Artiaga >> xpath=.. >> text=🖥️ Front-End');
        await expect(page.locator('h2')).toContainText('Consumo del alcohol');
    });
});