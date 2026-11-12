import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { components } from '../src/content.js';
import { generation, routeFor } from '../src/route.js';

const url = process.env.CURRENTLINE_TEST_URL ?? 'http://127.0.0.1:4173/';
const output = new URL('../test-results/', import.meta.url);
const browser = await chromium.launch({
  ...(process.env.CURRENTLINE_BROWSER ? { channel: process.env.CURRENTLINE_BROWSER } : {}),
  chromiumSandbox: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
const report = (message) => console.log(`✓ ${message}`);
const shot = (name, target = page) => target.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: true });
const diagram = page.getByRole('dialog');
const routeTrigger = page.getByRole('button', { name: 'Route', exact: true });
const next = page.getByRole('button', { name: 'Next component', exact: true });

async function checkActive(id, target = page) {
  assert.equal(await target.locator('#component-title').textContent(), components[id].title);
  assert.match(await target.getByRole('slider', { name: 'Tour position' }).getAttribute('aria-valuetext'), new RegExp(components[id].title, 'i'));
}

async function checkAccessibility(target) {
  await target.evaluate(axe.source);
  const results = await target.evaluate(() => window.axe.run({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
  assert.deepEqual(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) })), []);
}

async function start(source = 'gas', target = page) {
  await target.getByRole('combobox', { name: 'Energy source', exact: true }).selectOption(source);
  await target.getByRole('button', { name: 'Begin tour' }).click();
}

async function jump(id, target = page) {
  await target.getByRole('button', { name: 'Route', exact: true }).click();
  await target.getByRole('dialog').locator(`[data-go="${id}"]`).first().click();
}

async function waitForScene(target = page) {
  await target.locator('.with-3d canvas').waitFor({ state: 'visible' });
  await target.locator('#world[data-camera-moving]').waitFor({ state: 'hidden' });
  await target.locator('.spot[aria-current]:visible').waitFor();
}

try {
  await mkdir(output, { recursive: true });
  await page.goto(url);
  await page.getByRole('heading', { name: 'From source to silicon.' }).waitFor();
  assert.equal(await page.getByRole('button').count(), 2);
  assert.equal(await page.locator('canvas').count(), 0);
  await checkAccessibility(page);
  await shot('cinematic-cover');

  for (const source of Object.keys(generation)) {
    if (await page.locator('.viewer').isVisible()) await page.getByRole('button', { name: 'Currentline home' }).click();
    await start(source);
    await waitForScene();
    for (const [index, id] of routeFor(source, 'utility').entries()) {
      if (index) await next.click();
      await checkActive(id);
    }
    assert.ok(await next.isDisabled());
    report(`${generation[source].title} to the processor`);
  }

  await page.getByRole('button', { name: 'Currentline home' }).click();
  await start();
  await waitForScene();
  await checkAccessibility(page);
  await shot('cinematic-generation');
  await page.getByRole('slider', { name: 'Tour position' }).press('ArrowRight');
  await checkActive('gas-turbine');
  await page.getByRole('button', { name: 'Cutaway' }).click();
  assert.equal(await page.getByRole('button', { name: 'Cutaway' }).getAttribute('aria-pressed'), 'true');
  await waitForScene();
  await shot('cinematic-cutaway');
  const detailScene = page.locator('canvas');
  const initialZoom = await detailScene.screenshot();
  await page.locator('#component-title').focus();
  await page.keyboard.press('+');
  assert.equal(initialZoom.equals(await detailScene.screenshot()), false);
  await page.keyboard.press('0');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByText('Explore deeper', { exact: true }).click();
  assert.ok(await page.getByRole('heading', { name: 'How it’s made' }).isVisible());
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#inspector').isHidden());
  report('keyboard timeline, cutaway, and component details');

  await jump('lines');
  await waitForScene();
  await shot('cinematic-grid');
  await routeTrigger.click();
  await diagram.getByRole('button', { name: 'Battery bridge', exact: true }).click();
  await checkActive('battery');
  assert.equal(await diagram.locator('[data-go="battery"][aria-current]').count(), 1);
  await shot('cinematic-route');
  await diagram.locator('[data-go-mode="generator"][data-go="transfer"]').click();
  await checkActive('transfer');
  assert.equal(await routeTrigger.evaluate((button) => document.activeElement === button), true);
  await routeTrigger.click();
  assert.equal(await diagram.locator('[data-go="transfer"][aria-current]').count(), 1);
  for (const [button, active] of [['Battery bridge', 'battery'], ['Generator online', 'generator'], ['Utility', 'intake']]) {
    await diagram.getByRole('button', { name: button, exact: true }).click();
    await checkActive(active);
  }
  await diagram.getByRole('button', { name: 'Sources', exact: true }).click();
  assert.equal(await diagram.locator('.bibliography li').count(), 54);
  await page.keyboard.press('Escape');
  await jump('chip');
  await waitForScene();
  await shot('cinematic-processor');
  report('three power branches, route jumps, focus restoration, bibliography');

  await page.getByRole('button', { name: 'Currentline home' }).click();
  await start();
  await page.clock.install();
  await page.getByRole('button', { name: 'Play tour', exact: true }).click();
  await page.clock.fastForward(8700);
  await checkActive('gas-turbine');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.fastForward(9000);
  await checkActive('gas-turbine');
  report('guided tour advances and pauses');

  const animated = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
  await animated.goto(url);
  await start('gas', animated);
  await waitForScene(animated);
  await animated.getByRole('button', { name: 'Pause', exact: true }).click();
  const transport = await animated.locator('.transport').boundingBox();
  assert.ok(transport.y + transport.height <= 768);
  await jump('lines', animated);
  await waitForScene(animated);
  const canvas = animated.locator('canvas');
  const before = await canvas.screenshot();
  const { x, y, width, height } = await canvas.boundingBox();
  await animated.mouse.move(x + width * .67, y + height * .58);
  await animated.mouse.down();
  await animated.mouse.move(x + width * .67 + 80, y + height * .58 + 24, { steps: 6 });
  await animated.mouse.up();
  assert.equal(before.equals(await canvas.screenshot()), false);
  report('animated camera, desktop playback layout, and live drag orbit');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await mobile.goto(url);
  await shot('cinematic-mobile-cover', mobile);
  await start('solar', mobile);
  await waitForScene(mobile);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await shot('cinematic-mobile-solar', mobile);
  assert.deepEqual(pageErrors, []);
  report('responsive mobile layout and no browser errors');

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...options);
    };
  });
  await fallback.goto(url);
  await start('wind', fallback);
  await fallback.locator('.without-3d').waitFor();
  await checkActive('wind', fallback);
  await jump('chip', fallback);
  await checkActive('chip', fallback);
  await fallback.getByRole('button', { name: 'Currentline home' }).click();
  await fallback.clock.install();
  await start('wind', fallback);
  await fallback.getByRole('button', { name: 'Pause', exact: true }).waitFor();
  await fallback.clock.fastForward(9000);
  await checkActive('wind-converter', fallback);
  report('WebGL unavailable fallback and playback after reopening');
} finally {
  await browser.close();
}
