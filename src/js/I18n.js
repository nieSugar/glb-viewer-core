class I18n
{
  constructor()
  {
    this.storage_key = 'glbViewerCoreLanguage';

    this.translations = {
      en: {
        pageTitle: 'GLB Viewer',
        languageLabel: 'Language',
        panelHierarchy: 'Hierarchy',
        panelTextures: 'Textures',
        panelMaterials: 'Materials',
        panelGeometries: 'Geometries',
        panelAnimations: 'Animations',
        panelInfo: 'Info',
        treeTitle: 'Hierarchy',
        treeSearchPlaceholder: 'Search',
        settingsDoubleSided: 'Double sided',
        settingsWireframe: 'Show wireframe',
        settingsNormals: 'Show normals',
        settingsSelectionWireframe: 'Show selection wireframe',
        settingsNormalVectors: 'Show normals vectors',
        settingsTangentVectors: 'Show tangents vectors',
        settingsOriginArrows: 'Show origin arrows',
        settingsVectorSize: 'Vector size',
        settingsFov: 'FOV',
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
        infoFileSize: 'File size',
        infoDrawcalls: 'Drawcalls',
        infoImages: 'Images',
        infoModelVertices: 'Model vertices',
        infoDrawnVertices: 'Drawn vertices',
        infoRegularVertices: 'Regular vertices',
        infoInstancedVertices: 'Instanced vertices',
        infoVertices: 'Vertices',
        infoGenerator: 'Generator',
        infoExtensions: 'Extensions',
        infoNone: 'None',
        infoBytes: '{count} bytes ({size} {unit})',
        inspectRawData: 'Inspect raw data',
        openOnBlender: 'Open on blender',
        animationsTitle: 'Animations',
        playAll: 'Play All',
        stopAll: 'Stop All',
        detailsTitle: 'Details',
        detailsAutoApply: 'Edits apply automatically',
        detailsUndo: 'Undo last edit',
        detailsEditHint: 'Enter or blur to apply; Esc to reset input. JSON: Ctrl/Cmd+Enter. Preview only; source file unchanged. Transform edits stop animations; instanced meshes are edited as a whole.',
        detailsInvalidNumber: '{key}: enter a finite number for each axis, or press Esc to reset.',
        detailsInvalidJson: 'User data must be a JSON object (not an array or null). Press Esc to reset.',
        detailsInstanceCount: 'Instance count: {count} ({vertices} vertices)',
        detailsVertexCount: '{count} vertices',
        detailsUndefined: 'undefined',
        openMaterialDetails: 'Open material details',
        openMaterialDetailsHint: 'Click to view material details',
        copiedToClipboard: 'Copied to clipboard',
        copyFailed: 'Copy failed',
        detailsSettingsTitle: 'Details Settings',
        materialDetailsTitle: 'Material Details',
        inspectJson: 'Inspect JSON',
        materialName: 'Name',
        materialType: 'Type',
        materialTransparent: 'Transparent',
        materialOpacity: 'Opacity',
        materialSide: 'Side',
        materialUserData: 'User data',
        materialAlphaMap: 'Alpha map',
        materialColor: 'Color',
        materialLightMap: 'Light map',
        materialMap: 'Map',
        materialSpecularMap: 'Specular map',
        materialSpecularColorMap: 'Specular color map',
        materialEmissiveIntensity: 'Emissive intensity',
        materialEmissiveColor: 'Emissive color',
        materialMetalness: 'Metalness',
        materialRoughness: 'Roughness',
        materialAoMap: 'Ao map',
        materialNormalMap: 'Normal map',
        materialEmissiveMap: 'Emissive map',
        materialMetalnessMap: 'Metalness map',
        materialRoughnessMap: 'Roughness map',
        materialTransmission: 'Transmission',
        materialClearcoat: 'Clearcoat',
        materialIor: 'IOR',
        materialSpecularIntensity: 'Specular intensity',
        materialSpecularColor: 'Specular color',
        materialClearcoatMap: 'Clearcoat map',
        materialTransmissionMap: 'Transmission map',
        unnamedMaterialWithId: 'Material {id}',
        unnamedTexture: 'Unnamed texture',
        geometryFallback: 'Geometry {index}',
        instancedGeometryFallback: 'Instanced geometry {index}',
        texturePreviewTitle: 'Texture Name',
        yes: 'Yes',
        no: 'No',
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
        materialCount: '{count} materials',
        properties: {}
      },
      zh: {
        pageTitle: 'GLB 查看器',
        languageLabel: '语言',
        panelHierarchy: '层级',
        panelTextures: '贴图',
        panelMaterials: '材质',
        panelGeometries: '几何体',
        panelAnimations: '动画',
        panelInfo: '信息',
        treeTitle: '层级',
        treeSearchPlaceholder: '搜索',
        settingsDoubleSided: '双面显示',
        settingsWireframe: '显示线框',
        settingsNormals: '显示法线',
        settingsSelectionWireframe: '显示选中对象线框',
        settingsNormalVectors: '显示法线向量',
        settingsTangentVectors: '显示切线向量',
        settingsOriginArrows: '显示原点坐标轴',
        settingsVectorSize: '向量大小',
        settingsFov: '视野角度',
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
        infoFileSize: '文件大小',
        infoDrawcalls: '绘制调用',
        infoImages: '图像',
        infoModelVertices: '模型顶点数',
        infoDrawnVertices: '绘制顶点数',
        infoRegularVertices: '普通顶点数',
        infoInstancedVertices: '实例化顶点数',
        infoVertices: '顶点数',
        infoGenerator: '生成工具',
        infoExtensions: '扩展',
        infoNone: '无',
        infoBytes: '{count} 字节（{size} {unit}）',
        inspectRawData: '查看原始数据',
        openOnBlender: '在 Blender 中打开',
        animationsTitle: '动画',
        playAll: '全部播放',
        stopAll: '全部停止',
        detailsTitle: '详情',
        detailsAutoApply: '直接编辑 · 自动应用',
        detailsUndo: '撤销上次修改',
        detailsEditHint: 'Enter 或移开焦点生效，Esc 还原输入；JSON 支持 Ctrl/Cmd+Enter。仅修改预览，不写回源文件；修改变换会停止动画，实例化网格按整体编辑。',
        detailsInvalidNumber: '{key}：每个轴都必须填写有限数值，或按 Esc 还原。',
        detailsInvalidJson: '自定义数据必须是 JSON 对象，不能是数组或 null；可按 Esc 还原。',
        detailsInstanceCount: '实例数：{count}（{vertices} 个顶点）',
        detailsVertexCount: '{count} 个顶点',
        detailsUndefined: '未定义',
        openMaterialDetails: '打开材质详情',
        openMaterialDetailsHint: '点击查看材质详情',
        copiedToClipboard: '已复制到剪贴板',
        copyFailed: '复制失败',
        detailsSettingsTitle: '详情设置',
        materialDetailsTitle: '材质详情',
        inspectJson: '查看 JSON',
        materialName: '名称',
        materialType: '类型',
        materialTransparent: '透明',
        materialOpacity: '不透明度',
        materialSide: '渲染面',
        materialUserData: '自定义数据',
        materialAlphaMap: '透明度贴图',
        materialColor: '颜色',
        materialLightMap: '光照贴图',
        materialMap: '基础贴图',
        materialSpecularMap: '高光贴图',
        materialSpecularColorMap: '高光颜色贴图',
        materialEmissiveIntensity: '自发光强度',
        materialEmissiveColor: '自发光颜色',
        materialMetalness: '金属度',
        materialRoughness: '粗糙度',
        materialAoMap: '环境光遮蔽贴图',
        materialNormalMap: '法线贴图',
        materialEmissiveMap: '自发光贴图',
        materialMetalnessMap: '金属度贴图',
        materialRoughnessMap: '粗糙度贴图',
        materialTransmission: '透射率',
        materialClearcoat: '清漆层强度',
        materialIor: '折射率',
        materialSpecularIntensity: '高光强度',
        materialSpecularColor: '高光颜色',
        materialClearcoatMap: '清漆层贴图',
        materialTransmissionMap: '透射贴图',
        unnamedMaterialWithId: '材质 {id}',
        unnamedTexture: '未命名贴图',
        geometryFallback: '几何体 {index}',
        instancedGeometryFallback: '实例化几何体 {index}',
        texturePreviewTitle: '贴图名称',
        yes: '是',
        no: '否',
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
        materialCount: '{count} 个材质',
        properties: {
          name: '名称', type: '类型', position: '位置', rotation: '旋转', scale: '缩放',
          visible: '可见', castShadow: '投射阴影', receiveShadow: '接收阴影',
          userData: '自定义数据', layers: '图层', matrix: '变换矩阵',
          matrixWorld: '世界矩阵', up: '上方向', children: '子对象', parent: '父对象',
          frustumCulled: '视锥剔除', globalScale: '全局尺寸', globalPosition: '全局位置'
        }
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

  property_label(key, prettify = true)
  {
    if (!prettify) return key;
    const translated = this.translations[this.current_language].properties[key];
    if (translated) return translated;
    const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  apply_to_dom(root = document)
  {
    document.documentElement.lang = this.current_language === 'zh' ? 'zh-CN' : 'en';
    document.title = this.t('pageTitle');
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
