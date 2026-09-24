import { Box3, Vector3 } from 'three';
import { ResizableWindow } from './ResizeableWindow';

class Details extends ResizableWindow
{
  constructor(ui_controller)
  {
    const $container = document.querySelector('.details');
    const $content = document.querySelector('.details__content');
    const $headers = document.querySelector('.details__header');

    super($container, $headers, document.querySelector('.details__content-wrapper'));

    this.$content = $content;
    this.$header = $headers;
    this.ui_controller = ui_controller;

    this.original_configuration = null;

    this.all_object_keys = [
      'name',
      'type',
      'position',
      'rotation',
      'scale',
      'visible',
      'castShadow',
      'receiveShadow',
      'userData',
      'layers',
      'matrix',
      'matrixWorld',
      'up',
      'children',
      'parent',
      'frustumCulled',
      'globalScale',
      'globalPosition'
    ];
    this.relevant_object_keys = ['name', 'visible', 'type', 'position', 'rotation', 'scale', 'globalScale', 'userData'];
    this.prettify_property_labels = true;

    this.current_object = null;
    this.editors = [];
    this.readonly_items = [];
    this.last_edit = null;
    this.$undo = document.querySelector('.details__undo');
    this.$error = document.querySelector('.details__error');

    this.$header_message = document.querySelector('.details__header-message');
    this.$header_title = document.querySelector('.details__header-title');
    this.$close = document.querySelector('.details__close-button');

    this.$open_settings = document.querySelector('.details__open-settings-icon');
    this.$close_settings = document.querySelector('.details__close-settings-icon');

    this.$settings = document.querySelector('.details__settings-container');
    this.$settings_list = document.querySelector('.details__settings-list');
    this.$settings_close_button = document.querySelector('.details__settings-close-button');
  }

  init()
  {
    window.addEventListener('message', (event) =>
    {
      const message = event.data;

      if (message.type === 'updateConfig')
      {
        this.original_configuration = JSON.parse(JSON.stringify(message.config));
        this.relevant_object_keys = JSON.parse(JSON.stringify(message.config.relevant3dObjectKeys));
        this.prettify_property_labels = JSON.parse(JSON.stringify(message.config.prettifyPropertyLabels));
        this.fill_settings_list();
      }
    });

    this.$close.addEventListener('click', this.reset_details.bind(this));

    this.$open_settings.addEventListener('click', this.toggle_settings.bind(this));
    this.$close_settings.addEventListener('click', this.toggle_settings.bind(this));
    this.$settings_close_button.addEventListener('click', this.toggle_settings.bind(this));
    this.$undo.addEventListener('click', this.undo_last_edit.bind(this));
    this.$content.addEventListener('submit', (event) =>
    {
      event.preventDefault();
      this.apply_edits();
    });
  }

  reset_details(force = false)
  {
    if (force !== true && !this.can_leave_editor()) return;
    this.current_object = null;
    this.editors = [];
    this.readonly_items = [];
    this.last_edit = null;
    this.$content.innerHTML = '';
    this.$container.classList.add('hidden');
  }

  handle_object_click(obj3d, instance_id)
  {
    if (!this.can_leave_editor()) return false;
    this.last_edit = null;
    this.current_object = obj3d;
    this.current_instance_id = instance_id;
    this.show_object_details();
    return true;
  }

  show_object_details()
  {
    if (!this.current_object) return;
    const box = new Box3().setFromObject(this.current_object);
    this.current_object.globalPosition = box.getCenter(new Vector3());
    this.current_object.globalScale = box.getSize(new Vector3());
    this.editors = [];
    this.readonly_items = [];
    this.$error.textContent = '';
    this.$undo.disabled = !this.last_edit;
    this.$content.innerHTML = '';
    const details = this.create_detail_item(this.current_object);
    for (let i = 0; i < details.length; i++)
    {
      this.$content.appendChild(details[i]);
    }

    if (!this.has_changed)
    {
      this.$container.style.right = '10px';
      this.$container.style.left = 'initial';
      this.$container.style.top = '54px';
    }

    this.$container.classList.remove('hidden');
  }

  create_detail_item(obj)
  {
    const details = [];
    const ICON_SVG = '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M4 2h11v2H6v13H4V2zm4 4h12v16H8V6zm2 2v12h8V8h-8z" fill="currentColor"/> </svg>';
    const relevant_keys = this.relevant_object_keys;
    for (let i = 0; i < relevant_keys.length; i++)
    {
      const key = relevant_keys[i];

      const value = this.format_value(obj, key);

      const $new_details_item = document.createElement('div');
      $new_details_item.classList.add('details__item');
      $new_details_item.dataset.detailKey = key;

      const $item_label = document.createElement('div');
      const $item_content = document.createElement('div');

      $item_label.classList.add('details__item-label');
      $item_content.classList.add('details__item-content');

      $new_details_item.appendChild($item_label);
      $new_details_item.appendChild($item_content);

      $item_label.textContent   = this.prettify_name(key) + ': ';
      $item_label.title = key;
      $item_content.textContent = value;

      if (this.create_editor(obj, key, $item_content))
      {
        $new_details_item.classList.add('details__item--editable');
        if (key === 'visible') $new_details_item.classList.add('details__item--visible');
        details.push($new_details_item);
        continue;
      }
      this.readonly_items.push({ key, content: $item_content });

      if (key === 'type' && obj.isInstancedMesh)
      {
        const $instanced_item_content = document.createElement('div');
        $instanced_item_content.classList.add('details__item-content', 'details__instance-count');
        $new_details_item.appendChild($instanced_item_content);
        $instanced_item_content.textContent = this.ui_controller.t('detailsInstanceCount', { count: obj.count, vertices: obj.geometry.attributes.position.count * obj.count });
      }

      const $item_copy_icon = document.createElement('div');
      $item_copy_icon.classList.add('details__item-copy-icon');
      $item_copy_icon.classList.add('hidden');
      $item_copy_icon.innerHTML = ICON_SVG;
      $new_details_item.addEventListener('mouseenter', () =>
      {
        $item_copy_icon.classList.remove('hidden');
      });
      $new_details_item.addEventListener('mouseleave', () =>
      {
        $item_copy_icon.classList.add('hidden');
      });
      $new_details_item.appendChild($item_copy_icon);

      $new_details_item.onclick = () => this.copy_to_clipboard(this.format_value(obj, key));
      details.push($new_details_item);
    }

    // Add material button if object has a material
    if (obj.material)
    {
      if (Array.isArray(obj.material))
      {
        // Handle array of materials
        for (let i = 0; i < obj.material.length; i++)
        {
          if (obj.material[i])
          {
            const $material_button = this.create_material_button(obj.material[i], i);
            details.push($material_button);
          }
        }
      }
      else
      {
        // Handle single material
        const $material_button = this.create_material_button(obj.material);
        details.push($material_button);
      }
    }

    return details;
  }

  format_value(obj, key)
  {
    const value = obj[key] ?? this.ui_controller.t('detailsUndefined');
    if (key === 'type' && obj.geometry)
    {
      return `${this.ui_controller.type_label(this.get_mesh_type(obj))} (${this.ui_controller.t('detailsVertexCount', { count: obj.geometry.attributes.position.count })})`;
    }
    if (key === 'type') return this.ui_controller.type_label(value);
    if (value.isVector3 || value.isEuler)
    {
      return ['x', 'y', 'z'].map(axis => value[axis].toFixed(2)).join(', ');
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  create_editor(obj, key, container)
  {
    const vector = ['position', 'rotation', 'scale', 'up'].includes(key);
    const boolean = ['visible', 'castShadow', 'receiveShadow', 'frustumCulled'].includes(key);
    if (!vector && !boolean && key !== 'name' && key !== 'userData') return false;

    container.textContent = '';
    container.classList.add('details__editor');
    const inputs = [];
    for (const axis of vector ? ['x', 'y', 'z'] : [''])
    {
      const input = document.createElement(key === 'userData' ? 'textarea' : 'input');
      input.setAttribute('aria-label', this.prettify_name(key) + (axis ? ` ${axis.toUpperCase()}` : ''));
      if (vector)
      {
        input.type = 'number';
        input.step = 'any';
        input.required = true;
        input.value = obj[key][axis];
        const label = document.createElement('label');
        label.textContent = axis.toUpperCase();
        label.appendChild(input);
        container.appendChild(label);
      }
      else
      {
        if (boolean)
        {
          input.type = 'checkbox';
          input.setAttribute('role', 'switch');
          input.checked = obj[key];
        }
        else
        {
          input.value = key === 'userData' ? JSON.stringify(obj[key], null, 2) : obj[key];
          if (key === 'userData') input.rows = 6;
        }
        container.appendChild(input);
      }
      inputs.push(input);
    }
    if (key === 'rotation')
    {
      const unit = document.createElement('span');
      unit.textContent = 'rad';
      container.appendChild(unit);
    }
    const editor = { key, inputs, vector, boolean, error: '', original: inputs.map(input => boolean ? input.checked : input.value) };
    this.editors.push(editor);
    for (const input of inputs)
    {
      input.addEventListener('change', () => this.apply_edits([editor]));
      input.addEventListener('keydown', (event) =>
      {
        // Keep viewer shortcuts out of text/number editing.
        event.stopPropagation();
        if (event.isComposing) return;
        if (event.key === 'Escape')
        {
          event.preventDefault();
          this.refresh_values([key]);
        }
        if (event.key === 'Enter' && (key !== 'userData' || event.ctrlKey || event.metaKey))
        {
          event.preventDefault();
          this.apply_edits([editor]);
        }
      });
    }
    return true;
  }

  editor_changed(editor)
  {
    return editor.inputs.some((input, index) =>
      (editor.boolean ? input.checked : input.value) !== editor.original[index]);
  }

  can_leave_editor()
  {
    return !this.current_object || this.apply_edits();
  }

  read_edits(editors = this.editors)
  {
    const edits = [];
    for (const editor of editors)
    {
      const { key, inputs, vector, boolean } = editor;
      editor.error = '';
      if (!this.editor_changed(editor)) continue;
      let value = boolean ? inputs[0].checked : inputs[0].value;
      try
      {
        if (vector)
        {
          value = inputs.map(input => input.value.trim() === '' ? NaN : Number(input.value));
          if (!value.every(Number.isFinite)) throw new Error(this.ui_controller.t('detailsInvalidNumber', { key: this.prettify_name(key) }));
        }
        if (key === 'userData')
        {
          try
          {
            value = JSON.parse(value);
            if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
          }
          catch
          {
            throw new Error(this.ui_controller.t('detailsInvalidJson'));
          }
        }
      }
      catch (error)
      {
        editor.error = error.message;
        continue;
      }
      edits.push({ key, value, vector });
    }
    const invalid = editors.find(editor => editor.error);
    if (invalid) throw new Error(invalid.error);
    return edits;
  }

  apply_edits(editors = this.editors)
  {
    if (!this.current_object) return false;
    let edits = [];
    try
    {
      edits = this.read_edits(editors);
    }
    catch
    {
      this.refresh_feedback();
      return false;
    }
    if (edits.length === 0)
    {
      this.refresh_feedback();
      return true;
    }
    this.last_edit = edits.map(({ key, vector }) => ({
      key, vector, value: vector ? this.current_object[key].toArray().slice(0, 3) : this.current_object[key]
    }));
    this.write_edits(edits);
    return true;
  }

  write_edits(edits)
  {
    const obj = this.current_object;
    if (edits.some(({ vector }) => vector)) this.ui_controller.panel.contents.animations.stop_all();
    for (const { key, value, vector } of edits)
    {
      if (vector) obj[key].set(...value);
      else obj[key] = value;
    }
    if (edits.some(({ vector }) => vector)) obj.updateMatrix();
    obj.updateWorldMatrix(true, true);
    this.ui_controller.handle_object_update(obj, edits, this.current_instance_id);
    this.refresh_values(edits.map(({ key }) => key));
  }

  undo_last_edit()
  {
    if (!this.last_edit || !this.current_object) return;
    const edits = this.last_edit;
    this.last_edit = null;
    this.write_edits(edits);
  }

  refresh_values(keys)
  {
    const obj = this.current_object;
    for (const editor of this.editors)
    {
      if (!keys.includes(editor.key)) continue;
      editor.inputs.forEach((input, index) =>
      {
        if (editor.boolean) input.checked = obj[editor.key];
        else if (editor.vector) input.value = obj[editor.key][['x', 'y', 'z'][index]];
        else input.value = editor.key === 'userData' ? JSON.stringify(obj.userData, null, 2) : obj[editor.key];
      });
      editor.original = editor.inputs.map(input => editor.boolean ? input.checked : input.value);
      editor.error = '';
    }
    const box = new Box3().setFromObject(obj);
    obj.globalPosition = box.getCenter(new Vector3());
    obj.globalScale = box.getSize(new Vector3());
    for (const { key, content } of this.readonly_items) content.textContent = this.format_value(obj, key);
    this.$undo.disabled = !this.last_edit;
    this.refresh_feedback();
  }

  refresh_feedback()
  {
    this.$error.textContent = this.editors.map(editor => editor.error).filter(Boolean).join('\n');
    for (const editor of this.editors)
    {
      for (const input of editor.inputs) input.setAttribute('aria-invalid', String(!!editor.error));
    }
  }

  create_material_button(material)
  {
    const $material_button = document.createElement('div');

    $material_button.classList.add('button');
    $material_button.classList.add('details__material-button');

    $material_button.textContent = this.ui_controller.t('openMaterialDetails');
    $material_button.title = this.ui_controller.t('openMaterialDetailsHint');

    $material_button.addEventListener('click', (e) =>
    {
      e.stopPropagation();
      this.open_material_details(material);
    });

    return $material_button;
  }

  open_material_details(material)
  {
    this.ui_controller.open_material_details(material, true);
  }

  async copy_to_clipboard(text)
  {
    const copied = await this.try_copy_to_clipboard(String(text));

    this.$header_message.textContent = copied
      ? this.ui_controller.t('copiedToClipboard')
      : this.ui_controller.t('copyFailed');
    this.$header_title.classList.add('hidden');
    this.$header_message.classList.remove('faded');

    setTimeout(() =>
    {
      this.$header_message.classList.add('faded');
      this.$header_title.classList.remove('hidden');
    }, 1000);
  }

  async try_copy_to_clipboard(text)
  {
    try
    {
      if (navigator.clipboard && window.isSecureContext)
      {
        await navigator.clipboard.writeText(text);
        return true;
      }
    }
    catch (error)
    {
      console.warn('Clipboard API failed, falling back to execCommand:', error);
    }

    return this.copy_to_clipboard_fallback(text);
  }

  copy_to_clipboard_fallback(text)
  {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';

    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const original_range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.focus();
    textarea.select();

    let success = false;
    try
    {
      success = document.execCommand('copy');
    }
    catch (error)
    {
      console.warn('execCommand copy fallback failed:', error);
      success = false;
    }

    document.body.removeChild(textarea);

    if (selection && original_range)
    {
      selection.removeAllRanges();
      selection.addRange(original_range);
    }

    return success;
  }

  prettify_name(name)
  {
    return this.ui_controller.property_label(name, this.prettify_property_labels);
  }

  refresh_localized_labels()
  {
    this.fill_settings_list();
    for (const item of this.$content.querySelectorAll('.details__item[data-detail-key]'))
    {
      const key = item.dataset.detailKey;
      item.querySelector('.details__item-label').textContent = this.prettify_name(key) + ': ';
    }
    for (const editor of this.editors)
    {
      editor.inputs.forEach((input, index) =>
      {
        input.setAttribute('aria-label', this.prettify_name(editor.key) + (editor.vector ? ` ${['X', 'Y', 'Z'][index]}` : ''));
      });
    }
    for (const { key, content } of this.readonly_items) content.textContent = this.format_value(this.current_object, key);
    const instance_count = this.$content.querySelector('.details__instance-count');
    if (instance_count)
    {
      const obj = this.current_object;
      instance_count.textContent = this.ui_controller.t('detailsInstanceCount', { count: obj.count, vertices: obj.geometry.attributes.position.count * obj.count });
    }
    for (const button of this.$content.querySelectorAll('.details__material-button'))
    {
      button.textContent = this.ui_controller.t('openMaterialDetails');
      button.title = this.ui_controller.t('openMaterialDetailsHint');
    }
    if (this.editors.some(editor => editor.error))
    {
      try { this.read_edits(); } catch {}
      this.refresh_feedback();
    }
  }

  get_mesh_type(obj)
  {
    if (obj.isSkinnedMesh)
    {
      return 'SkinnedMesh';
    }
    if (obj.isInstancedMesh)
    {
      return 'InstancedMesh';
    }
    if (obj.isMesh)
    {
      return 'Mesh';
    }
    return obj.type;
  }

  toggle_settings()
  {
    if (this.$settings.classList.contains('hidden'))
    {
      this.$settings.classList.remove('hidden');
      this.$open_settings.classList.add('hidden');
      this.$close_settings.classList.remove('hidden');
    }
    else
    {
      this.$settings.classList.add('hidden');
      this.$open_settings.classList.remove('hidden');
      this.$close_settings.classList.add('hidden');
    }
  }

  fill_settings_list()
  {
    this.$settings_list.innerHTML = '';
    for (let i = 0; i < this.all_object_keys.length; i++)
    {
      const key = this.all_object_keys[i];
      const $setting_item = document.createElement('div');
      $setting_item.dataset.settingKey = key;
      $setting_item.classList.add('details__settings-item');
      $setting_item.textContent = this.prettify_name(key);

      const $eye_icon = document.createElement('div');
      $eye_icon.classList.add('details__settings-icon', 'details__settings-eye-icon', 'hidden');
      $eye_icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';

      const $closed_eye_icon = document.createElement('div');
      $closed_eye_icon.classList.add('details__settings-icon', 'details__settings-closed-eye-icon', 'hidden');
      $closed_eye_icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>';

      $setting_item.appendChild($eye_icon);
      $setting_item.appendChild($closed_eye_icon);
      $setting_item.addEventListener('click', this.toggle_setting.bind(this, $setting_item));

      if (this.relevant_object_keys.includes(key))
      {
        $eye_icon.classList.remove('hidden');
      }
      else
      {
        $closed_eye_icon.classList.remove('hidden');
        $setting_item.classList.add('not-relevant');
      }

      this.$settings_list.appendChild($setting_item);
    }
  }

  show_setting($setting_item)
  {
    this.relevant_object_keys.push($setting_item.dataset.settingKey);

    this.show_object_details();
    $setting_item.classList.remove('not-relevant');

    const eye_icon = $setting_item.querySelector('.details__settings-eye-icon');
    const closed_eye_icon = $setting_item.querySelector('.details__settings-closed-eye-icon');

    eye_icon.classList.remove('hidden');
    closed_eye_icon.classList.add('hidden');
  }

  hide_setting($setting_item)
  {
    const index = this.relevant_object_keys.indexOf($setting_item.dataset.settingKey);
    this.relevant_object_keys.splice(index, 1);
    this.show_object_details();

    const eye_icon = $setting_item.querySelector('.details__settings-eye-icon');
    const closed_eye_icon = $setting_item.querySelector('.details__settings-closed-eye-icon');

    eye_icon.classList.add('hidden');
    closed_eye_icon.classList.remove('hidden');

    $setting_item.classList.add('not-relevant');
  }

  toggle_setting($setting_item)
  {
    if (!this.can_leave_editor()) return;
    if (this.relevant_object_keys.includes($setting_item.dataset.settingKey))
    {
      this.hide_setting($setting_item);
    }
    else
    {
      this.show_setting($setting_item);
    }
  }
}

export { Details };
