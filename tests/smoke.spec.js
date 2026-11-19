import { test, expect } from '@playwright/test';

test('starts the ride and updates telemetry', async ({ page }) => {
  const errors = [];

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page).toHaveTitle('Papercoaster');
  await expect(page.locator('#start-button')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();

  await page.locator('#start-button').click();
  await expect(page.locator('#hud')).toBeVisible();

  await expect
    .poll(async () => Number(await page.locator('#speed-value').textContent()), {
      message: 'the speed should climb after the ride starts',
      timeout: 8_000,
    })
    .toBeGreaterThan(0);

  await expect
    .poll(
      async () =>
        Number.parseFloat(
          await page.locator('#progress-fill').evaluate((element) => element.style.width),
        ),
      {
        message: 'the progress bar should advance after the ride starts',
        timeout: 8_000,
      },
    )
    .toBeGreaterThan(0);

  expect(errors).toEqual([]);
});

test('freezes at the loop with the UI hidden', async ({ page }) => {
  await page.goto('/?t=0.48');

  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#hud')).toBeHidden();
  await expect(page.locator('#mute-button')).toBeHidden();
});
