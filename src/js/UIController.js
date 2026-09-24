import { Details } from './Details';
import { I18n } from './I18n';
import { Panel } from './Panel';
import { Settings } from './Settings';

class UIController
{
  constructor()
  {
    this.i18n = new I18n();

    this.details = new Details(this);
    this.panel = new Panel(this);
    this.settings = new Settings(this);
  }

  init(scene_controller)
  {
    this.scene_controller = scene_controller;

    this.details.init();
    this.panel.init(this.scene_controller, this.details);
    this.settings.init(this.scene_controller);

    const language_select = document.querySelector('.core-language-switch__select');
    if (language_select)
    {
      language_select.value = this.i18n.current_language;
      language_select.addEventListener('change', (event) =>
      {
        this.set_language(event.target.value);
      });
    }

    this.i18n.apply_to_dom(document);
    this.panel.refresh_localized_labels();
  }

  t(key, values = {})
  {
    return this.i18n.t(key, values);
  }

  property_label(key, prettify)
  {
    return this.i18n.property_label(key, prettify);
  }

  set_language(language)
  {
    this.i18n.set_language(language);

    const language_select = document.querySelector('.core-language-switch__select');
    if (language_select && language_select.value !== this.i18n.current_language)
    {
      language_select.value = this.i18n.current_language;
    }

    this.panel.refresh_localized_labels();
    this.details.refresh_localized_labels();
    const info = this.panel.contents.info;
    if (info.scene_controller?.gltf && !info.$container.classList.contains('hidden')) info.fill_info();
    const material_details = this.panel.contents.materials.material_details;
    if (material_details.material && !material_details.$container.classList.contains('hidden')) material_details.create_material_details();
  }

  get_current_language()
  {
    return this.i18n.current_language;
  }

  update()
  {

  }

  handle_object_click(object3d, instance_id)
  {
    if (!this.details.handle_object_click(object3d, instance_id)) return;
    this.panel.contents.hierarchy.handle_object_click(object3d, instance_id);
    this.scene_controller.focus_camera_on_object(object3d, true, instance_id);
    if (object3d.material)
    {
      this.panel.contents.materials.material_details.update_material_details(object3d.material);
    }
  }

  update_panel_contents(object3d)
  {
    this.panel.update_contents(object3d);
  }

  handle_object_update(object3d, edits, instance_id)
  {
    const node = this.panel.contents.hierarchy.find_node_by_object3d(object3d);
    if (node)
    {
      node.$label.textContent = (object3d.name || object3d.type) + (node.total_children_count > 0 ? ` (${node.total_children_count})` : '');
      node.$action.innerHTML = object3d.visible ? node.icons.ICON_OPEN_EYE : node.icons.ICON_CLOSED_EYE;
    }
    if (edits.some(({ key }) => key === 'name'))
    {
      this.panel.contents.materials.update_contents(this.scene_controller.model);
      this.panel.contents.geometries.update_contents(this.scene_controller.model);
      this.panel.contents.textures.update_contents(this.scene_controller.model);
    }
    this.scene_controller.highlight_object(object3d, instance_id);
  }

  handle_action_click(action, active)
  {
    this.scene_controller.handle_action_click(action, active);
  }

  open_material_details(material, centered = false)
  {
    this.panel.contents.materials.material_details.show_material_details(material, centered);
  }
}

export { UIController };
