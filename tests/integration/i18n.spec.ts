import { test, expect } from '@playwright/test'

test.describe('Language Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display language switcher on landing page', async ({ page }) => {
    // Check that language switcher is visible
    const languageSwitcher = page.locator('.language-switcher')
    await expect(languageSwitcher).toBeVisible()

    // Check that it shows a short language code by default
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    await expect(languageTrigger).toBeVisible()
    
    const triggerText = await languageTrigger.textContent()
    expect(['EN', '繁', '简', 'JA']).toContain(triggerText?.trim())
  })

  test('should open dropdown when clicking the language trigger', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    
    // Dropdown should not be visible initially
    const dropdown = languageSwitcher.locator('.language-dropdown')
    await expect(dropdown).not.toBeVisible()
    
    // Click to open dropdown
    await languageTrigger.click()
    await expect(dropdown).toBeVisible()
    
    // Check that all language options are present
    const languageOptions = dropdown.locator('.language-option')
    await expect(languageOptions).toHaveCount(4)
    
    // Verify language names are present
    const optionsText = await languageOptions.allTextContents()
    expect(optionsText).toContain('English')
    expect(optionsText).toContain('繁體中文')
    expect(optionsText).toContain('简体中文')
    expect(optionsText).toContain('日本語')
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    const dropdown = languageSwitcher.locator('.language-dropdown')
    
    // Open dropdown
    await languageTrigger.click()
    await expect(dropdown).toBeVisible()
    
    // Click outside (on the main content)
    await page.locator('.requirements').click()
    
    // Dropdown should close
    await expect(dropdown).not.toBeVisible()
  })

  test('should switch to Traditional Chinese', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    
    // Open dropdown
    await languageTrigger.click()
    
    // Click Traditional Chinese option
    await page.locator('.language-option').filter({ hasText: '繁體中文' }).click()
    
    // Wait for UI update
    await page.waitForTimeout(100)
    
    // Verify language changed to Traditional Chinese
    await expect(languageTrigger).toHaveText('繁')
    
    // Verify landing page content is in Traditional Chinese
    await expect(page.locator('.drop-zone h3')).toContainText('選擇 Tesla 行車記錄資料夾')
    await expect(page.locator('.select-button')).toContainText('選擇資料夾')
    await expect(page.locator('text=系統要求：')).toBeVisible()
  })

  test('should switch to Simplified Chinese', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    
    // Open dropdown
    await languageTrigger.click()
    
    // Click Simplified Chinese option
    await page.locator('.language-option').filter({ hasText: '简体中文' }).click()
    
    // Wait for UI update
    await page.waitForTimeout(100)
    
    // Verify language changed to Simplified Chinese
    await expect(languageTrigger).toHaveText('简')
    
    // Verify landing page content is in Simplified Chinese
    await expect(page.locator('.drop-zone h3')).toContainText('选择 Tesla 行车记录文件夹')
    await expect(page.locator('.select-button')).toContainText('选择文件夹')
    await expect(page.locator('text=系统要求：')).toBeVisible()
  })

  test('should switch to Japanese', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    
    // Open dropdown
    await languageTrigger.click()
    
    // Click Japanese option
    await page.locator('.language-option').filter({ hasText: '日本語' }).click()
    
    // Wait for UI update
    await page.waitForTimeout(100)
    
    // Verify language changed to Japanese
    await expect(languageTrigger).toHaveText('JA')
    
    // Verify landing page content is in Japanese
    await expect(page.locator('.drop-zone h3')).toContainText('Tesla ドライブレコーダーフォルダを選択')
    await expect(page.locator('.select-button')).toContainText('フォルダを選択')
    await expect(page.locator('text=要件：')).toBeVisible()
  })

  test('should switch back to English', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    
    // First switch to another language
    await languageTrigger.click()
    await page.locator('.language-option').filter({ hasText: '繁體中文' }).click()
    await page.waitForTimeout(100)
    
    // Then switch back to English
    await languageTrigger.click()
    await page.locator('.language-option').filter({ hasText: 'English' }).click()
    await page.waitForTimeout(100)
    
    // Verify language changed to English
    await expect(languageTrigger).toHaveText('EN')
    
    // Verify landing page content is in English
    await expect(page.locator('.drop-zone h3')).toContainText('Select Tesla Dashcam Folder')
    await expect(page.locator('.select-button')).toContainText('Select Folder')
    await expect(page.locator('text=Requirements:')).toBeVisible()
  })

  test('should persist language selection in localStorage', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    
    // Switch to Japanese
    await languageTrigger.click()
    await page.locator('.language-option').filter({ hasText: '日本語' }).click()
    await page.waitForTimeout(100)
    
    // Check localStorage
    const storedLanguage = await page.evaluate(() => {
      return localStorage.getItem('sentinel-language')
    })
    expect(storedLanguage).toBe('ja')
    
    // Reload page
    await page.reload()
    
    // Verify language is still Japanese
    await expect(languageTrigger).toHaveText('JA')
    await expect(page.locator('.drop-zone h3')).toContainText('Tesla ドライブレコーダーフォルダを選択')
  })

  test('should display all landing page elements correctly', async ({ page }) => {
    // Check main title
    await expect(page.locator('.drop-zone h3')).toBeVisible()
    
    // Check buttons
    await expect(page.locator('.select-button')).toContainText('Select Folder')
    
    // Check requirements section
    const requirementsSection = page.locator('.requirements')
    await expect(requirementsSection).toBeVisible()
    await expect(requirementsSection.locator('h4')).toContainText('Requirements')
    
    // Check requirements list items
    const requirementsList = requirementsSection.locator('ul li')
    await expect(requirementsList).toHaveCount(3)
    
    // Check video iframe if present
    const videoIframe = page.locator('.demo-video iframe')
    if (await videoIframe.count() > 0) {
      await expect(videoIframe).toBeVisible()
      await expect(videoIframe).toHaveAttribute('src', /youtube\.com\/embed/)
    }
    
    // Check disclaimer
    await expect(page.locator('.disclaimer')).toBeVisible()
  })

  test('should translate all requirements when switching languages', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher')
    const languageTrigger = languageSwitcher.locator('.language-trigger')
    const requirementsList = page.locator('.requirements ul li')
    
    // Check English requirements
    await expect(requirementsList.nth(0)).toContainText('Tesla USB root folder (TeslaCam)')
    await expect(requirementsList.nth(1)).toContainText('Or a specific clip folder like')
    await expect(requirementsList.nth(2)).toContainText('Works in all modern browsers')
    
    // Switch to Traditional Chinese
    await languageTrigger.click()
    await page.locator('.language-option').filter({ hasText: '繁體中文' }).click()
    await page.waitForTimeout(100)
    
    // Check Traditional Chinese requirements
    await expect(requirementsList.nth(0)).toContainText('Tesla USB 根目錄 (TeslaCam)')
    await expect(requirementsList.nth(1)).toContainText('或是 SavedClips/SentryClips ')
    await expect(requirementsList.nth(2)).toContainText('支援所有現代瀏覽器')
  })
})
