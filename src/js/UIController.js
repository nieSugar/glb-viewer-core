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
    }

    this.i18n.apply_to_dom(document);
    this.panel.refresh_localized_labels();
  }

  t(key, values = {})
  {
    return this.i18n.t(key, values);
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
    this.details.handle_object_click(object3d, instance_id);
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
