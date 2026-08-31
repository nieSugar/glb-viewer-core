import { LinearSRGBColorSpace, Mesh, MeshBasicMaterial, NearestFilter, OrthographicCamera, PlaneGeometry, Scene, SRGBColorSpace, UnsignedByteType, WebGLRenderTarget } from 'three';
import { ResizableWindow } from './ResizeableWindow';
import { TextureItem } from './TextureItem';
import { TexturePreview } from './TexturePreview';

class Textures extends ResizableWindow
{
  constructor(panel, name)
  {
    const container = document.querySelector('.textures');
    const drag_handle = container.querySelector('.textures-header');
    const resize_content = container.querySelector('.resize-content-wrapper');

    super(container, drag_handle, resize_content);

    this.name = name;
    this.panel = panel;
    this.$header = drag_handle;
    this.$rows_container = container.querySelector('.textures-content');

    this.canvas = document.createElement('canvas');
    this.canvas_ctx = this.canvas.getContext('2d');

    this.texture_preview = new TexturePreview();

    this.$close_button = container.querySelector('.textures-header__close');
    this.$close_button.addEventListener('click', this.handle_close_button_click.bind(this));

    this.texture_items = [];
    this.texture_table = container.querySelector('.textures-table');
  }

  t(key, values = {})
  {
    return this.panel.ui_controller.t(key, values);
  }

  init(scene_controller)
  {
    this.scene_controller = scene_controller;
  }

  show()
  {
    this.$container.classList.remove('hidden');
  }

  hide()
  {
    this.texture_preview.hide();
    this.$container.classList.add('hidden');
  }

  extract_texture_list(object3d)
  {
    const texture_map = new Map();

    const material_types = [
      'map',
      'emissiveMap',
      'roughnessMap',
      'metalnessMap',
      'aoMap',
      'normalMap',
      'displacementMap',
      'alphaMap',
      'envMap',
      'lightMap',
      'reflectionMap',
      'specularMap',
      'sheenColorMap',
      'sheenRoughnessMap',
      'clearcoatColorMap',
      'clearcoatRoughnessMap',
      'coatColorMap',
      'coatRoughnessMap',
      'coatNormalMap',
      'coatNormalScaleMap'
    ];

    object3d.traverse((child) =>
    {
      if (child.material)
      {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials)
        {
          if (!material) continue;

          for (const channel of material_types)
          {
            const tex = material[channel];

            if (tex && tex.isTexture)
            {
              if (!texture_map.has(tex.source.uuid))
              {
                texture_map.set(tex.source.uuid, {
                  name: tex.name || this.t('unknownName'),
                  uuid: tex.source.uuid,
                  image: tex.image || tex.source || undefined,
                  instance: tex,
                  used_in: []
                });
              }

              const entry = texture_map.get(tex.source.uuid);

              entry.used_in.push({
                material_name: material.name || this.t('unknownMaterial'),
                channel: channel,
                mesh_name: child.name || this.t('unnamedMesh')
              });
            }
          }
        }
      }
    });
    const texture_list = Array.from(texture_map.values());
    /* output example:
    {
      name: 'WoodTexture',
      uuid: 'abc-123',
      image: <HTMLImageElement>,
      instance: <THREE.Texture>,
      used_in: [
        {
          material_name: 'FloorMaterial',
          channel: 'map',
          mesh_name: 'FloorMesh'
        },
        {
          material_name: 'WallMaterial',
          channel: 'roughnessMap',
          mesh_name: 'WallMesh'
        }
      ]
    }
    */
    this.texture_items = texture_list.map((texture, index) => new TextureItem(texture, this, index));
  }

  update_contents(object3d)
  {
    this.extract_texture_list(object3d);
    this.build_textures_list();
  }

  async build_textures_list()
  {
    const texture_rows = [];
    for (let i = 0; i < this.texture_items.length; i++)
    {
      const texture = this.texture_items[i];
      const row = texture.get_row();

      texture_rows.push(row);
    }

    texture_rows.sort((a, b) =>
    {
      const a_resolution = a.querySelector('.textures-table__resolution').textContent;
      const b_resolution = b.querySelector('.textures-table__resolution').textContent;

      const [a_width, a_height] = a_resolution.split('x').map(Number);
      const [b_width, b_height] = b_resolution.split('x').map(Number);

      const a_pixels = a_width * a_height;
      const b_pixels = b_width * b_height;

      return b_pixels - a_pixels;
    });

    if (texture_rows.length > 0)
    {
      for (let i = 0; i < texture_rows.length; i++)
      {
        this.$rows_container.appendChild(texture_rows[i]);
      }
    }
    else
    {
      this.$rows_container.innerHTML = `<div class="texture-node">${this.t('noTexturesFound')}</div>`;
    }
  }

  async get_image_bitmap(texture, full_size = false)
  {
    // Check if texture.source.data is a valid drawable image type
    if (texture.source && texture.source.data)
    {
      const data = texture.source.data;
      const is_image_bitmap = typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap;
      // Check if it's already a valid drawable type
      if (is_image_bitmap ||
          data instanceof HTMLImageElement ||
          data instanceof HTMLCanvasElement ||
          data instanceof HTMLVideoElement ||
          data instanceof OffscreenCanvas)
      {
        const width = data.width;
        const height = data.height;

        if (full_size || (width <= 512 && height <= 512))
        {
          return is_image_bitmap ? data : await createImageBitmap(data);
        }

        const scale = 512 / Math.max(width, height);
        return await createImageBitmap(data, {
          resizeWidth: Math.max(1, Math.round(width * scale)),
          resizeHeight: Math.max(1, Math.round(height * scale)),
          resizeQuality: 'high'
        });
      }
    }

    const source_width = texture.image.width || 512;
    const source_height = texture.image.height || 512;
    const scale = full_size ? 1 : Math.min(1, 512 / Math.max(source_width, source_height));
    const width = Math.max(1, Math.round(source_width * scale));
    const height = Math.max(1, Math.round(source_height * scale));
    const rt = new WebGLRenderTarget(width, height, {
      type: UnsignedByteType,
      colorSpace: LinearSRGBColorSpace
    });
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new MeshBasicMaterial({ map: texture });
    const quad = new Mesh(new PlaneGeometry(2, 2), material);
    quadScene.add(quad);

    const renderer = this.scene_controller.renderer.renderer;
    const previous_output_color_space = renderer.outputColorSpace;
    const buffer = new Uint8Array(width * height * 4);
    try
    {
      renderer.outputColorSpace = LinearSRGBColorSpace;
      renderer.setRenderTarget(rt);
      renderer.render(quadScene, quadCamera);
      renderer.setRenderTarget(null);
      renderer.outputColorSpace = previous_output_color_space;
      renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);
    }
    finally
    {
      renderer.setRenderTarget(null);
      renderer.outputColorSpace = previous_output_color_space;
      rt.dispose();
      material.dispose();
      quad.geometry.dispose();
    }

    if (texture.colorSpace === SRGBColorSpace)
    {
      this.convert_pixel_buffer_to_srgb(buffer);
    }
    const pixel_buffer = new Uint8ClampedArray(buffer);
    const imageData = new ImageData(pixel_buffer, width, height);

    const imageBitmap = await createImageBitmap(imageData);

    return imageBitmap;
  }

  linearToSrgb(value)
  {
  // value in [0, 1]
    if (value <= 0.0031308)
    {
      return 12.92 * value;
    }
    else
    {
      return 1.055 * Math.pow(value, 1.0 / 2.4) - 0.055;
    }
  }

  convert_pixel_buffer_to_srgb(buffer)
  {
    for (let i = 0; i < buffer.length; i += 4)
    {
      const r = buffer[i + 0] / 255;
      const g = buffer[i + 1] / 255;
      const b = buffer[i + 2] / 255;

      buffer[i + 0] = Math.round(this.linearToSrgb(r) * 255);
      buffer[i + 1] = Math.round(this.linearToSrgb(g) * 255);
      buffer[i + 2] = Math.round(this.linearToSrgb(b) * 255);
    }
  }

  image_bitmap_to_data_url(image_bitmap)
  {
    this.canvas.width = image_bitmap.width;
    this.canvas.height = image_bitmap.height;
    this.canvas_ctx.drawImage(image_bitmap, 0, 0);
    return this.canvas.toDataURL();
  }

  async on_row_click(texture_item)
  {
    const selected_row = this.$rows_container.querySelector('.selected');
    if (selected_row)
    {
      selected_row.classList.remove('selected');
    }

    if (texture_item.row !== selected_row)
    {
      texture_item.row.classList.add('selected');

      let bitmap_data_url = '';
      let bitmap = null;
      if (!texture_item.bitmap)
      {
        bitmap = await this.get_image_bitmap(texture_item.instance);
        texture_item.set_bitmap(bitmap);
      }
      else
      {
        bitmap = texture_item.bitmap;
      }
      bitmap_data_url = this.image_bitmap_to_data_url(bitmap);

      const pixelated = texture_item.instance.magFilter === NearestFilter;

      this.texture_preview.show();
      this.texture_preview.set_image(bitmap_data_url, bitmap.width, bitmap.height, texture_item.name, pixelated);
    }
    else
    {
      this.texture_preview.hide();
    }
  }

  async download_image(texture_item)
  {
    const bitmap = await this.get_image_bitmap(texture_item.instance, true);
    console.log(bitmap);
    console.log('download image', texture_item);
    let name = texture_item.name;

    let extension = 'png';
    if (name.split('.').length > 1)
    {
      const original_extension = name.split('.').pop();
      name = name.replace(`.${original_extension}`, '');
      if (
        original_extension === 'png' ||
        original_extension === 'jpg' ||
        original_extension === 'jpeg' ||
        original_extension === 'webp')
      {
        extension = original_extension;
      }
    }
    const data_url = this.image_bitmap_to_data_url(bitmap);
    const a = document.createElement('a');
    a.href = data_url;
    console.log('download image', `${name} (${bitmap.width}x${bitmap.height}).${extension}`);
    a.download = `${name} (${bitmap.width}x${bitmap.height}).${extension}`;
    a.click();
  }

  handle_close_button_click()
  {
    this.hide();
    this.panel.deactivate_button(this.name);
  }

  handle_mesh_name_click(mesh_name, row)
  {
    if (this.panel.handle_mesh_name_click(mesh_name))
    {
      this.handle_close_button_click();
    }
  }
}

export { Textures };
