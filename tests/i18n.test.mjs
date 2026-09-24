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
  assert.equal(i18n.texture_channel_label('normalMap'), '法线贴图');
  assert.equal(i18n.type_label('MeshStandardMaterial'), '标准网格材质');
  assert.equal(i18n.t('infoBytes', { count: 42, size: 42, unit: 'B' }), '42 字节（42 B）');
  i18n.current_language = 'en';
  assert.equal(i18n.property_label('castShadow'), 'Cast shadow');
  assert.equal(i18n.texture_channel_label('normalMap'), 'normalMap');
  assert.equal(i18n.type_label('MeshStandardMaterial'), 'MeshStandardMaterial');
  assert.equal(i18n.t('materialSide'), 'Side');
  console.log('Localization checks passed.');
}
finally
{
  await server.close();
}
