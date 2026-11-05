import { test, expect } from '@playwright/test';

test.describe('SHALOM Panel Smoke Tests E2E', () => {
  test('debe cargar la pantalla de login con branding SHALOM', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=SHALOM')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('debe renderizar el dashboard con los KPIs y módulos de navegación', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=SHALOM — Panel de Control')).toBeVisible();
    await expect(page.locator('text=Ventas Reconocidas')).toBeVisible();
    await expect(page.locator('text=Pedidos Activos')).toBeVisible();
  });

  test('debe navegar al módulo de productos y mostrar el catálogo', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('text=Catálogo de Productos')).toBeVisible();
    await expect(page.locator('text=Nuevo Producto')).toBeVisible();
  });

  test('debe navegar al módulo de inventario y mostrar el kardex', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.locator('text=Control de Inventario y Kardex')).toBeVisible();
    await expect(page.locator('text=Valorización Total')).toBeVisible();
  });

  test('debe navegar a clientes CRM y pedidos', async ({ page }) => {
    await page.goto('/customers');
    await expect(page.locator('text=Clientes CRM')).toBeVisible();

    await page.goto('/orders');
    await expect(page.locator('text=Gestión de Pedidos')).toBeVisible();
  });

  test('debe navegar a finanzas y reportes', async ({ page }) => {
    await page.goto('/finances');
    await expect(page.locator('text=Finanzas y Ganancias')).toBeVisible();

    await page.goto('/reports');
    await expect(page.locator('text=Centro de Reportes y Exportaciones')).toBeVisible();
  });

  test('debe navegar a la bandeja de WhatsApp y al constructor de automatizaciones', async ({ page }) => {
    await page.goto('/whatsapp');
    await expect(page.locator('text=WhatsApp Inbox')).toBeVisible();

    await page.goto('/automations');
    await expect(page.locator('text=Constructor de Automatizaciones')).toBeVisible();
  });
});
