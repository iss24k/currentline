import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { components } from '../src/content.js';
import { generation, modelPhase, routeFor } from '../src/route.js';

const url = process.env.CURRENTLINE_TEST_URL ?? 'http://127.0.0.1:4173/';
const output = new URL('../test-results/', import.meta.url);
const browser = await chromium.launch({
  ...(process.env.CURRENTLINE_BROWSER ? { channel: process.env.CURRENTLINE_BROWSER } : {}),
  chromiumSandbox: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
const report = (message) => console.log(`✓ ${message}`);
const shot = async (name) => {
  await page.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: true });
};

async function checkActive(id) {
  assert.equal(await page.locator('#component-title').textContent(), components[id].title);
  assert.equal(await page.locator('.step-nav [aria-current="step"]').getAttribute('data-go'), id);
  assert.match(await page.locator('#view-phase').textContent(), new RegExp(modelPhase[id] === 'server' ? 'RACK' : modelPhase[id] === 'grid' ? 'GRID' : modelPhase[id] === 'facility' ? 'DATA CENTER' : 'GENERATION'));
}

try {
  await mkdir(output, { recursive: true });
  await page.goto(url);
  await page.locator('.with-3d canvas').waitFor({ state: 'visible' });
  await page.locator('.spot[aria-current]:visible').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Reduce motion' }).getAttribute('aria-pressed'), 'true');
  await checkActive('gas');
  await shot('desktop-generation');

  for (const source of Object.keys(generation)) {
    await page.locator(`[data-source="${source}"]`).click();
    for (const [index, id] of routeFor(source, 'utility').entries()) {
      if (index) await page.getByRole('button', { name: 'Next component', exact: true }).click();
      await checkActive(id);
    }
    assert.equal(await page.getByRole('button', { name: 'Next component', exact: true }).isDisabled(), true);
    report(`${generation[source].title} to the processor`);
  }

  await page.locator('[data-source="gas"]').click();
  const turbine = page.getByRole('button', { name: 'Inspect Gas turbine' });
  await turbine.focus();
  await turbine.press('Enter');
  await checkActive('gas-turbine');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'component-title');
  await page.locator('#cutaway').click();
  assert.equal(await page.locator('#cutaway').getAttribute('aria-pressed'), 'true');
  await page.locator('.deep summary').click();
  assert.equal(await page.locator('details.deep').getAttribute('open'), '');
  assert.ok(await page.getByRole('heading', { name: 'How it’s made' }).isVisible());
  await shot('desktop-turbine-cutaway');
  await page.getByRole('button', { name: 'Reset view' }).click();
  const beforeZoom = await page.locator('#world').screenshot();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  const afterZoom = await page.locator('#world').screenshot();
  assert.equal(beforeZoom.equals(afterZoom), false);
  await page.locator('[data-source="gas"]').click();
  await page.locator('.spot[data-go="gas-turbine"]:visible').waitFor();
  const canvas = page.locator('#world canvas');
  const { width, height } = await canvas.boundingBox();
  await canvas.click({ position: { x: width * .83, y: height * .54 } });
  await checkActive('gas-turbine');
  const canvasBounds = await canvas.boundingBox();
  const beforeDrag = await canvas.screenshot();
  const dragX = canvasBounds.x + canvasBounds.width * .5;
  const dragY = canvasBounds.y + canvasBounds.height * .55;
  await page.mouse.move(dragX, dragY);
  await page.mouse.down();
  await page.mouse.move(dragX + 70, dragY + 26, { steps: 6 });
  await page.mouse.up();
  assert.equal(beforeDrag.equals(await canvas.screenshot()), false);
  report('3D mesh picking, hotspot keyboard interaction, inspector disclosure, cutaway, orbit and zoom');

  const fullDiagram = page.getByRole('button', { name: 'Full diagram' });
  await fullDiagram.click();
  const diagram = page.getByRole('dialog');
  await diagram.getByRole('button', { name: 'Battery bridge', exact: true }).click();
  assert.equal(await page.locator('#mode').inputValue(), 'battery');
  await checkActive('battery');
  await shot('full-diagram');
  await diagram.locator('[data-go-mode="generator"][data-go="transfer"]').click();
  assert.equal(await page.locator('#mode').inputValue(), 'generator');
  await checkActive('transfer');
  assert.equal(await fullDiagram.evaluate((button) => document.activeElement === button), true);
  await fullDiagram.click();
  assert.equal(await diagram.locator('[data-go="transfer"][aria-current]').count(), 1);
  await page.keyboard.press('Escape');
  for (const mode of ['battery', 'generator', 'utility']) {
    await page.locator('#mode').selectOption(mode);
    const route = routeFor('gas', mode);
    for (const id of route.slice(route.indexOf(mode === 'battery' ? 'battery' : mode === 'generator' ? 'generator' : 'intake'))) {
      await checkActive(id);
      if (id !== 'chip') await page.getByRole('button', { name: 'Next component', exact: true }).click();
    }
  }
  report('three supply branches, duplicate transfer behavior, diagram jumps and focus restoration');

  await page.locator('[data-source="gas"]').click();
  await page.clock.install();
  await page.getByRole('button', { name: 'Play tour', exact: true }).click();
  await page.clock.fastForward(8700);
  await checkActive('gas-turbine');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.fastForward(9000);
  await checkActive('gas-turbine');
  await page.evaluate(() => window.scrollTo(0, 0));
  report('guided tour advances and stays paused');

  await page.getByRole('button', { name: 'Sources', exact: true }).click();
  assert.equal(await diagram.locator('.bibliography li').count(), 54);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Field guide', exact: true }).click();
  assert.ok(await diagram.getByRole('heading', { name: 'Glossary' }).isVisible());
  await page.keyboard.press('Escape');
  await page.evaluate(axe.source);
  const results = await page.evaluate(() => window.axe.run({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
  assert.deepEqual(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) })), []);
  report('bibliography, glossary, and automated WCAG A/AA checks');

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator('[data-source="gas"]').click();
  const transportBounds = await page.locator('.transport').boundingBox();
  assert.ok(transportBounds.y + transportBounds.height <= 768, 'Tour controls fit a small desktop viewport');
  await shot('small-desktop');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-source="solar"]').click();
  await checkActive('solar');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await shot('mobile-solar');
  assert.deepEqual(pageErrors, []);
  report('mobile layout and no unhandled browser errors');

  const animated = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' });
  const animatedErrors = [];
  animated.on('pageerror', (error) => animatedErrors.push(error.message));
  await animated.goto(url);
  await animated.locator('.spot[data-go="gas"]:visible').waitFor();
  assert.equal(await animated.getByRole('button', { name: 'Reduce motion' }).getAttribute('aria-pressed'), 'false');
  const movingShot = async (id, name) => {
    await animated.locator('#world[data-camera-moving]').waitFor({ state: 'hidden' });
    await animated.locator(`.spot[data-go="${id}"][aria-current]:visible`).waitFor();
    await animated.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: true });
  };
  await animated.locator('.phase-nav [data-go="step-up"]').click();
  await animated.locator('.step-nav [data-go="lines"]').click();
  await movingShot('lines', 'desktop-grid');
  await animated.locator('#mode').selectOption('battery');
  await movingShot('battery', 'desktop-outage');
  await animated.getByRole('button', { name: 'Full diagram' }).click();
  await animated.getByRole('dialog').locator('[data-go="chip"]').click();
  await movingShot('chip', 'desktop-processor');
  assert.deepEqual(animatedErrors, []);
  report('animated camera travels between generation, grid, facility and processor scenes');

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...options);
    };
  });
  await fallback.goto(url);
  await fallback.locator('.without-3d').waitFor();
  await fallback.locator('[data-source="wind"]').click();
  assert.equal(await fallback.locator('#component-title').textContent(), components.wind.title);
  await fallback.getByRole('button', { name: 'Full diagram' }).click();
  await fallback.getByRole('dialog').locator('[data-go="chip"]').click();
  assert.equal(await fallback.locator('#component-title').textContent(), components.chip.title);
  report('WebGL unavailable fallback preserves learning content and navigation');
} finally {
  await browser.close();
}
