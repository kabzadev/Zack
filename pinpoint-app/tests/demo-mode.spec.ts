import { test, expect } from '@playwright/test';

test.describe('Demo Mode - Full App Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored data and load demo mode
    await page.goto('/?demo=true');
    await page.waitForLoadState('networkidle');
  });

  test('Login page renders correctly', async ({ page }) => {
    // Check for diamond logo
    await expect(page.locator('text=◆')).toBeVisible();
    
    // Check for "Crew Login" badge
    await expect(page.locator('text=Crew Login')).toBeVisible();
    
    // Check for phone input with US flag
    await expect(page.locator('input[placeholder*="phone" i]')).toBeVisible();
    
    // Check for secure text
    await expect(page.locator('text=Secure access for')).toBeVisible();
    await expect(page.locator('text=Pinpoint Painting crew')).toBeVisible();
  });

  test('Auto-login in demo mode works', async ({ page }) => {
    // Should redirect to dashboard automatically
    await expect(page).toHaveURL(/dashboard|customers/);
    
    // Should show user name
    await expect(page.locator('text=Hey Demo!')).toBeVisible();
  });

  test('Dashboard displays correctly', async ({ page }) => {
    // Wait for dashboard
    await page.waitForURL(/dashboard/);
    
    // Stats cards
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Estimates')).toBeVisible();
    await expect(page.locator('text=Total Estimate Value')).toBeVisible();
    
    // Quick actions
    await expect(page.locator('text=New Customer')).toBeVisible();
    await expect(page.locator('text=View Customers')).toBeVisible();
    
    // Bottom navigation
    await expect(page.locator('text=Home')).toBeVisible();
  });

  test('Customer list displays with data', async ({ page }) => {
    await page.goto('/customers?demo=true');
    
    // Wait for customers to load
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    
    // Check customer cards have proper structure
    const customerCards = page.locator('[class*="app-card"]').first();
    await expect(customerCards).toBeVisible();
    
    // Filter buttons
    await expect(page.locator('text=All Types')).toBeVisible();
    
    // Search works
    await page.locator('input[placeholder*="Search"]').fill('Sarah');
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
  });

  test('Customer detail page works', async ({ page }) => {
    await page.goto('/customers/demo-1?demo=true');
    
    // Customer info
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    await expect(page.locator('text=Homeowner')).toBeVisible();
    
    // Contact section
    await expect(page.locator('text=Contact Information')).toBeVisible();
    
    // Estimates section
    await expect(page.locator('text=Estimates')).toBeVisible();
  });

  test('No console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/?demo=true');
    await page.waitForTimeout(3000);
    
    expect(errors).toHaveLength(0);
  });

  test('No uncaught exceptions', async ({ page }) => {
    const exceptions: Error[] = [];
    
    page.on('pageerror', error => {
      exceptions.push(error);
    });
    
    await page.goto('/?demo=true');
    await page.waitForTimeout(3000);
    
    expect(exceptions).toHaveLength(0);
  });
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  
  test('Login page on mobile', async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.locator('text=◆')).toBeVisible();
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
  
  test('Dashboard on mobile', async ({ page }) => {
    await page.goto('/dashboard?demo=true');
    await page.waitForTimeout(1000);
    
    await expect(page.locator('text=Hey Demo!')).toBeVisible();
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});
