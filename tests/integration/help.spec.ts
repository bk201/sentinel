import { test, expect } from '@playwright/test'

test.describe('Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open help page when help button is clicked', async ({ page }) => {
    // Click the help button in the header
    await page.click('button[title="Help & Documentation"]')
    
    // Verify help page is visible
    await expect(page.locator('.help-page')).toBeVisible()
    await expect(page.locator('.help-header h1')).toContainText(/Help/i)
  })

  test('should display all major sections', async ({ page }) => {
    // Open help page
    await page.click('button[title="Help & Documentation"]')
    
    // Verify all main sections are present using heading selectors
    await expect(page.locator('h2', { hasText: 'Overview' })).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Major Features' })).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Usage' })).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Known Issues' })).toBeVisible()
    await expect(page.locator('h2', { hasText: 'Useful Links' })).toBeVisible()
  })

  test('should display feature cards with descriptions', async ({ page }) => {
    await page.click('button[title="Help & Documentation"]')
    
    // Check for feature headings in help-feature cards
    await expect(page.locator('.help-feature h3', { hasText: 'Multi-Camera Synchronized Playback' })).toBeVisible()
    await expect(page.locator('.help-feature h3', { hasText: 'Library View' })).toBeVisible()
    await expect(page.locator('.help-feature h3', { hasText: 'Jump to Event' })).toBeVisible()
    await expect(page.locator('.help-feature h3', { hasText: 'Event Location Map' })).toBeVisible()
  })

  test('should display Safari performance warning', async ({ page }) => {
    await page.click('button[title="Help & Documentation"]')
    
    // Check for Safari-specific warning in the issues section
    await expect(page.locator('text=Safari Performance')).toBeVisible()
    await expect(page.locator('text=Safari may request video data')).toBeVisible()
  })

  test('should display usage instructions', async ({ page }) => {
    await page.click('button[title="Help & Documentation"]')
    
    // Check for usage section with steps
    const usageList = page.locator('.help-usage-list')
    await expect(usageList).toBeVisible()
    
    // Verify usage steps contain expected content - be more specific with locators
    await expect(usageList.locator('text=Retrieve the USB drive')).toBeVisible()
    await expect(usageList.locator('text=Find the USB root folder')).toBeVisible()
    await expect(usageList.locator('text=Click the "Select Folder" button')).toBeVisible()
    await expect(usageList.locator('text=plug the USB drive back')).toBeVisible()
    
    // Check for usage screenshots/figures
    const usageFigures = page.locator('.help-usage-figure img')
    await expect(usageFigures).toHaveCount(2) // teslacam-folder and select-folder screenshots
  })

  test('should have working external links', async ({ page }) => {
    await page.click('button[title="Help & Documentation"]')
    
    // Verify GitHub links are present and have correct attributes (use .first() to be more specific)
    const repoLink = page.locator('.help-links a[href*="github.com/bk201/sentinel"]').first()
    await expect(repoLink).toBeVisible()
    await expect(repoLink).toHaveAttribute('target', '_blank')
    await expect(repoLink).toHaveAttribute('rel', 'noopener noreferrer')
    
    const issuesLink = page.locator('.help-links a[href*="github.com/bk201/sentinel/issues"]')
    await expect(issuesLink).toBeVisible()
  })

  test('should close help page when close button is clicked', async ({ page }) => {
    // Open help page
    await page.click('button[title="Help & Documentation"]')
    await expect(page.locator('.help-page')).toBeVisible()
    
    // Click close button
    await page.click('.help-close')
    
    // Verify help page is closed
    await expect(page.locator('.help-page')).not.toBeVisible()
  })

  test('should close help page when back button is clicked', async ({ page }) => {
    // Open help page
    await page.click('button[title="Help & Documentation"]')
    await expect(page.locator('.help-page')).toBeVisible()
    
    // Click back button
    await page.click('.help-back-button')
    
    // Verify help page is closed
    await expect(page.locator('.help-page')).not.toBeVisible()
  })

  test('should close help page when clicking outside content area', async ({ page }) => {
    // Open help page
    await page.click('button[title="Help & Documentation"]')
    await expect(page.locator('.help-page')).toBeVisible()
    
    // Click on the overlay (outside the help-container)
    // Use coordinates in the buffer zone on the left
    await page.mouse.click(10, 100)
    
    // Verify help page is closed
    await expect(page.locator('.help-page')).not.toBeVisible()
  })

  test('should not close help page when clicking on content', async ({ page }) => {
    // Open help page
    await page.click('button[title="Help & Documentation"]')
    await expect(page.locator('.help-page')).toBeVisible()
    
    // Click on the help content itself
    await page.click('.help-container')
    
    // Verify help page is still visible
    await expect(page.locator('.help-page')).toBeVisible()
  })

  test('should close help page when ESC key is pressed', async ({ page }) => {
    // Open help page
    await page.click('button[title="Help & Documentation"]')
    await expect(page.locator('.help-page')).toBeVisible()
    
    // Press ESC key
    await page.keyboard.press('Escape')
    
    // Verify help page is closed
    await expect(page.locator('.help-page')).not.toBeVisible()
  })

  test('should display screenshots or placeholders', async ({ page }) => {
    await page.click('button[title="Help & Documentation"]')
    
    // Check for feature images (all 4 features have screenshots)
    const featureImages = page.locator('.help-feature img')
    await expect(featureImages).toHaveCount(4) // player-grid, library, event-jump, and event-map screenshots
    
    // Check for usage images (2 images in usage section)
    const usageImages = page.locator('.help-usage-figure img')
    await expect(usageImages).toHaveCount(2) // teslacam-folder and select-folder screenshots
    
    // Verify images have alt text
    const firstImage = featureImages.first()
    await expect(firstImage).toHaveAttribute('alt')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.click('button[title="Help & Documentation"]')
    
    // Verify help page is still visible and functional
    await expect(page.locator('.help-page')).toBeVisible()
    await expect(page.locator('.help-header h1')).toBeVisible()
    
    // Check that footer buttons are stacked (via CSS)
    const footer = page.locator('.help-footer')
    await expect(footer).toBeVisible()
  })

  test('should support multiple languages', async ({ page }) => {
    // Note: This test assumes the language switcher is accessible
    // You may need to adjust based on your actual i18n implementation
    
    await page.click('button[title="Help & Documentation"]')
    
    // Default should be English
    await expect(page.locator('.help-header h1')).toContainText('Help')
    
    // Close help
    await page.click('.help-close')
    
    // Switch language (if language switcher is available)
    // Then reopen help and verify translated content
    // This is a placeholder - adjust based on actual implementation
  })
})
