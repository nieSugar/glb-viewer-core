import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom'
});

try
{
  const { Info } = await server.ssrLoadModule('/src/js/Info.js');
  const info = Object.create(Info.prototype);
  const nodes = new Map();
  info.panel = {
    ui_controller: { t: key => key },
    contents: { geometries: { get_geometries_count: () => 2 } }
  };
  info.scene_controller = {
    gltf: { parser: { json: { buffers: [{}] } }, animations: [], asset: {} },
    model: { traverse: visit => visit({}) },
    file_size: 0,
    scene_drawcall_count: 2
  };
  info.$content = { innerHTML: '' };
  info.format_file_size = () => '0 B';
  info.create_node = (id, label, value) => nodes.set(id, value);
  info.fill_info();
  assert.equal(nodes.get('geometries'), 2, 'One buffer can contain two geometries');

  const { HierarchySearchController } = await server.ssrLoadModule('/src/js/HierarchySearchController.js');
  const search = Object.create(HierarchySearchController.prototype);
  const results = [];
  search.tree = {};
  search.$search_results = { innerHTML: '', appendChild: node => results.push(node) };
  assert.doesNotThrow(() => search.handle_search_input({ target: { value: 'Cube' } }));
  assert.equal(results.length, 0);

  const match = name => ({
    $label_wrapper: { cloneNode: () => ({ classList: { add() {} }, addEventListener() {}, name }) },
    handle_label_click() {}
  });
  search.tree.first_node = { find_nodes_by_name_regex: () => [match('old')] };
  search.handle_search_input({ target: { value: 'Cube' } });
  assert.equal(results.at(-1).name, 'old');
  search.tree.first_node = { find_nodes_by_name_regex: () => [match('new')] };
  search.handle_search_input({ target: { value: 'Cube' } });
  assert.equal(results.at(-1).name, 'new');

  const { Textures } = await server.ssrLoadModule('/src/js/Textures.js');
  const textures = Object.create(Textures.prototype);
  const row = { querySelector: () => ({ textContent: '2x2' }) };
  const rows = { children: [row], set innerHTML(value) { if (value === '') this.children = []; }, appendChild(child) { this.children.push(child); } };
  textures.texture_items = [{ get_row: () => row }];
  textures.$rows_container = rows;
  await textures.build_textures_list();
  assert.equal(rows.children.length, 1, 'Refreshing textures must replace stale model or language rows');

  const { MaterialDetails } = await server.ssrLoadModule('/src/js/MaterialDetails.js');
  const original_document = globalThis.document;
  const element = tagName => ({
    tagName,
    children: [],
    style: {},
    appendChild(child)
    {
      if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
      child.parent = this;
      this.children.push(child);
    },
    addEventListener() {}
  });
  globalThis.document = { createElement: element };
  try
  {
    const details = Object.create(MaterialDetails.prototype);
    details.$content = element('root');
    details.render_id = 1;
    details.t = key => key;
    let resolve_bitmap;
    details.panel = { contents: { textures: {
      get_image_bitmap: () => new Promise(resolve => { resolve_bitmap = resolve; }),
      image_bitmap_to_data_url: () => 'data:image/png;base64,AA=='
    } } };
    const pending = details.create_texture_property_element('materialMap', { name: 'old' });
    details.render_id++;
    resolve_bitmap({});
    await pending;
    assert.equal(details.$content.children.length, 0, 'Old material or language render must not append');

    details.panel.contents.textures.get_image_bitmap = async() => ({});
    await details.create_texture_property_element('materialMap', { name: 'new' });
    const item = details.$content.children[0];
    assert.equal(item.children[1].children[0].children[0].tagName, 'img', 'Thumbnail stays in its styled container');
  }
  finally
  {
    globalThis.document = original_document;
  }
  console.log('Viewer regression checks passed.');
}
finally
{
  await server.close();
}
