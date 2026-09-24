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
  details.last_edit = null;
  details.readonly_items = [];
  details.$undo = { disabled: true };
  details.$error = { textContent: '' };
  let updates = 0;
  let stopped = 0;
  details.ui_controller = {
    t: key => key,
    property_label: key => key,
    handle_object_update: () => updates++,
    panel: { contents: { animations: { stop_all: () => stopped++ } } }
  };
  details.show_object_details = () => {};

  const input = (initial, boolean) =>
  {
    let value = String(initial);
    return {
      checked: boolean ? initial : false,
      get value() { return value; },
      set value(next) { value = String(next); },
      setAttribute() {}
    };
  };
  const editor = (key, original, values, vector = false, boolean = false) => ({
    key, original, vector, boolean, error: '',
    inputs: values.map(value => input(value, boolean))
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
    assert.equal(stopped, 0, 'Invalid input must not stop animations');
  }

  data.inputs[0].value = '{"label":"中文", "nested":{"value":5}}';
  for (const invalid of ['', ' ', 'NaN', 'Infinity', '1e309', 'nope'])
  {
    position.inputs[0].value = invalid;
    assert.throws(() => details.read_edits(), /detailsInvalidNumber/);
  }
  position.inputs[0].value = '2.5';
  data.inputs[0].value = '{invalid';
  assert.equal(details.can_leave_editor(), false, 'Do not silently discard drafts');
  assert.equal(details.handle_object_click(new Object3D()), false);
  assert.equal(details.current_object, obj);
  data.inputs[0].value = '{"label":"中文", "nested":{"value":5}}';

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
  assert.equal(stopped, 1);
  assert.equal(details.$undo.disabled, false);
  const undo = details.last_edit;
  assert.equal(details.apply_edits(), true);
  assert.equal(details.last_edit, undo, 'No-op blur must not overwrite undo');
  assert.equal(updates, 1);

  details.undo_last_edit();
  assert.equal(obj.name, 'Original');
  assert.equal(obj.visible, true);
  assert.deepEqual(obj.position.toArray(), [0, 0, 0]);
  assert.deepEqual(obj.userData, {});
  assert.equal(obj.rotation.order, 'ZYX');
  assert.equal(name.inputs[0].value, 'Original');
  assert.equal(details.$undo.disabled, true);

  data.inputs[0].value = '{bad';
  assert.equal(details.apply_edits([data]), false);
  const visible = details.editors.find(item => item.key === 'visible');
  visible.inputs[0].checked = false;
  const stopped_before_visibility = stopped;
  assert.equal(details.apply_edits([visible]), true, 'An invalid JSON draft must not block visibility');
  assert.equal(obj.visible, false);
  assert.equal(data.inputs[0].value, '{bad', 'Keep unrelated drafts');
  assert.equal(details.$error.textContent, 'detailsInvalidJson');
  assert.equal(stopped, stopped_before_visibility, 'Visibility must not interrupt animation');
  details.refresh_values(['userData']);
  assert.equal(data.inputs[0].value, '{}', 'Escape restores the actual model value');
  assert.equal(details.$error.textContent, '');

  name.inputs[0].value = 'Auto applied';
  assert.equal(details.can_leave_editor(), true, 'Valid drafts apply on leaving');
  assert.equal(obj.name, 'Auto applied');
  assert.equal(stopped, stopped_before_visibility, 'Name edits must not interrupt animation');

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
