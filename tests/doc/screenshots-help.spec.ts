import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Create screenshots for the help page', () => {
  test('should create screenshot for major features', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')

    await page.evaluate('window.__SENTINEL_setDebug(false)')
    
    const rootDirPath = path.resolve(process.cwd(), 'public/test_files/TeslaCam')
    await page.setInputFiles('input[data-testid="test-file-input"]', rootDirPath)
    
    // Check if video grid appeared
    const videoGrid = page.locator('.video-grid')
    await expect(videoGrid).toBeVisible()
    
    // Check if library sidebar is visible now
    const librarySiebar = page.locator('.library-sidebar')
    await expect(librarySiebar).toBeVisible()

    const savedTab = page.locator('.library-sidebar').getByRole('tab', { name: 'Saved' })
    await savedTab.click()


    // 1. Screenshot for Multi-Camera Synchronized Playback
    // Capture the video grid and control bar area
    await page.waitForTimeout(1000) // Wait for video to stabilize
    await page.locator('.main-content').screenshot({ 
      path: 'public/help/player-grid.png',
      animations: 'disabled'
    })
    console.log('✓ Captured player-grid.png')

    // 2. Screenshot for Library View - capture only upper 50%
    // We compute the bounding box of the library sidebar and capture a clipped
    // screenshot covering the top half to produce a consistent thumbnail.
    const libBox = await librarySiebar.boundingBox()
    if (libBox) {
      const clip = {
        x: Math.round(libBox.x),
        y: Math.round(libBox.y),
        width: Math.round(libBox.width),
        height: Math.round(libBox.height / 2),
      }
      await page.screenshot({
        path: 'public/help/library.png',
        clip,
        animations: 'disabled'
      })
      console.log('✓ Captured top-half of library.png')
    } else {
      // Fallback: full element screenshot
      await librarySiebar.screenshot({
        path: 'public/help/library.png',
        animations: 'disabled'
      })
      console.log('✓ Captured library.png (fallback full element)')
    }

    // 3. Screenshot for Jump to Event
    // Select a sentry event and capture the event jump button area
    // Wait for event marker to be visible (sentry clips should have event.json)
    // Click the "Sentry" tab to ensure we're viewing sentry clips
    const sentryTab = page.locator('.library-sidebar').getByRole('tab', { name: 'Sentry' })
    await sentryTab.click()

    const eventMarker = page.locator('.event-marker')
    await expect(eventMarker).toBeVisible()
    await page.locator('.control-panel').screenshot({ 
            path: 'public/help/event-jump.png',
            animations: 'disabled'
          })
    console.log('✓ Captured event-jump.png')

    // 4. Screenshot for Event Location Map
    // Capture event information with map area
    const eventSection = page.locator('.sidebar .event-section')
    await expect(eventSection).toBeVisible()
    
    // Wait for the map iframe to be visible
    const mapIframe = eventSection.locator('iframe.osm-map')
    await expect(mapIframe).toBeVisible()
    
    // Wait for the map to fully load (wait for network to be idle for map tiles)
    await page.waitForLoadState('networkidle')
    
    // Give additional time for map tiles to render
    await page.waitForTimeout(2000)

    await mapIframe.screenshot({ 
      path: 'public/help/event-map.png',
      animations: 'disabled'
    })
    console.log('✓ Captured event-map.png')
  })

  test('should create screenshot for usage', async ({ page }) => {
    // 1. Navigate to the app and show the drop zone
    await page.goto('/')
    await page.evaluate('window.__SENTINEL_setDebug(false)')

    const dropArea = page.locator('.drop-area')
    await expect(dropArea).toBeVisible()

    // 2. Capture the drop area (visual of select folder / drag & drop)
    await dropArea.screenshot({ path: 'public/help/select-folder.png', animations: 'disabled' })
    console.log('✓ Captured select-folder.png')
  })
})