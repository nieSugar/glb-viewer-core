// Run from glb-viewer-core: node tests/details.test.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { Object3D, Vector3 } from 'three';

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom'
});

try
{
  const { Details } = await server.ssrLoadModule('/src/js/Details.js');
  const details = Object.create(Details.prototype);
  const obj = new Object3D();
  const parent = new Object3D();
  parent.position.x = 10;
  parent.add(obj);
  obj.name = 'Original';
  obj.rotation.order = 'ZYX';
  obj.scale.setScalar(1.23456789);
  obj.matrixAutoUpdate = false;
  obj.updateMatrix();
  details.current_object = obj;
  details.is_editing = true;
  details.$error = { textContent: '' };
  let updates = 0;
  details.ui_controller = { t: key => key, handle_object_update: () => updates++ };
  details.show_object_details = () => {};

  const editor = (key, original, values, vector = false, boolean = false) => ({
    key, original, vector, boolean,
    inputs: values.map(value => boolean ? { checked: value } : { value })
  });
  const name = editor('name', ['Original'], ['Renamed']);
  const position = editor('position', ['0', '0', '0'], ['2.5', '-3', '1e2'], true);
  const data = editor('userData', ['{}'], ['{"broken":']);
  details.editors = [name, position, data];

  for (const invalid of ['{"broken":', 'null', '[]', '42', '"text"'])
  {
    data.inputs[0].value = invalid;
    details.apply_edits();
    assert.equal(obj.name, 'Original', 'Validation must happen before any mutation');
    assert.deepEqual(obj.position.toArray(), [0, 0, 0]);
    assert.equal(details.$error.textContent, 'detailsInvalidJson');
    assert.equal(updates, 0);
    assert.equal(details.is_editing, true);
  }

  data.inputs[0].value = '{"label":"中文", "nested":{"value":5}}';
  for (const invalid of ['', ' ', 'NaN', 'Infinity', '1e309', 'nope'])
  {
    position.inputs[0].value = invalid;
    assert.throws(() => details.read_edits(), /detailsInvalidNumber/);
  }
  position.inputs[0].value = '2.5';
  assert.equal(details.can_leave_editor(), false, 'Do not silently discard drafts');
  assert.equal(details.handle_object_click(new Object3D()), false);
  assert.equal(details.current_object, obj);

  details.editors.push(editor('visible', [true], [false], false, true));
  details.editors.push(editor('rotation', ['0', '0', '0'], ['0.1', '0.2', '0.3'], true));
  const original_position = obj.position;
  const original_rotation = obj.rotation;
  details.apply_edits();
  assert.equal(obj.name, 'Renamed');
  assert.equal(obj.visible, false);
  assert.equal(obj.position, original_position, 'Keep Three.js object identity');
  assert.equal(obj.rotation, original_rotation);
  assert.equal(obj.rotation.order, 'ZYX');
  assert.deepEqual(obj.position.toArray(), [2.5, -3, 100]);
  assert.deepEqual(obj.getWorldPosition(new Vector3()).toArray(), [12.5, -3, 100]);
  assert.equal(obj.scale.x, 1.23456789, 'Do not round untouched values');
  assert.deepEqual(obj.userData, { label: '中文', nested: { value: 5 } });
  assert.equal(updates, 1);
  assert.equal(details.is_editing, false);

  details.editors = [editor('name', ['Renamed'], ['Renamed'])];
  assert.deepEqual(details.read_edits(), []);
  assert.equal(details.can_leave_editor(), true);
  for (const key of ['type', 'parent', 'children', 'matrix', 'matrixWorld', 'globalScale', 'globalPosition', 'layers'])
  {
    assert.equal(details.create_editor(obj, key, null), false, `${key} must stay read-only`);
  }
  console.log('Details editing checks passed.');
}
finally
{
  await server.close();
}
