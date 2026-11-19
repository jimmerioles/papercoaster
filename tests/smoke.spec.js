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
  await expect(page.locator('#app canvas')).toBeVisible();

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

test('freezes at the drop, loop, and turn with the UI hidden', async ({ page }) => {
  for (const t of [0.18, 0.48, 0.66]) {
    await page.goto(`/?t=${t}`);

    await expect(page.locator('#app canvas')).toBeVisible();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#hud')).toBeHidden();
    await expect(page.locator('#mute-button')).toBeHidden();
  }
});

test('completes the full ride and restarts with R', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/');
  await page.locator('#start-button').click();

  await expect(page.locator('#end-screen')).toBeVisible({ timeout: 50_000 });
  await expect(page.locator('#max-speed')).not.toHaveText('0');

  await page.keyboard.press('r');

  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#end-screen')).toBeHidden();
});
