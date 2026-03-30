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

// -------------------------------------------------------------PARTE PABLO-----------------------------------------------------    
test('Permite crear un nuevo registro de temperatura', async ({ page }) => {
  await page.goto('/average-annual-temperatures');
  
  // Rellenar el formulario
  await page.fill('input[placeholder="País"]', 'TestLand');
  await page.fill('input[placeholder="Año"]', '2099');
  await page.fill('input[placeholder="Emisiones CO2"]', '100');
  await page.fill('input[placeholder="Precipitación"]', '50');
  await page.fill('input[placeholder="Temperatura"]', '25');
  
  // Hacer clic en el botón de Añadir
  await page.click('button:has-text("Añadir")');
  
  // Comprobar que sale el mensaje de éxito (sin jerga técnica)
  await expect(page.locator('.alert')).toContainText('Dato añadido correctamente');
});
test('Permite buscar un registro de temperatura por país', async ({ page }) => {
  await page.goto('/average-annual-temperatures');
  
  // 1. Cargamos los datos iniciales por si la base de datos estuviera vacía
  await page.click('button:has-text("Cargar Datos Iniciales")');

  // 2. Rellenar el filtro de país (usamos "Germany" que está en tus datos iniciales)
  // Como tienes varios inputs, seleccionamos el del buscador por su placeholder
  await page.locator('.search-container input[placeholder="País"]').fill('Germany');
  
  // 3. Hacer clic en el botón Buscar de la zona de filtros
  await page.click('button.btn-search:has-text("Buscar")');
  
  // 4. Comprobar que sale el mensaje de éxito de búsqueda
  await expect(page.locator('.alert')).toContainText('Búsqueda completada');
});


test('Permite borrar un registro de temperatura', async ({ page }) => {
  await page.goto('/average-annual-temperatures');
  
  // 1. Cargamos datos iniciales para asegurarnos de que hay algo que borrar
  await page.click('button:has-text("Cargar Datos Iniciales")');

  // 2. TRUCO VITAL: Configurar Playwright para que acepte el confirm() del navegador
  page.on('dialog', async dialog => {
    await dialog.accept(); // Esto simula hacer clic en "Aceptar" en el aviso
  });
  
  // 3. Hacemos clic en el primer botón de "Borrar" que exista en la tabla
  await page.locator('button.btn-delete').first().click();
  
  // 4. Comprobar que sale el mensaje de que ha sido borrado (sin códigos de error técnicos)
  await expect(page.locator('.alert')).toContainText('borrado con éxito');
});