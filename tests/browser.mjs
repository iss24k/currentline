import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { atlas } from '../src/atlas-data.js';

const url = process.env.CURRENTLINE_TEST_URL ?? 'http://127.0.0.1:4173/';
const output = new URL('../test-results/', import.meta.url);
const browser = await chromium.launch({
  ...(process.env.CURRENTLINE_BROWSER ? { channel: process.env.CURRENTLINE_BROWSER } : {}),
  chromiumSandbox: true,
});
const errors = [];
const failedImages = [];
const report = (message) => console.log(`✓ ${message}`);
const ids = ['start', 'eleven-mile', 'solar', 'inverter', 'transformer', 'grid', 'mesa',
  'intake', 'ups', 'distribution', 'server', 'regulator', 'chip'];

async function pageWith(options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().includes('/atlas/') && !response.ok()) failedImages.push(response.url());
  });
  return page;
}

async function shot(page, name) {
  await page.waitForFunction(() => {
    const stage = document.querySelector('.film-stage');
    const layer = stage.querySelector(stage.dataset.shot === 'atlas' ? '.atlas-viewport' : '.equipment-viewport');
    return getComputedStyle(layer).opacity === '1' &&
      !layer.hasAttribute('data-atlas-moving') && !layer.hasAttribute('data-assembly-moving');
  });
  await page.screenshot({ path: new URL(`${name}.png`, output).pathname });
}
const selected = (page, id) => page.locator(`html[data-chapter="${id}"]`).waitFor();
async function at(page, id, relative = 0) {
  await page.evaluate(({ id, relative }) => {
    const section = document.getElementById(id);
    window.scrollTo(0, section.offsetTop + section.offsetHeight * relative);
  }, { id, relative });
  await selected(page, id);
}
async function atProgress(page, id, progress) {
  await page.evaluate(({ id, progress }) => {
    const section = document.getElementById(id);
    const threshold = document.querySelector('.film-stage').offsetHeight * .29;
    window.scrollTo(0, section.offsetTop + section.offsetHeight * progress - threshold);
  }, { id, progress });
  await selected(page, id);
}
async function checkAccessibility(page) {
  await page.evaluate(axe.source);
  const result = await page.evaluate(() => window.axe.run({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
  assert.deepEqual(result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) })), []);
}

try {
  await mkdir(output, { recursive: true });
  const page = await pageWith();
  await page.goto(url);
  await page.getByRole('heading', { name: 'From sunlight to silicon' }).waitFor();
  await page.locator('#atlas-viewport[data-atlas-state=ready]').waitFor();
  assert.equal(await page.locator('.atlas-viewport').getAttribute('data-atlas-mode'), '3d');
  await checkAccessibility(page);
  await shot(page, 'atlas-opening');

  const files = [atlas.overview, ...atlas.patches];
  for (const { src, width, height } of files) {
    const dimensions = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, src);
    assert.deepEqual(dimensions, [width, height]);
    assert.ok(width >= 3840);
  }
  report('Every original aerial texture decoded at its declared 4K-plus resolution');

  const surface = page.locator('.atlas-camera-surface');
  const before = await surface.screenshot();
  await page.mouse.move(975, 322);
  await page.mouse.down();
  await page.mouse.move(1102, 367, { steps: 12 });
  await page.mouse.up();
  const panned = await surface.screenshot();
  assert.notDeepEqual(before, panned);
  await surface.focus();
  await page.keyboard.press('Home');
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 980);
  await selected(page, 'eleven-mile');
  assert.ok(await page.evaluate(() => window.scrollY) > scrollBefore);
  await shot(page, 'atlas-eleven-mile');
  report('Drag moves the map while wheel scrolling advances the story');

  const stage = page.locator('.film-stage');
  await at(page, 'eleven-mile', .53);
  await page.locator('.film-handoff').waitFor({ state: 'visible' });
  await stage.locator('#equipment-viewport[data-ready=true]').waitFor();
  const layerMix = await stage.evaluate((element) => Number(element.style.getPropertyValue('--equipment-opacity')));
  assert.ok(layerMix > 0 && layerMix < 1);
  await page.screenshot({ path: new URL('route-field-to-panel.png', output).pathname });

  await at(page, 'solar', .48);
  await stage.locator('.power-focus').waitFor();
  await page.locator('.film-stage[data-journey-phase=handoff]').waitFor();
  const equipmentCanvas = await page.locator('#equipment-viewport canvas').elementHandle();
  await shot(page, 'route-panel-to-inverter');
  await at(page, 'inverter');
  assert.ok(await equipmentCanvas.evaluate((node) => node === document.querySelector('#equipment-viewport canvas')));
  await at(page, 'solar', .48);
  assert.equal(await stage.getAttribute('data-journey-phase'), 'handoff');
  report('Aerial match cut and reversible panel-to-inverter handoff stay in one equipment viewport');

  for (const [id, progress, bridge] of [
    ['inverter', .83, 'solar-inverter>step-up'],
    ['ups', .83, 'ups>floor-pdu'],
    ['server', .83, 'psu>vrm'],
    ['regulator', .83, 'vrm>chip'],
  ]) {
    await atProgress(page, id, progress);
    await stage.locator(`#equipment-viewport[data-power-bridge="${bridge}"]`).waitFor();
  }
  for (const [id, progress, equipment] of [
    ['intake', .636, 'site-transformer'],
    ['intake', .854, 'transfer'],
    ['distribution', .594, 'busway'],
    ['distribution', .74, 'rack-pdu'],
    ['distribution', .891, 'cord'],
  ]) {
    await atProgress(page, id, progress);
    await stage.locator(`#equipment-viewport[data-power-scene="${equipment}"]`).waitFor();
  }
  for (const id of ['transformer', 'mesa']) {
    await atProgress(page, id, .86);
    await page.locator('.film-handoff').waitFor({ state: 'visible' });
  }
  report('Every equipment transition follows the route, including the building transformer, transfer switch, busway and rack cord');

  let selectableParts = 0;
  for (const id of ids.slice(2)) {
    await at(page, id);
    const section = page.locator(`#${id}`);
    assert.equal(await section.getByRole('heading', { level: 2 }).count(), 1);
    if (['grid', 'mesa'].includes(id)) continue;
    await page.locator('#equipment-viewport[data-ready=true] canvas').waitFor();
    const details = section.locator('.component-details');
    await details.locator('summary').click();
    assert.ok(await details.evaluate((element) => element.open));
    assert.ok(await details.locator('.diagram-node').count() >= 3);
    const pieces = details.locator('.part-button');
    assert.equal(await pieces.count(), id === 'inverter' ? 5 : 4);
    selectableParts += await pieces.count();
    for (const button of await pieces.all()) {
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await details.locator('[data-selected]').count(), 1);
      assert.ok((await details.locator('.part-role').textContent()).length > 15);
      await page.waitForFunction((name) => {
        const marker = document.querySelector('.equipment-marker');
        return marker && marker.textContent === name && !marker.hidden;
      }, await button.textContent());
    }
    if (['solar', 'inverter', 'transformer', 'server', 'chip'].includes(id)) await shot(page, `atlas-${id}-parts`);
    await details.locator('summary').click();
    assert.equal(await details.evaluate((element) => element.open), false);
  }
  report(`Nine component scenes open inline, synchronize diagrams and highlight all ${selectableParts} selectable parts`);

  await at(page, 'grid', .10);
  await page.getByText('Solar grid connection · route from public plans', { exact: true }).waitFor();
  await page.locator('.atlas-place').filter({ hasText: 'Pinal Central Substation' }).waitFor();
  await shot(page, 'atlas-local-connection');
  await at(page, 'grid', .34);
  await page.getByText('Geographic flight · shared grid', { exact: true }).waitFor();
  assert.match(await page.locator('#grid .chapter-description').textContent(), /mixes with other sources/);
  await shot(page, 'atlas-grid');
  await at(page, 'mesa');
  await page.locator('.atlas-place').filter({ hasText: 'Prickly Pear Substation' }).waitFor();
  await shot(page, 'atlas-mesa');
  await at(page, 'eleven-mile');
  await at(page, 'start');
  await page.getByRole('button', { name: 'Chapters', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Battery backup' }).click();
  await selected(page, 'ups');
  await page.locator('#ups summary').click();
  assert.match(await page.locator('#ups .diagram-branch').textContent(), /Battery bank/);
  await checkAccessibility(page);
  await shot(page, 'atlas-ups-parts');
  report('The aerial route is reversible and chapter links jump to the synchronized scene');

  const mobile = await pageWith({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await mobile.goto(url);
  await mobile.locator('#atlas-viewport[data-atlas-state=ready]').waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390);
  await shot(mobile, 'atlas-mobile-opening');
  await mobile.getByRole('link', { name: 'Begin the journey' }).click();
  await selected(mobile, 'eleven-mile');
  await at(mobile, 'grid', .4);
  await shot(mobile, 'atlas-mobile-grid');
  await at(mobile, 'mesa');
  await shot(mobile, 'atlas-mobile-mesa');
  await atProgress(mobile, 'solar', .86);
  assert.equal(await mobile.locator('.film-stage').getAttribute('data-journey-phase'), 'component');
  await at(mobile, 'solar');
  await shot(mobile, 'route-mobile-solar');
  await at(mobile, 'server');
  await mobile.locator('#server .component-details summary').click();
  await mobile.locator('#server .part-button').first().click();
  await mobile.locator('html[data-inspecting="true"]').waitFor();
  const mobileFrame = await mobile.locator('#equipment-viewport').boundingBox();
  const mobilePart = await mobile.locator('#server .part-button').first().boundingBox();
  assert.ok(mobileFrame.y + mobileFrame.height < mobilePart.y);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390);
  await shot(mobile, 'atlas-mobile-inspection');
  await checkAccessibility(mobile);
  report('Mobile layout, reduced-motion stops, inline detail and accessibility');

  const compact = await pageWith({ viewport: { width: 860, height: 906 }, reducedMotion: 'reduce' });
  await compact.goto(url);
  await at(compact, 'inverter');
  await compact.locator('#equipment-viewport[data-ready=true] canvas').waitFor();
  const compactModel = await compact.locator('#equipment-viewport').boundingBox();
  const compactTitle = await compact.locator('#title-inverter').boundingBox();
  assert.ok(compactModel.y + compactModel.height < compactTitle.y);
  await compact.locator('#inverter summary').click();
  await compact.getByRole('button', { name: 'Collection transformer', exact: true }).click();
  const compactMarker = compact.locator('.equipment-marker:not([hidden])');
  await compactMarker.waitFor();
  const marker = await compactMarker.boundingBox();
  assert.ok(marker.x >= 0 && marker.x + marker.width <= 860);
  await shot(compact, 'route-collection-transformer');
  await compact.close();
  report('Compact desktop preview keeps the model, controls and selected part label readable');

  const fallback = await pageWith({ reducedMotion: 'reduce' });
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
      return kind.startsWith('webgl') ? null : original.call(this, kind, ...options);
    };
  });
  await fallback.goto(url);
  await fallback.locator('#atlas-viewport[data-atlas-state=ready][data-atlas-mode="2d"]').waitFor();
  await at(fallback, 'inverter');
  await fallback.locator('.equipment-fallback .power-diagram').waitFor();
  report('Aerial imagery and diagrams stay available when WebGL is unavailable');
  await fallback.close();

  const retina = await pageWith({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await retina.goto(url);
  await retina.locator('#atlas-viewport[data-atlas-state=ready]').waitFor();
  const canvas = retina.locator('#atlas-viewport canvas').first();
  assert.deepEqual(await canvas.evaluate((element) => [element.width, element.height]), [3840, 2160]);
  await at(retina, 'eleven-mile');
  await shot(retina, 'atlas-4k-solar');
  await at(retina, 'server');
  const modelCanvas = retina.locator('#equipment-viewport[data-ready=true] canvas');
  await modelCanvas.waitFor();
  assert.deepEqual(await modelCanvas.evaluate((element) => [element.width, element.height]), [3840, 2160]);
  report('Aerial and equipment canvases verified at 3840 × 2160');
  assert.deepEqual(errors, []);
  assert.deepEqual(failedImages, []);
} finally {
  await browser.close();
}
