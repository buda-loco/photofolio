// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Accessibility widget', () => {
  test('widget renders with both buttons', async ({ page }) => {
    await page.goto('/')
    const motionBtn   = page.locator('#a11y-motion')
    const contrastBtn = page.locator('#a11y-contrast')
    await expect(motionBtn).toBeVisible()
    await expect(contrastBtn).toBeVisible()
  })

  test('reduce-motion button toggles class on <html>', async ({ page }) => {
    await page.goto('/')
    // Click enable — triggers reload, so wait for navigation
    await page.click('#a11y-motion')
    await page.waitForLoadState('load')
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains('reduce-motion')
    )
    expect(hasClass).toBe(true)

    // Click again to disable — no reload needed
    await page.click('#a11y-motion')
    const removed = await page.evaluate(() =>
      !document.documentElement.classList.contains('reduce-motion')
    )
    expect(removed).toBe(true)
  })

  test('high-contrast button toggles class on <html>', async ({ page }) => {
    await page.goto('/')
    await page.click('#a11y-contrast')
    const on = await page.evaluate(() =>
      document.documentElement.classList.contains('high-contrast')
    )
    expect(on).toBe(true)

    await page.click('#a11y-contrast')
    const off = await page.evaluate(() =>
      !document.documentElement.classList.contains('high-contrast')
    )
    expect(off).toBe(true)
  })
})
