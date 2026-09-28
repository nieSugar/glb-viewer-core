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
  const { SceneController } = await server.ssrLoadModule('/src/js/SceneController.js');
  const { Group, PerspectiveCamera } = await server.ssrLoadModule('/node_modules/three/build/three.module.js');
  const revoked_urls = [];
  const original_create_object_url = URL.createObjectURL;
  const original_revoke_object_url = URL.revokeObjectURL;
  let next_url = 0;
  URL.createObjectURL = () => `blob:test-${++next_url}`;
  URL.revokeObjectURL = url => revoked_urls.push(url);

  const create_controller = () =>
  {
    const controller = Object.create(SceneController.prototype);
    controller._load_generation = 0;
    controller._load_operations = new Set();
    controller.ui_controller = {
      details: { reset_details() {} },
      panel: { contents: { animations: { reset() {} } } }
    };
    controller.animation_controller = { reset() {} };
    controller.skeleton_visualizer = { reset() {} };
    controller.draco_loader = {};
    controller.ktx2_loader = {};
    controller.meshopt_decoder = {};
    controller.loaders = [];
    controller.create_request_loader = manager =>
    {
      const loader = {
        manager,
        load(uri, onLoad, _progress, onError)
        {
          this.uri = uri;
          this.onLoad = onLoad;
          this.onError = onError;
        }
      };
      controller.loaders.push(loader);
      return loader;
    };
    controller.loaded_models = [];
    controller.disposed_models = [];
    controller.on_model_loaded = gltf => controller.loaded_models.push(gltf.scene);
    controller.dispose_model_resources = model => controller.disposed_models.push(model);
    return controller;
  };
  const flush = async() =>
  {
    await Promise.resolve();
    await Promise.resolve();
  };

  try
  {
    const controller = create_controller();
    controller.loadModelFromUri('data:model-a');
    await flush();
    controller.loadModelFromUri('data:model-b');
    await flush();
    assert.equal(controller.loaders.length, 2);

    const model_a = new Group();
    const model_b = new Group();
    controller.loaders[1].onLoad({ scene: model_b });
    controller.loaders[0].onLoad({ scene: model_a });
    assert.deepEqual(controller.loaded_models, [model_b], 'Only the latest request may become the visible model');
    assert.deepEqual(controller.disposed_models, [model_a], 'A stale completed model must release its resources');
  {
    let resolve_ready;
    const controller = create_controller();
    controller._ktx2_ready = new Promise(resolve => { resolve_ready = resolve; });
    controller.loadModelFromFiles([{ name: 'old/model.gltf', data: '{}' }], 'old/model.gltf');
    const old_url = 'blob:test-1';
    controller.loadModelFromUri('data:new-model');
    assert.ok(revoked_urls.includes(old_url), 'Switching before loader readiness must revoke unused file URLs');
    resolve_ready();
    await flush();
    assert.equal(controller.loaders.length, 1, 'A superseded request must not start after decoder readiness');
    assert.equal(controller.loaders[0].uri, 'data:new-model');
  }
  {
    const controller = create_controller();
    controller.loadModelFromFiles([{ name: 'a/model.gltf', data: '{}' }, { name: 'a/texture.bin', data: 'a' }], 'a/model.gltf');
    await flush();
    controller.loadModelFromFiles([{ name: 'b/model.gltf', data: '{}' }, { name: 'b/texture.bin', data: 'b' }], 'b/model.gltf');
    await flush();
    const [request_a, request_b] = controller.loaders;
    assert.equal(request_a.manager.resolveURL('texture.bin'), 'blob:test-3');
    assert.equal(request_b.manager.resolveURL('texture.bin'), 'blob:test-5');
    const ktx_urls = [];
    controller.ktx2_loader.load = url => ktx_urls.push(url);
    controller.create_request_ktx2_loader(request_a.manager).load('texture.bin');
    controller.create_request_ktx2_loader(request_b.manager).load('texture.bin');
    assert.deepEqual(ktx_urls, ['blob:test-3', 'blob:test-5'], 'KTX2 resources must use their request-specific URL mapping');
    request_a.onLoad({ scene: new Group() });
    request_b.onLoad({ scene: new Group() });
  }

  const selection_controller = create_controller();
  const model = new Group();
  const hidden_parent = new Group();
  hidden_parent.visible = false;
  const child = new Group();
  model.add(hidden_parent);
  hidden_parent.add(child);
  selection_controller.model = model;
  assert.equal(selection_controller.is_effectively_visible(child), false, 'An invisible ancestor must hide raycast hits');
  hidden_parent.visible = true;
  assert.equal(selection_controller.is_effectively_visible(child), true);
  assert.equal(selection_controller.is_effectively_visible(new Group()), false, 'Only objects in the current model can be selected');

  selection_controller.camera = new PerspectiveCamera(45, 1, 0.1, 1000);
  selection_controller.controls = { target: new Group().position, update() {} };
  const original_position = selection_controller.camera.position.clone();
  selection_controller.set_fov(Number.NaN);
  selection_controller.set_fov(Number.POSITIVE_INFINITY);
  assert.equal(selection_controller.camera.fov, 45);
  assert.ok(selection_controller.camera.position.equals(original_position), 'Invalid FOV input must not move the camera');
  selection_controller.set_fov(-10);
  assert.equal(selection_controller.camera.fov, 1, 'Finite out-of-range FOV is clamped to the safe lower bound');
  selection_controller.set_fov(500);
  assert.equal(selection_controller.camera.fov, 179, 'Finite out-of-range FOV is clamped to the safe upper bound');
  console.log('Scene loading regression checks passed.');
  }
  finally
  {
    URL.createObjectURL = original_create_object_url;
    URL.revokeObjectURL = original_revoke_object_url;
  }
}
finally
{
  await server.close();
}
