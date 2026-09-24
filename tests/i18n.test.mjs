import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
  configFile: false,
  root,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom'
});

try
{
  globalThis.localStorage = { getItem: () => null };
  const { I18n } = await server.ssrLoadModule('/src/js/I18n.js');
  const i18n = new I18n();
  const { en, zh } = i18n.translations;
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());

  for (const file of readdirSync(new URL('../src/views/', import.meta.url)))
  {
    if (!file.endsWith('.pug')) continue;
    const view = readFileSync(new URL(`../src/views/${file}`, import.meta.url), 'utf8');
    for (const [, key] of view.matchAll(/data-i18n(?:-attr)?='([^:']+)/g))
    {
      assert.equal(typeof zh[key], 'string', `${file}: missing Chinese translation for ${key}`);
    }
  }

  assert.equal(i18n.property_label('castShadow'), '投射阴影');
  assert.equal(i18n.property_label('castShadow', false), 'castShadow');
  assert.equal(i18n.t('materialType'), '类型');
  assert.equal(i18n.t('infoBytes', { count: 42, size: 42, unit: 'B' }), '42 字节（42 B）');
  const { MaterialDetails } = await server.ssrLoadModule('/src/js/MaterialDetails.js');
  const material_details = Object.create(MaterialDetails.prototype);
  material_details.panel = { ui_controller: { t: (...args) => i18n.t(...args) } };
  material_details.material = { name: '', uuid: 'test', transparent: false, side: 0, userData: {} };
  const properties = [];
  material_details.create_property_element = (key, value) => properties.push([key, value]);
  material_details.__display_base_material_properties('MeshStandardMaterial');
  assert.deepEqual(properties.find(([key]) => key === 'materialType'), ['materialType', 'MeshStandardMaterial']);
  assert.deepEqual(properties.find(([key]) => key === 'materialSide'), ['materialSide', 'FrontSide']);
  i18n.current_language = 'en';
  assert.equal(i18n.property_label('castShadow'), 'Cast shadow');
  assert.equal(i18n.property_label('castShadow', false), 'castShadow');
  assert.equal(i18n.t('materialType'), 'Type');
  assert.equal(i18n.t('materialSide'), 'Side');
  console.log('Localization checks passed.');
}
finally
{
  await server.close();
}
