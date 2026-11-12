import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Box3, Vector3 } from 'three';
import { architecture, components, glossary, sources } from '../src/content.js';
import { generationCutaways, generationModels } from '../src/generation-models.js';
import { infrastructureCutaways, infrastructureModels } from '../src/infrastructure-models.js';
import { generation, grid, modes, phases, routeFor, selectModeFor, server, siteOutput } from '../src/route.js';

test('all 15 source and supply combinations form complete, unique routes', () => {
  for (const [source, { stops }] of Object.entries(generation)) {
    for (const [mode, { branch }] of Object.entries(modes)) {
      const route = routeFor(source, mode);
      assert.deepEqual(route, [...stops, ...grid, ...branch, ...siteOutput, ...server]);
      assert.equal(route.length, new Set(route).size);
      assert.equal(route.at(-1), 'chip');
      for (const id of route) assert.ok(components[id], id);
    }
  }
  assert.equal(phases.length, 4);
  assert.equal(selectModeFor('battery', 'utility'), 'battery');
  assert.equal(selectModeFor('generator', 'battery'), 'generator');
  assert.equal(selectModeFor('intake', 'generator'), 'utility');
});

test('every component and glossary citation resolves to a public bibliography entry', () => {
  const fields = ['title', 'short', 'summary', 'input', 'output', 'works', 'parts', 'assembly', 'connection', 'deeper'];
  const cited = new Set();
  for (const entry of Object.values(components)) {
    for (const key of fields) assert.ok(entry[key]?.length, `${entry.title} is missing ${key}`);
  }
  for (const entry of [...Object.values(components), ...glossary, architecture]) {
    assert.ok(entry.sources.length);
    for (const id of entry.sources) {
      assert.ok(sources[id], id);
      cited.add(id);
    }
  }
  for (const [id, source] of Object.entries(sources)) {
    assert.ok(source.title && source.organization && source.note, id);
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.ok(cited.has(id), id);
  }
});

test('all model factories and cutaways produce bounded 3D geometry', () => {
  const factories = { ...generationModels, ...infrastructureModels };
  const cutaways = new Set([...generationCutaways, ...infrastructureCutaways]);
  assert.deepEqual(Object.keys(factories).sort(), Object.keys(components).sort());
  assert.equal(Object.keys(factories).length, 27);
  assert.equal(cutaways.size, 21);
  for (const [id, factory] of Object.entries(factories)) {
    for (const exposed of cutaways.has(id) ? [false, true] : [false]) {
      const model = factory(exposed);
      const bounds = new Box3().setFromObject(model);
      const size = bounds.getSize(new Vector3());
      assert.ok(size.toArray().every((axis) => Number.isFinite(axis) && axis > 0 && axis < 8.5), id);
      assert.ok(bounds.min.y > -.16, id);
      let meshes = 0;
      model.traverse((node) => { if (node.isMesh) meshes += 1; });
      assert.ok(meshes >= 10, id);
    }
  }
});
