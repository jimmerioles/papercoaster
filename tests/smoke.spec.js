import { test as base, expect } from '@playwright/test';

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await use(page);

    if (testInfo.status === 'passed') {
      expect(errors, 'the page should report no errors').toEqual([]);
    }
  },
});

async function drawStroke(page, normalizedPoints) {
  const box = await page.locator('#draw-canvas').boundingBox();
  if (!box) throw new Error('the draw canvas has no layout box');

  const [first, ...rest] = normalizedPoints.map(([u, v]) => [
    box.x + box.width * u,
    box.y + box.height * v,
  ]);

  await page.mouse.move(first[0], first[1]);
  await page.mouse.down();
  for (const point of rest) {
    await page.mouse.move(point[0], point[1], { steps: 6 });
  }
  await page.mouse.up();
}

async function openDrawScreen(page) {
  await page.locator('#start-button').click();
  await expect(page.locator('#draw-screen')).toBeVisible();
  await expect(page.locator('#draw-screen')).toBeFocused();
  await expect(page.locator('#clear-button')).toBeDisabled();
  await expect(page.locator('#ride-drawn-button')).toBeDisabled();
}

test('draws a line, clears it, and rides it', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/');
  await expect(page).toHaveTitle('Papercoaster');
  await expect(page.locator('#start-button')).toHaveText('Draw a line');
  await expect(page.locator('#app canvas')).toBeVisible();

  await openDrawScreen(page);

  await drawStroke(page, [
    [0.2, 0.3],
    [0.21, 0.3],
  ]);
  await expect(page.locator('#ride-drawn-button')).toBeDisabled();
  await expect(page.locator('#draw-status')).toContainText('longer');

  const stroke = [
    [0.14, 0.55],
    [0.3, 0.22],
    [0.38, 0.18],
    [0.44, 0.34],
    [0.5, 0.52],
    [0.6, 0.56],
    [0.68, 0.3],
    [0.78, 0.2],
    [0.9, 0.38],
  ];

  await drawStroke(page, stroke);
  await expect(page.locator('#ride-drawn-button')).toBeEnabled();
  await expect(page.locator('#draw-status')).toContainText('m of track');

  const readyStatus = await page.locator('#draw-status').textContent();
  await drawStroke(page, [
    [0.2, 0.2],
    [0.8, 0.2],
  ]);
  await expect(page.locator('#draw-status')).toHaveText(readyStatus);

  await page.locator('#clear-button').click();
  await expect(page.locator('#ride-drawn-button')).toBeDisabled();
  await expect(page.locator('#draw-status')).toHaveText('');

  await drawStroke(page, stroke);
  await expect(page.locator('#ride-drawn-button')).toBeEnabled();

  await page.setViewportSize({ width: 1000, height: 700 });
  await expect(page.locator('#ride-drawn-button')).toBeEnabled();
  await page.locator('#ride-drawn-button').click();

  await expect(page.locator('#draw-screen')).toBeHidden();
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
});

test('freezes at the drop, loop, and turn with the UI hidden', async ({ page }) => {
  for (const t of [0.18, 0.48, 0.66]) {
    await page.goto(`/?t=${t}`);

    await expect(page.locator('#app canvas')).toBeVisible();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#draw-screen')).toBeHidden();
    await expect(page.locator('#hud')).toBeHidden();
    await expect(page.locator('#mute-button')).toBeHidden();
  }
});

test('freezes a drawn track in the same session', async ({ page }) => {
  await page.goto('/');
  await openDrawScreen(page);

  await drawStroke(page, [
    [0.2, 0.55],
    [0.3, 0.3],
    [0.4, 0.55],
    [0.55, 0.35],
    [0.7, 0.5],
  ]);
  await expect(page.locator('#ride-drawn-button')).toBeEnabled();

  await page.evaluate(() => {
    history.replaceState({}, '', '/?t=0.5');
  });
  await page.locator('#ride-drawn-button').click();

  await expect(page.locator('#app canvas')).toBeVisible();
  await expect(page.locator('#draw-screen')).toBeHidden();
  await expect(page.locator('#hud')).toBeHidden();
  await expect(page.locator('#mute-button')).toBeHidden();
});

test('completes a drawn ride and restarts with R', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/');
  await openDrawScreen(page);

  await drawStroke(page, [
    [0.2, 0.35],
    [0.55, 0.35],
  ]);
  await expect(page.locator('#ride-drawn-button')).toBeEnabled();
  await page.locator('#ride-drawn-button').click();

  await expect(page.locator('#end-screen')).toBeVisible({ timeout: 50_000 });
  await expect(page.locator('#again-button')).toBeFocused();
  await expect(page.locator('#max-speed')).not.toHaveText('0');
  await expect(page.locator('#track-length')).not.toHaveText('0');

  await page.keyboard.press('r');

  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#end-screen')).toBeHidden();
});
