class PropertyPanel {
  constructor(editorView) {
    this.editorView = editorView;
  }
  
  renderPropertyPanel() {
    // Define rows for clarity
    const rows = [
      `<div class="property-row"><div class="property-label">ID</div><div class="property-input"><input type="text" id="prop-id" placeholder="Component ID" readonly></div></div>`, // ID usually read-only
      `<div class="property-row"><div class="property-label">X</div><div class="property-input"><input type="number" id="prop-x" placeholder="X"></div></div>`,
      `<div class="property-row"><div class="property-label">Y</div><div class="property-input"><input type="number" id="prop-y" placeholder="Y"></div></div>`,
      `<div class="property-row"><div class="property-label">Width</div><div class="property-input"><select id="prop-width"><option value="wrap_content">Wrap</option><option value="match_parent">Match</option><option value="fixed">Fixed</option></select></div></div>`,
      `<div class="property-row"><div class="property-label">Height</div><div class="property-input"><select id="prop-height"><option value="wrap_content">Wrap</option><option value="match_parent">Match</option><option value="fixed">Fixed</option></select></div></div>`,
      `<div class="property-row" data-prop="text"><div class="property-label">Text</div><div class="property-input"><input type="text" id="prop-text" placeholder="Text"></div></div>`,
      `<div class="property-row" data-prop="textSize"><div class="property-label">Text Size</div><div class="property-input"><input type="number" id="prop-textsize"></div></div>`,
      `<div class="property-row" data-prop="textColor"><div class="property-label">Text Color</div><div class="property-input"><input type="color" id="prop-textcolor"></div></div>`,
      `<div class="property-row" data-prop="hint" style="display:none;"><div class="property-label">Hint</div><div class="property-input"><input type="text" id="prop-hint" placeholder="Hint"></div></div>`,
      `<div class="property-row" data-prop="hintColor" style="display:none;"><div class="property-label">Hint Color</div><div class="property-input"><input type="color" id="prop-hintcolor"></div></div>`,
      `<div class="property-row" data-prop="font"><div class="property-label">Font</div><div class="property-input"><input type="text" id="prop-font" placeholder="e.g., Arial, sans-serif"></div></div>`,
      `<div class="property-row" data-prop="bgColor"><div class="property-label">Background</div><div class="property-input"><input type="color" id="prop-bgcolor"></div></div>`,
      `<div class="property-row" data-prop="margin"><div class="property-label">Margin</div><div class="property-input"><input type="text" id="prop-margin" placeholder="e.g. 8px"></div></div>`,
      `<div class="property-row" data-prop="padding"><div class="property-label">Padding</div><div class="property-input"><input type="text" id="prop-padding" placeholder="e.g. 8px"></div></div>`,
      `<div class="property-row" data-prop="borderRadius"><div class="property-label">Border Radius</div><div class="property-input"><input type="text" id="prop-borderradius" placeholder="e.g. 4px"></div></div>`,
      `<div class="property-row" data-prop="borderColor"><div class="property-label">Border Color</div><div class="property-input"><input type="color" id="prop-bordercolor"></div></div>`,
      `<div class="property-row" data-prop="boxShadow"><div class="property-label">Box Shadow</div><div class="property-input"><input type="text" id="prop-boxshadow" placeholder="e.g. 2px 2px 5px #888"></div></div>`,
      // -- New Specific Properties --
      `<div class="property-row" data-prop="src" style="display:none;"><div class="property-label">Image Source</div><div class="property-input"><input type="text" id="prop-src" placeholder="Image URL"></div></div>`,
      `<div class="property-row" data-prop="scaleType" style="display:none;"><div class="property-label">Scale Type</div><div class="property-input"><select id="prop-scaleType"><option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Fill</option><option value="fitCenter">Fit Center</option></select></div></div>`,
      `<div class="property-row" data-prop="checked" style="display:none;"><div class="property-label">Checked</div><div class="property-input"><input type="checkbox" id="prop-checked"></div></div>`,
      `<div class="property-row" data-prop="progress" style="display:none;"><div class="property-label">Progress</div><div class="property-input"><input type="number" id="prop-progress" min="0" max="100"></div></div>`,
      `<div class="property-row" data-prop="max" style="display:none;"><div class="property-label">Max</div><div class="property-input"><input type="number" id="prop-max"></div></div>`,
      `<div class="property-row" data-prop="items" style="display:none;"><div class="property-label">Items</div><div class="property-input"><input type="text" id="prop-items" placeholder="Comma-separated"></div></div>`,
      `<div class="property-row" data-prop="orientation" style="display:none;"><div class="property-label">Orientation</div><div class="property-input"><select id="prop-orientation"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></div></div>`,
      `<div class="property-row" data-prop="url" style="display:none;"><div class="property-label">URL</div><div class="property-input"><input type="text" id="prop-url" placeholder="https://..."></div></div>`,
    ];

    return `
      <div class="property-editor" id="property-editor">
        <div class="property-group">
          ${rows.join('')}
        </div>
        <button class="close-btn" id="close-prop-panel"><i class="material-icons">close</i></button>
      </div>
    `;
  }

  showPropertyPanel() {
    const propPanel = document.getElementById('property-editor');
    if (!propPanel) return; 

    this.editorView.propertyPanelVisible = true;
    propPanel.classList.add('visible');

    // Populate values
    this.updatePropertyEditor(); 

    // Setup events now that the panel is visible and populated
    this.setupPropertyEditorEvents();

    // Setup close button event listener
    const closePropBtn = propPanel.querySelector('#close-prop-panel'); 
    if (closePropBtn) {
      // Remove previous listener if any to avoid duplicates
      closePropBtn.onclick = null;
      closePropBtn.onclick = () => {
        this.hidePropertyPanel();
      };
    }
  }

  hidePropertyPanel() {
    this.editorView.propertyPanelVisible = false;
    const propPanel = document.getElementById('property-editor');
    if (propPanel) propPanel.classList.remove('visible');
    
    if (this.editorView.selectedComponent) { 
      const prevSelected = document.querySelector(`.preview-component[data-component-id="${this.editorView.selectedComponent.id}"]`);
      if (prevSelected) prevSelected.classList.remove('selected');
      this.editorView.selectedComponent = null;
    }
  }

  updatePropertyEditor() {
    if (!this.editorView.selectedComponent) return;
    const props = this.editorView.selectedComponent.properties;
    const type = this.editorView.selectedComponent.type;
    const panel = document.getElementById('property-editor');
    if (!panel) return;

    // Helper to set value if element exists
    const setValue = (id, value) => {
      const el = panel.querySelector(`#${id}`);
      if (el) {
        if (el.type === 'checkbox') el.checked = !!value;
        else el.value = value !== null && value !== undefined ? value : '';
      }
    };
    
    // Helper to show/hide row
    const showRow = (propName, show) => {
      const row = panel.querySelector(`.property-row[data-prop="${propName}"]`);
      if (row) row.style.display = show ? 'flex' : 'none';
    };

    // Set common properties
    setValue('prop-id', this.editorView.selectedComponent.id);
    setValue('prop-x', props.x);
    setValue('prop-y', props.y);
    setValue('prop-width', props.width || 'wrap_content');
    setValue('prop-height', props.height || 'wrap_content');
    setValue('prop-margin', props.margin);
    setValue('prop-padding', props.padding);
    setValue('prop-bgColor', props.bgColor || '#FFFFFF');
    setValue('prop-font', props.font);
    setValue('prop-borderradius', props.borderRadius || '0px');
    setValue('prop-bordercolor', props.borderColor || '#000000');
    setValue('prop-boxshadow', props.boxShadow || 'none');
    
    // Show/Hide and set component-specific properties
    const hasText = ['textview', 'button', 'edittext', 'checkbox', 'radiobutton', 'switch'].includes(type);
    showRow('text', hasText);
    if (hasText) setValue('prop-text', props.text);

    const hasTextOptions = hasText || type === 'edittext'; // EditText needs size/color even without text (for hint)
    showRow('textSize', hasTextOptions);
    if (hasTextOptions) setValue('prop-textsize', props.textSize || 14);
    showRow('textColor', hasTextOptions);
    if (hasTextOptions) setValue('prop-textcolor', props.textColor || '#000000');

    const isEditText = type === 'edittext';
    showRow('hint', isEditText);
    if (isEditText) setValue('prop-hint', props.hint);
    showRow('hintColor', isEditText);
    if (isEditText) setValue('prop-hintcolor', props.hintColor || '#A0A0A0');

    const isImageView = type === 'imageview';
    showRow('src', isImageView);
    if (isImageView) setValue('prop-src', props.src);
    showRow('scaleType', isImageView);
    if (isImageView) setValue('prop-scaleType', props.scaleType || 'fitCenter');

    const isCheckable = ['checkbox', 'radiobutton', 'switch'].includes(type);
    showRow('checked', isCheckable);
    if (isCheckable) setValue('prop-checked', props.checked);

    const hasProgress = ['progressbar', 'seekbar'].includes(type);
    showRow('progress', hasProgress);
    if (hasProgress) setValue('prop-progress', props.progress);
    showRow('max', hasProgress);
    if (hasProgress) setValue('prop-max', props.max || 100);

    const hasItems = ['spinner', 'listview'].includes(type);
    showRow('items', hasItems);
    if (hasItems) setValue('prop-items', Array.isArray(props.items) ? props.items.join(', ') : props.items); // Handle array or string

    const isLayout = type.startsWith('linearlayout') || type.startsWith('scrollview');
    showRow('orientation', isLayout);
    if (isLayout) setValue('prop-orientation', props.orientation);

    const isWebView = type === 'webview';
    showRow('url', isWebView);
    if (isWebView) setValue('prop-url', props.url);
  }

  setupPropertyEditorEvents() {
    const c = this.editorView.selectedComponent;
    if (!c) return;
    const panel = document.getElementById('property-editor');
    if (!panel) return;

    // Helper to add listener if element exists
    const addListener = (id, eventType, handler) => {
      const el = panel.querySelector(`#${id}`);
      if (el) {
        // Remove previous listener first if needed (simple overwrite works for onX)
        el[eventType] = (e) => { 
          if (!this.editorView.selectedComponent) return; // Re-check component exists
          handler(e);
          this.editorView.componentManager.saveComponentUpdate(false, true); // Reselect, keep panel open
          this.editorView.requestPreviewUpdate(); // <<< ADDED: Trigger preview update
          this.editorView.notifyCodePotentiallyDirty(c.id, e.target.id); // <<< ADDED: Notify code manager
        }; 
      }
    };

    // --- Common Properties ---
    // ID (read-only for now)
    // addListener('prop-id', 'oninput', (e) => { c.id = e.target.value; }); 
    addListener('prop-x', 'oninput', (e) => { c.properties.x = parseInt(e.target.value) || 0; });
    addListener('prop-y', 'oninput', (e) => { c.properties.y = parseInt(e.target.value) || 0; });
    addListener('prop-width', 'onchange', (e) => { c.properties.width = e.target.value; });
    addListener('prop-height', 'onchange', (e) => { c.properties.height = e.target.value; });
    addListener('prop-margin', 'oninput', (e) => { c.properties.margin = e.target.value; });
    addListener('prop-padding', 'oninput', (e) => { c.properties.padding = e.target.value; });
    addListener('prop-bgColor', 'oninput', (e) => { c.properties.bgColor = e.target.value; });
    addListener('prop-font', 'oninput', (e) => { c.properties.font = e.target.value; });
    addListener('prop-borderradius', 'oninput', (e) => { c.properties.borderRadius = e.target.value; });
    addListener('prop-bordercolor', 'oninput', (e) => { c.properties.borderColor = e.target.value; });
    addListener('prop-boxshadow', 'oninput', (e) => { c.properties.boxShadow = e.target.value; });

    // --- Component Specific --- 
    addListener('prop-text', 'oninput', (e) => { c.properties.text = e.target.value; });
    addListener('prop-textsize', 'oninput', (e) => { c.properties.textSize = parseInt(e.target.value) || 14; });
    addListener('prop-textcolor', 'oninput', (e) => { c.properties.textColor = e.target.value; });
    addListener('prop-hint', 'oninput', (e) => { c.properties.hint = e.target.value; });
    addListener('prop-hintcolor', 'oninput', (e) => { c.properties.hintColor = e.target.value; });
    addListener('prop-src', 'oninput', (e) => { c.properties.src = e.target.value; });
    addListener('prop-scaleType', 'onchange', (e) => { c.properties.scaleType = e.target.value; });
    addListener('prop-checked', 'onchange', (e) => { c.properties.checked = e.target.checked; });
    addListener('prop-progress', 'oninput', (e) => { c.properties.progress = parseInt(e.target.value) || 0; });
    addListener('prop-max', 'oninput', (e) => { c.properties.max = parseInt(e.target.value) || 100; });
    addListener('prop-items', 'oninput', (e) => { c.properties.items = e.target.value; }); // Store as string
    addListener('prop-orientation', 'onchange', (e) => { c.properties.orientation = e.target.value; });
    addListener('prop-url', 'oninput', (e) => { c.properties.url = e.target.value; });
  }
}

export default PropertyPanel; 