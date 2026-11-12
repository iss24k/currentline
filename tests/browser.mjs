import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { components, sources } from '../src/content.js';
import { generation, routeFor } from '../src/route.js';
import { stepsFor } from '../src/guide-steps.js';

const url = process.env.CURRENTLINE_TEST_URL ?? 'http://127.0.0.1:4173/';
const output = new URL('../test-results/', import.meta.url);
const browser = await chromium.launch({
  ...(process.env.CURRENTLINE_BROWSER ? { channel: process.env.CURRENTLINE_BROWSER } : {}),
  chromiumSandbox: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const report = (message) => console.log(`✓ ${message}`);
const shot = (name, target = page) => target.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: true });
const next = (target = page) => target.locator('#next-step');

async function checkActive(id, step = 0, target = page, mode = 'utility') {
  assert.equal(await target.locator('#component-title').textContent(), components[id].title);
  assert.equal(await target.locator('#conversion-title').textContent(), stepsFor(id, mode)[step].name);
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
  await target.locator('.with-3d #world canvas').waitFor({ state: 'visible' });
  await target.locator('#world[data-camera-moving]').waitFor({ state: 'hidden' });
}

try {
  await mkdir(output, { recursive: true });
  await page.goto(url);
  await page.getByRole('heading', { name: 'From source to silicon.' }).waitFor();
  assert.equal(await page.getByRole('button').count(), 2);
  await checkAccessibility(page);

  for (const source of Object.keys(generation)) {
    if (await page.locator('.viewer').isVisible()) await page.getByRole('button', { name: 'Currentline home' }).click();
    await start(source);
    await waitForScene();
    const route = routeFor(source, 'utility');
    for (const [stop, id] of route.entries()) {
      for (const [step] of stepsFor(id, 'utility').entries()) {
        if (step || stop) await next().click();
        await checkActive(id, step);
      }
    }
    assert.equal(await next().getAttribute('data-next-kind'), 'replay');
    report(`${generation[source].title} through every local conversion to heat removal`);
  }

  await page.getByRole('button', { name: 'Currentline home' }).click();
  await start();
  await waitForScene();
  await jump('gas-turbine');
  await next().click();
  await checkActive('gas-turbine', 1);
  assert.equal(await page.locator('.conversion-visual').getAttribute('data-form'), 'thermal');
  await checkAccessibility(page);
  await shot('guided-combustion');
  const sceneCanvas = await page.locator('#world canvas').elementHandle();
  const stageId = await page.locator('#world').getAttribute('data-journey-environment');
  await page.getByRole('button', { name: 'Expand parts' }).click();
  const panel = page.locator('#parts-inline');
  const picker = panel.getByRole('group', { name: 'Parts in this assembly' });
  await panel.waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await sceneCanvas.evaluate((node) => node === document.querySelector('#world canvas')), true);
  assert.equal(await page.locator('#world').getAttribute('data-journey-environment'), stageId);
  assert.equal(await page.locator('#world').getAttribute('data-assembly-style'), 'equipment');
  await checkAccessibility(page);
  await shot('onsite-exploded-turbine');
  await panel.getByRole('button', { name: 'Photo', exact: true }).click();
  await panel.locator('img').evaluate((image) => image.decode());
  assert.equal(await panel.locator('img').evaluate((image) => image.naturalWidth), 3840);
  await panel.getByRole('button', { name: 'Diagram', exact: true }).click();
  for (const name of ['Hot-gas turbine stages', 'Rotating turbine blade', 'Airfoil', 'Surface coating system', 'Load-bearing substrate']) {
    await picker.getByRole('button', { name: new RegExp(name) }).first().click();
    await panel.getByRole('button', { name: 'Open this part' }).click();
  }
  await picker.getByRole('button', { name: /Gamma-prime precipitates/ }).click();
  assert.equal(await panel.locator('#inline-part-title').textContent(), 'Gamma-prime precipitates');
  await panel.getByRole('button', { name: 'References', exact: true }).click();
  assert.ok(await panel.getByRole('link', { name: /NETL/ }).first().isVisible());
  await panel.getByRole('button', { name: 'Assemble', exact: true }).click();
  assert.ok(await panel.isHidden());
  await checkActive('gas-turbine', 1);
  report('same live assembly, no parts modal, five nested part levels, diagrams and real reference photography');

  const routeTrigger = page.getByRole('button', { name: 'Route', exact: true });
  const route = page.getByRole('dialog');
  await routeTrigger.click();
  for (const [button, id, mode] of [['Battery bridge', 'battery', 'battery'], ['Generator online', 'generator', 'generator'], ['Utility', 'intake', 'utility']]) {
    await route.getByRole('button', { name: button, exact: true }).click();
    await checkActive(id, 0, page, mode);
  }
  await route.getByRole('button', { name: 'Sources', exact: true }).click();
  assert.equal(await route.locator('.bibliography li').count(), Object.keys(sources).length);
  await page.keyboard.press('Escape');
  await jump('heat');
  await waitForScene();
  await shot('guided-heat-removal');
  report('three power branches and terminal heat demonstration');

  const animated = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  animated.on('pageerror', (error) => errors.push(error.message));
  await animated.goto(url);
  await start('gas', animated);
  await waitForScene(animated);
  await jump('lines', animated);
  await next(animated).click();
  await next(animated).click();
  const travel = animated.locator('#transit');
  await travel.waitFor({ state: 'visible' });
  assert.match(await travel.textContent(), /62 km/);
  assert.match(await travel.textContent(), /documented/i);
  await animated.waitForFunction(() => Number(document.querySelector('#transit').style.opacity) >= .95);
  await shot('transmission-film', animated);
  await travel.waitFor({ state: 'hidden' });
  await checkActive('substation', 0, animated);
  await waitForScene(animated);
  await shot('guided-substation', animated);
  assert.equal(await animated.locator('#world').getAttribute('data-journey-environment'), 'utility-substation');
  report('animated transmission film, documented distance, and reveal at the next location');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await mobile.goto(url);
  await start('solar', mobile);
  await waitForScene(mobile);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await shot('mobile-guided-solar', mobile);
  await mobile.getByRole('button', { name: 'Expand parts' }).click();
  await mobile.locator('#parts-inline').waitFor({ state: 'visible' });
  await shot('mobile-onsite-parts', mobile);
  report('mobile guided scene and in-place parts');

  const fallback = await browser.newPage({ reducedMotion: 'reduce' });
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...options);
    };
  });
  await fallback.goto(url);
  await start('wind', fallback);
  await fallback.locator('.without-3d').waitFor();
  await checkActive('wind', 0, fallback);
  await next(fallback).click();
  await checkActive('wind', 1, fallback);
  await fallback.getByRole('button', { name: 'Expand parts' }).click();
  await fallback.locator('#parts-inline .inline-part-picker button').first().waitFor({ state: 'visible' });
  await fallback.getByRole('button', { name: 'Assemble', exact: true }).click();
  await jump('chip', fallback);
  await checkActive('chip', 0, fallback);
  assert.deepEqual(errors, []);
  report('WebGL fallback and no unhandled browser errors');
} finally {
  await browser.close();
}
