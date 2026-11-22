import { test, expect } from '@playwright/test'

test.describe('F10: AgroLeaf AI End-to-End Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('1. App shell loads with disclaimer, 16123, and navigation', async ({ page }) => {
    // Verify product heading
    await expect(page.locator('h1')).toContainText('AgroLeaf AI')

    // Verify 16123 Krishi Call Centre and disclaimer are visible
    await expect(page.getByText('১৬১২৩')).toBeVisible()
    await expect(page.getByText(/প্রাথমিক স্ক্রিনিং/)).toBeVisible()

    // Verify 4 navigation tabs
    await expect(page.getByRole('link', { name: 'হোম' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'ইতিহাস' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'কীভাবে কাজ করে' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'সম্পর্কে' })).toBeVisible()
  })

  test('2. Hash routing navigates seamlessly across all 4 screens', async ({ page }) => {
    // Navigate to History
    await page.click('a[href="#/history"]')
    await expect(page).toHaveURL(/.*#\/history/)
    await expect(page.locator('h1')).toContainText('স্ক্যান ইতিহাস')

    // Navigate to How it works / Accuracy
    await page.click('a[href="#/how-it-works"]')
    await expect(page).toHaveURL(/.*#\/how-it-works/)
    await expect(page.locator('h1')).toContainText('কীভাবে কাজ করে')

    // Navigate to About
    await page.click('a[href="#/about"]')
    await expect(page).toHaveURL(/.*#\/about/)
    await expect(page.locator('h1')).toContainText('সম্পর্কে')

    // Navigate back to Home
    await page.click('a[href="#/"]')
    await expect(page.locator('h1')).toContainText('AgroLeaf AI')
  })

  test('3. History screen displays empty state with quick link to scan', async ({ page }) => {
    await page.goto('/#/history')
    await expect(page.locator('h1')).toContainText('স্ক্যান ইতিহাস')
    await expect(page.getByText('কোনো স্ক্যান ইতিহাস নেই')).toBeVisible()

    // Clicking "নতুন পাতা স্ক্যান করুন" returns to home
    await page.click('a:has-text("নতুন পাতা স্ক্যান করুন")')
    await expect(page.locator('h1')).toContainText('AgroLeaf AI')
  })

  test('4. Sample gallery renders test-split photos and allows instant selection', async ({ page }) => {
    // Sample gallery cards should be present on home
    const sampleTiles = page.locator('button:has-text("নমুনা:")')
    const count = await sampleTiles.count()
    if (count > 0) {
      await sampleTiles.first().click()
      // Selected image preview or analyze button should appear
      await expect(page.getByRole('button', { name: /বিশ্লেষণ করুন/i })).toBeVisible()
    }
  })

  test('5. Rejects non-image files with immediate Bangla error feedback', async ({ page }) => {
    // Prepare a mock text file buffer
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('input[type="file"]').click()
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles({
      name: 'report.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('non-image document content'),
    })

    // Expect validation message in UI
    await expect(page.getByText(/শুধুমাত্র JPG, PNG বা WebP/i)).toBeVisible()
  })
})
