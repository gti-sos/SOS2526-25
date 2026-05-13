import { test, expect } from '@playwright/test';

// Ejecución en serie: Si uno falla, los demás no se vuelven locos
test.describe.serial('E2E Llegadas de Turistas Internacionales (AGB)', () => {

    test.beforeEach(async ({ page }) => {
        // Apuntamos al puerto 5173 (Modo desarrollo de SvelteKit)
        await page.goto('http://localhost:5173/international-tourist-arrivals');

        // Evita el clic fantasma del robot dando tiempo a que la página cargue bien
        await page.waitForTimeout(3000);

        // Le decimos al robot que acepte SIEMPRE cualquier confirm() en toda la prueba
        page.on('dialog', dialog => dialog.accept());
    });

    // 1. PREPARAMOS EL TERRENO (Cumple Listar y Borrar Todos)
    test('1. Limpiar BD, Cargar Iniciales y Listar', async ({ page }) => {
        // A) Borramos todo para empezar con la BD limpia
        await page.locator('.btn-delete-all').click();
        
        // Match exacto con tu Front: "💥 Todos los datos han sido borrados"
        await expect(page.locator('.alert')).toContainText('💥 Todos los datos han sido borrados', { timeout: 10000 });

        // B) Cargamos los datos iniciales
        await page.locator('.btn-load').click();
        
        // Match exacto con tu Front: "🔄 Datos iniciales cargados."
        await expect(page.locator('.alert')).toContainText('🔄 Datos iniciales cargados.', { timeout: 10000 });
    });

    test('2. Crear un recurso estático', async ({ page }) => {
    // Generamos un nombre único para que no falle si el dato ya existe
        const paisTest = "TestCountry" + Math.floor(Math.random() * 1000);
    
        await page.goto('/international-tourist-arrivals');

    // Esperamos a que el formulario sea visible
        await page.waitForSelector('table');

    // REVISA QUE ESTOS PLACEHOLDERS COINCIDAN CON LOS DE TU TABLA (.svelte)
    // Si en tu tabla pusiste <input placeholder="Nombre del país"...> cámbialo aquí
        await page.fill('input[placeholder="Country"]', paisTest);
        await page.fill('input[placeholder="Year"]', '2025');
        await page.fill('input[placeholder="Air Arrival"]', '100');
        await page.fill('input[placeholder="Arrivals Air"]', '200');
        await page.fill('input[placeholder="Region"]', 'Europe');

    // Haz clic en el botón de añadir (ajusta el texto si pusiste "Crear" o "Add")
        await page.click('button:has-text("Añadir")');

    // Verificamos que el nuevo dato aparece
        await page.waitForTimeout(1000); // Un segundo para que el backend procese
        await expect(page.locator(`text=${paisTest}`)).toBeVisible();
    });

    test('3. Buscar un recurso', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Buscar por País');
        
        // 1. Hacemos clic para enfocar la casilla
        await searchInput.click();
        
        // 2. EL ARMA SECRETA: Tecleamos letra a letra como un humano (50 milisegundos por letra)
        await searchInput.pressSequentially('PlaywrightLand', { delay: 50 });
        
        // 3. Hacemos clic en el botón de buscar
        await page.locator('.btn-search').click();

        // 4. Comprobamos los resultados
        await expect(page.locator('.alert')).toContainText('✅ Búsqueda completada', { timeout: 10000 });
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
        await expect(page.locator('.alert')).toContainText('✅ Dato actualizado correctamente', { timeout: 10000 });

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