import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { Bone, LineBasicMaterial, Object3D, PointsMaterial } from 'three';

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom'
});

class Element
{
  constructor()
  {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.listeners = new Map();
    this.classList = {
      add() {},
      remove() {},
      contains: () => false
    };
  }

  appendChild(child)
  {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener)
  {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener)
  {
    this.listeners.get(type)?.delete(listener);
  }

  setAttribute() {}

  set innerHTML(value)
  {
    if (value === '') this.children = [];
  }
}

try
{
  const { InputSlider } = await server.ssrLoadModule('/src/js/InputSlider.js');
  const slider = Object.create(InputSlider.prototype);
  slider.min = 0;
  slider.max = 1;
  slider.current_value = 0.5;
  let input_value = '';
  slider.$input = {
    get value() { return input_value; },
    set value(value) { input_value = String(value); },
    select() {}
  };
  slider.$bar = { style: {} };
  const values = [];
  slider.callback = value => values.push(value);
  for (const invalid of ['Infinity', '-Infinity', 'NaN', '', '-0.1', '1.1'])
  {
    slider.$input.value = invalid;
    slider.handle_slider_input();
    assert.equal(slider.current_value, 0.5, `${invalid} must not be accepted`);
    slider.handle_slider_blur();
    assert.equal(slider.$input.value, '0.5', `${invalid} must restore the last valid value`);
  }
  slider.$input.value = '0.75';
  slider.handle_slider_input();
  assert.equal(slider.current_value, 0.75);
  assert.deepEqual(values, [0.75]);

  const drag = Object.create(InputSlider.prototype);
  drag.$container = { getBoundingClientRect: () => ({ left: 10, width: 100 }) };
  drag.$input = { value: '' };
  drag.min = 0;
  drag.max = 1;
  drag.step = 0.01;
  drag.current_value = 0;
  drag.callback = () => {};
  drag.update_slider_bar = () => {};
  drag.handle_slider_mousedown({ clientX: 60 });
  assert.equal(drag.current_value, 0.5, 'Dragging keeps the existing proportional behavior');

  const { MaterialDetails } = await server.ssrLoadModule('/src/js/MaterialDetails.js');
  for (const [material, expected_type] of [
    [new PointsMaterial(), 'PointsMaterial'],
    [new LineBasicMaterial(), 'LineBasicMaterial']
  ])
  {
    const details = Object.create(MaterialDetails.prototype);
    details.material = material;
    details.render_id = 0;
    details.$content = { innerHTML: '' };
    const properties = [];
    details.__display_base_material_properties = type => properties.push(['type', type]);
    details.create_color_property_element = key => properties.push(['color', key]);
    details.create_property_element = key => properties.push(['property', key]);
    details.create_texture_property_element = key => properties.push(['texture', key]);
    details.create_material_details();
    assert.deepEqual(properties[0], ['type', expected_type]);
    assert(properties.some(property => property[0] === 'color' && property[1] === 'materialColor'));
    assert(!properties.some(property => property[1].toLowerCase().includes('emissive')),
      `${expected_type} does not expose MeshStandardMaterial emissive properties`);
  }

  const { SkeletonVisualizer } = await server.ssrLoadModule('/src/js/SkeletonVisualizer.js');
  const scene = new Object3D();
  const first = new Bone();
  const second = new Bone();
  first.name = second.name = 'same-name';
  first.add(new Object3D());
  scene.add(first, second);
  const skeleton = new SkeletonVisualizer();
  skeleton.init_from_scene(scene);
  const old_helpers = [...skeleton.children];
  assert.equal(skeleton.bones.length, 2);
  assert.notEqual(skeleton.bones_mesh_dic.get(first), skeleton.bones_mesh_dic.get(second));
  assert.doesNotThrow(() => skeleton.show_bone_hierarchy(first), 'Non-bone descendants are ignored');
  let geometries_disposed = 0;
  let materials_disposed = 0;
  for (const helper of old_helpers)
  {
    const dispose_geometry = helper.geometry.dispose.bind(helper.geometry);
    const dispose_material = helper.material.dispose.bind(helper.material);
    helper.geometry.dispose = () => { geometries_disposed++; dispose_geometry(); };
    helper.material.dispose = () => { materials_disposed++; dispose_material(); };
  }
  skeleton.init_from_scene(new Object3D());
  assert.equal(geometries_disposed, old_helpers.length, 'Reload disposes previous helper geometries');
  assert.equal(materials_disposed, old_helpers.length, 'Reload disposes previous helper materials');
  assert.equal(skeleton.children.length, 0);
  assert.equal(skeleton.bones.length, 0);
  assert.equal(skeleton.bones_mesh_dic.size, 0);

  const { Animations } = await server.ssrLoadModule('/src/js/Animations.js');
  const animations = Object.create(Animations.prototype);
  animations.animation_items = [];
  animations.$list = new Element();
  animations.$stop_all = new Element();
  animations.$play_all = new Element();
  animations.handle_stop_all = () => {};
  animations.handle_play_all = () => {};
  globalThis.document = { createElement: () => new Element() };
  const model_animation = { name: 'Walk' };
  animations.init({ animation_controller: { animations: [model_animation] } });
  assert.equal(animations.animation_items.length, 1);
  assert.equal(animations.$list.children.length, 1);
  animations.init({ animation_controller: { animations: [model_animation] } });
  assert.equal(animations.animation_items.length, 1, 'Repeated init replaces old items');
  assert.equal(animations.$list.children.length, 1);
  assert.equal(animations.$stop_all.listeners.get('click').size, 1, 'Repeated init keeps one control listener');
  animations.init({ animation_controller: { animations: [] } });
  assert.equal(animations.animation_items.length, 0, 'A model without animations clears prior items');
  assert.equal(animations.$list.children.length, 0);
  assert.equal(animations.$stop_all.listeners.get('click').size, 1);

  console.log('UI lifecycle checks passed.');
}
finally
{
  await server.close();
}
