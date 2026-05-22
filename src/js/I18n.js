class I18n
{
  constructor()
  {
    this.storage_key = 'glbViewerCoreLanguage';

    this.translations = {
      en: {
        languageLabel: 'Language',
        panelHierarchy: 'Hierarchy',
        panelTextures: 'Textures',
        panelMaterials: 'Materials',
        panelGeometries: 'Geometries',
        panelAnimations: 'Animations',
        panelInfo: 'Info',
        treeTitle: 'Hierarchy',
        treeSearchPlaceholder: 'Search',
        texturesTitle: 'Textures',
        texturesThTitle: 'Title',
        texturesThMesh: 'Mesh',
        texturesThMaterial: 'Material',
        texturesThType: 'Type',
        texturesThResolution: 'Resolution',
        materialsTitle: 'Materials',
        materialsThName: 'Name',
        materialsThType: 'Type',
        materialsThMeshes: 'Meshes',
        geometriesTitle: 'Geometries',
        geometriesThName: 'Name',
        geometriesThVertexCount: 'Vertex count',
        geometriesThAttributes: 'Attributes',
        geometriesThMeshes: 'Meshes',
        infoTitle: 'Info',
        inspectRawData: 'Inspect raw data',
        openOnBlender: 'Open on blender',
        animationsTitle: 'Animations',
        playAll: 'Play All',
        stopAll: 'Stop All',
        detailsTitle: 'Details',
        copiedToClipboard: 'Copied to clipboard',
        copyFailed: 'Copy failed',
        detailsSettingsTitle: 'Details Settings',
        close: 'Close',
        noTexturesFound: 'No textures found',
        noMaterialsFound: 'No materials found',
        noGeometriesFound: 'No geometries found',
        unknownName: 'No name',
        unknownMaterial: 'Unknown Material',
        unnamedMesh: 'Unnamed Mesh',
        unknownMesh: 'Unknown Mesh',
        unknownType: 'Unknown',
        expand: 'Expand',
        collapse: 'Collapse',
        openDetails: 'Open details',
        openDetailsHint: 'Click for more details',
        openJsonInNewTab: 'Open details JSON in new tab',
        noAttributes: 'No attributes',
        meshCount: '{count} meshes',
        typeCount: '{count} types',
        materialCount: '{count} materials'
      },
      zh: {
        languageLabel: '语言',
        panelHierarchy: '层级',
        panelTextures: '贴图',
        panelMaterials: '材质',
        panelGeometries: '几何体',
        panelAnimations: '动画',
        panelInfo: '信息',
        treeTitle: '层级',
        treeSearchPlaceholder: '搜索',
        texturesTitle: '贴图',
        texturesThTitle: '名称',
        texturesThMesh: '网格',
        texturesThMaterial: '材质',
        texturesThType: '通道',
        texturesThResolution: '分辨率',
        materialsTitle: '材质',
        materialsThName: '名称',
        materialsThType: '类型',
        materialsThMeshes: '网格',
        geometriesTitle: '几何体',
        geometriesThName: '名称',
        geometriesThVertexCount: '顶点数',
        geometriesThAttributes: '属性',
        geometriesThMeshes: '网格',
        infoTitle: '信息',
        inspectRawData: '查看原始数据',
        openOnBlender: '在 Blender 中打开',
        animationsTitle: '动画',
        playAll: '全部播放',
        stopAll: '全部停止',
        detailsTitle: '详情',
        copiedToClipboard: '已复制到剪贴板',
        copyFailed: '复制失败',
        detailsSettingsTitle: '详情设置',
        close: '关闭',
        noTexturesFound: '未找到贴图',
        noMaterialsFound: '未找到材质',
        noGeometriesFound: '未找到几何体',
        unknownName: '未命名',
        unknownMaterial: '未知材质',
        unnamedMesh: '未命名网格',
        unknownMesh: '未知网格',
        unknownType: '未知',
        expand: '展开',
        collapse: '收起',
        openDetails: '打开详情',
        openDetailsHint: '点击查看详情',
        openJsonInNewTab: '在新标签页打开 JSON 详情',
        noAttributes: '无属性',
        meshCount: '{count} 个网格',
        typeCount: '{count} 种类型',
        materialCount: '{count} 个材质'
      }
    };

    this.current_language = this.get_default_language();
  }

  get_default_language()
  {
    const stored = localStorage.getItem(this.storage_key);
    if (stored && this.translations[stored])
    {
      return stored;
    }

    // Default to Chinese unless the user explicitly switches via the UI.
    return 'zh';
  }

  t(key, values = {})
  {
    const active = this.translations[this.current_language] || this.translations.en;
    const raw = active[key] || this.translations.en[key] || key;

    return raw.replace(/\{(\w+)\}/g, (_, token) =>
    {
      if (values[token] === undefined || values[token] === null)
      {
        return '';
      }
      return String(values[token]);
    });
  }

  apply_to_dom(root = document)
  {
    const localized_elements = root.querySelectorAll('[data-i18n]');
    localized_elements.forEach((element) =>
    {
      const key = element.getAttribute('data-i18n');
      if (!key)
      {
        return;
      }
      element.textContent = this.t(key);
    });

    const localized_attribute_elements = root.querySelectorAll('[data-i18n-attr]');
    localized_attribute_elements.forEach((element) =>
    {
      const mapping = element.getAttribute('data-i18n-attr');
      if (!mapping)
      {
        return;
      }

      const [key, attr] = mapping.split(':');
      if (!key || !attr)
      {
        return;
      }

      element.setAttribute(attr, this.t(key));
    });
  }

  set_language(language)
  {
    this.current_language = this.translations[language] ? language : 'en';
    localStorage.setItem(this.storage_key, this.current_language);
    this.apply_to_dom(document);
  }
}

export { I18n };
