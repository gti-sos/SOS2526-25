// Archivo: tests/agb.spec.js
import { test, expect } from '@playwright/test';

// NOTA: Si los tests fallan porque no encuentran la ruta, asegúrate de que tu 
// playwright.config.js tiene el 'baseURL' configurado (ej: http://localhost:5173 o similar).
// Si no lo tiene, cambia esta variable por la URL completa de tu localhost.
const PAGE_URL = '/international-tourist-arrivals'; 

test.describe.serial('E2E Tests - International Tourist Arrivals (AGB)', () => {

    test('1. Listar recursos: Carga la página principal correctamente', async ({ page }) => {
        await page.goto(PAGE_URL);
        
        // Comprobamos que el título de tu interfaz está visible
        await expect(page.locator('h2')).toContainText('Llegadas de Turistas Internacionales (AGB)');
        
        // Comprobamos que la tabla existe
        await expect(page.locator('table')).toBeVisible();
    });

    test('2. Crear un recurso: Añade un nuevo registro', async ({ page }) => {
        await page.goto(PAGE_URL);

        // Rellenamos el formulario de creación
        await page.getByPlaceholder('País', { exact: true }).fill('PlaywrightCountry');
        await page.getByPlaceholder('Año', { exact: true }).fill('2050');
        await page.getByPlaceholder('Llegadas (Aire)').fill('100');
        await page.getByPlaceholder('Llegadas (Agua)').fill('200');
        await page.getByPlaceholder('Llegadas (Tierra)').fill('300');

        // Hacemos clic en el botón de añadir
        await page.getByRole('button', { name: 'Añadir' }).click();

        // Comprobamos que sale el mensaje de éxito en pantalla
        await expect(page.locator('.alert')).toContainText('✅ Dato añadido correctamente.');
    });

    test('3. Buscar un recurso: Filtra por el país creado', async ({ page }) => {
        await page.goto(PAGE_URL);

        // Rellenamos el campo de búsqueda
        await page.getByPlaceholder('Buscar por País').fill('PlaywrightCountry');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // Comprobamos el mensaje de éxito de la búsqueda
        await expect(page.locator('.alert')).toContainText('✅ Búsqueda completada');
        
        // Verificamos que el país buscado aparece en la tabla
        await expect(page.locator('table')).toContainText('PlaywrightCountry');
    });

    test('4. Editar un recurso: Modifica el registro', async ({ page }) => {
        await page.goto(PAGE_URL);

        // Buscamos el país para asegurarnos de que editamos el correcto
        await page.getByPlaceholder('Buscar por País').fill('PlaywrightCountry');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // Hacemos clic en el botón de Editar del primer resultado
        await page.locator('.btn-edit').first().click();

        // Verificamos que estamos en la vista de edición
        await expect(page.locator('h2')).toContainText('Editando: PlaywrightCountry (2050)');

        // Modificamos el valor de Llegadas (Aire)
        // El index 2 corresponde al tercer input (el primero y segundo están deshabilitados)
        await page.locator('input[type="number"]').first().fill('9999');
        
        // Guardamos
        await page.getByRole('button', { name: '💾 Guardar Cambios' }).click();

        // Verificamos el mensaje de éxito
        await expect(page.locator('.alert')).toContainText('✅ Dato actualizado correctamente');
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        await page.goto(PAGE_URL);

        // Filtramos para aislar nuestro dato de prueba
        await page.getByPlaceholder('Buscar por País').fill('PlaywrightCountry');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // IMPORTANTE: Manejamos el cuadro de diálogo (confirm) nativo del navegador aceptándolo
        page.on('dialog', dialog => dialog.accept());

        // Hacemos clic en el botón de borrar
        await page.locator('.btn-delete').first().click();

        // Verificamos el mensaje
        await expect(page.locator('.alert')).toContainText('🗑️ Recurso borrado con éxito');
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        await page.goto(PAGE_URL);

        // Aceptamos el cuadro de confirmación
        page.on('dialog', dialog => dialog.accept());

        // Clic en Borrar Todo
        await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click();

        // Verificamos mensaje y que la tabla muestra el texto vacío
        await expect(page.locator('.alert')).toContainText('💥 Todos los datos han sido borrados');
        await expect(page.locator('table')).toContainText('No hay datos para mostrar');
    });

});