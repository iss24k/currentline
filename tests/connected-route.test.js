import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Group } from 'three';
import { createEquipmentFlow } from '../src/equipment-flow.js';
import { createCable, equipmentLanes, placeEquipment, worldPort } from '../src/equipment-scene.js';
import { infrastructureModels } from '../src/infrastructure-models.js';
import { solarEquipmentModels } from '../src/solar-equipment.js';

const factories = { ...infrastructureModels, ...solarEquipmentModels };

function makeRecord(id, root, previous) {
  const model = factories[id]();
  const record = { id, model };
  root.add(model);
  placeEquipment(record, id, previous);
  record.flow = createEquipmentFlow(id, model, record.size.clone().divideScalar(record.scale));
  return record;
}

test('the illustrated power cable reaches both physical ports at every handoff', () => {
  for (const lane of equipmentLanes) {
    const root = new Group();
    let previous;
    for (const id of lane) {
      const record = makeRecord(id, root, previous);
      if (previous) {
        const label = `${previous.id} to ${id}`;
        const cable = createCable(previous, record, root);
        assert.ok(cable?.label, label);
        assert.equal(cable.form, previous.flow.outputForm, label);
        assert.equal(cable.form, record.flow.inputForm, label);
        assert.ok(cable.curve.getPointAt(0).distanceTo(worldPort(previous, 'exit')) < 1e-6, label);
        assert.ok(cable.curve.getPointAt(1).distanceTo(worldPort(record, 'entry')) < 1e-6, label);
      }
      previous = record;
    }
  }
});

test('the solar route passes through the conversions in electrical order', () => {
  const root = new Group();
  const expected = {
    solar: ['light', 'dc'],
    'solar-inverter': ['dc', 'ac', 'magnetic', 'ac'],
    'step-up': ['ac', 'magnetic', 'ac'],
  };
  for (const [id, phases] of Object.entries(expected)) {
    const { flow } = makeRecord(id, root);
    const recorded = [];
    for (let step = 0; step <= 120; step += 1) {
      const progress = step / 120;
      const phase = flow.phase(progress);
      assert.ok(phase.label);
      assert.ok(flow.sample(progress).toArray().every(Number.isFinite), phase.label);
      if (phase.form !== recorded.at(-1)) recorded.push(phase.form);
    }
    assert.deepEqual(recorded, phases, id);
  }
});
