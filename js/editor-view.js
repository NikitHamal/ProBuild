import AppService from './app-service.js';

class EditorView {
  constructor() {
    this.appService = AppService;
    this.currentApp = null;
    this.currentScreen = null;
    this.selectedComponent = null;
    this.propertyPanelVisible = false;
    this.isDraggingComponent = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.draggedComponentStartX = 0;
    this.draggedComponentStartY = 0;
    
    this.devices = [
        { name: 'Phone (Default)', width: 320, height: 600 },
        { name: 'Phone (Large)', width: 414, height: 896 },
        { name: 'Tablet (Portrait)', width: 768, height: 1024 },
        { name: 'Tablet (Landscape)', width: 1024, height: 768 }
    ];
    this.selectedDevice = this.devices[0]; // Default
    
    this.init();
  }

  init() {
    // Get app ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get('id');
    
    if (!appId) {
      // Redirect to home if no app ID
      window.location.href = 'index.html';
      return;
    }
    
    this.currentApp = this.appService.getAppById(appId);
    
    if (!this.currentApp) {
      // App not found, redirect to home
      window.location.href = 'index.html';
      return;
    }
    
    // Set the first screen as active by default
    this.currentScreen = this.currentApp.screens[0];
    
    this.renderEditor();
    this.setupEventListeners();
  }

  renderEditor() {
    // Generate device options HTML
    const deviceOptionsHtml = this.devices.map(device => 
        `<option value="${device.name}"${device.name === this.selectedDevice.name ? ' selected' : ''}>${device.name}</option>`
    ).join('');

    document.body.innerHTML = `
      <div class="editor-container">
        <div class="components-sidebar">
          <div class="components-list">
            <div class="sidebar-title" style="padding: 8px 12px;">Layouts</div>
            <div class="component-item" data-type="linearlayout-h" draggable="true"><i class="material-icons">view_week</i><div class="component-name">LinearLayout (H)</div></div>
            <div class="component-item" data-type="linearlayout-v" draggable="true"><i class="material-icons">view_day</i><div class="component-name">LinearLayout (V)</div></div>
            <div class="component-item" data-type="scrollview-h" draggable="true"><i class="material-icons">swap_horiz</i><div class="component-name">ScrollView (H)</div></div>
            <div class="component-item" data-type="scrollview-v" draggable="true"><i class="material-icons">swap_vert</i><div class="component-name">ScrollView (V)</div></div>
            <div class="component-item" data-type="cardview" draggable="true"><i class="material-icons">crop_square</i><div class="component-name">CardView</div></div>
            
            <div class="sidebar-title" style="padding: 8px 12px; margin-top: 10px;">Widgets</div>
            <div class="component-item" data-type="textview" draggable="true"><i class="material-icons">text_fields</i><div class="component-name">TextView</div></div>
            <div class="component-item" data-type="button" draggable="true"><i class="material-icons">smart_button</i><div class="component-name">Button</div></div>
            <div class="component-item" data-type="edittext" draggable="true"><i class="material-icons">edit</i><div class="component-name">EditText</div></div>
            <div class="component-item" data-type="imageview" draggable="true"><i class="material-icons">image</i><div class="component-name">ImageView</div></div>
            <div class="component-item" data-type="checkbox" draggable="true"><i class="material-icons">check_box</i><div class="component-name">CheckBox</div></div>
            <div class="component-item" data-type="radiobutton" draggable="true"><i class="material-icons">radio_button_checked</i><div class="component-name">RadioButton</div></div>
            <div class="component-item" data-type="switch" draggable="true"><i class="material-icons">toggle_on</i><div class="component-name">Switch</div></div>
            <div class="component-item" data-type="progressbar" draggable="true"><i class="material-icons">linear_scale</i><div class="component-name">ProgressBar</div></div>
            <div class="component-item" data-type="seekbar" draggable="true"><i class="material-icons">tune</i><div class="component-name">SeekBar</div></div>
            <div class="component-item" data-type="spinner" draggable="true"><i class="material-icons">arrow_drop_down_circle</i><div class="component-name">Spinner</div></div>
            <div class="component-item" data-type="listview" draggable="true"><i class="material-icons">list</i><div class="component-name">ListView</div></div>
            <div class="component-item" data-type="webview" draggable="true"><i class="material-icons">web</i><div class="component-name">WebView</div></div>

            </div>
            </div>
        <div class="editor-workspace">
          <div class="editor-header">
            <div class="editor-title">
              <i class="material-icons">edit</i>
              ${this.currentScreen.name}
            </div>
            <div class="editor-actions">
              <select id="device-selector">${deviceOptionsHtml}</select>
              <button class="editor-action-btn"><i class="material-icons">undo</i></button>
              <button class="editor-action-btn"><i class="material-icons">redo</i></button>
              <button class="editor-action-btn primary"><i class="material-icons">save</i>Save</button>
              <button class="editor-action-btn"><i class="material-icons">play_arrow</i>Run</button>
            </div>
          </div>
          <div class="editor-content">
            <div class="editor-main">
              <div class="editor-tabs">
                <div class="editor-tab active" data-tab="design">Design</div>
                <div class="editor-tab" data-tab="blocks">Blocks</div>
                <div class="editor-tab" data-tab="code">Code</div>
              </div>
              <div class="editor-panel" id="editor-panel">
                ${this.renderTabPanel('design')}
                    </div>
                    </div>
                    </div>
                    </div>
        <div class="editor-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-title">PROJECT</div>
            <div class="sidebar-item active"><i class="material-icons">phone_android</i><span>${this.currentApp.name}</span></div>
            <div class="sidebar-item edit-app-details"><i class="material-icons">settings</i><span>App Details</span></div>
                    </div>
          <div class="sidebar-section">
            <div class="sidebar-title">SCREENS</div>
            <div class="screens-list">${this.renderScreensList()}</div>
            <div class="sidebar-item add-screen"><i class="material-icons">add</i><span>Add Screen</span></div>
                    </div>
                    </div>
        ${this.renderPropertyPanel()} 
                    </div>
    `;
    // Apply initial device size after rendering
    this.updateDevicePreviewSize();
  }

  renderTabPanel(tab) {
    if (tab === 'design') {
      return `
                <div class="canvas-container">
                  <div class="phone-preview">
                    <div class="phone-status-bar"></div>
                    <div class="phone-content" id="preview-container">
              <div id="alignment-guides"></div> 
              <div id="dimension-overlay"></div> 
                    </div>
                  </div>
                </div>
      `;
    } else if (tab === 'blocks') {
      return `<div class="blocks-placeholder" style="padding:32px;text-align:center;">Blocks editor coming soon.</div>`;
    } else if (tab === 'code') {
      return `<div class="code-placeholder" style="padding:32px;text-align:center;">Code view coming soon.</div>`;
    }
    return '';
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

  renderScreensList() {
    return this.currentApp.screens.map(screen => {
      const isActive = screen.id === this.currentScreen.id;
      return `<div class="sidebar-item ${isActive ? 'active' : ''}" data-screen-id="${screen.id}"><i class="material-icons">phone_android</i><span>${screen.name}</span></div>`;
    }).join('');
  }

  setupEventListeners() {
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        const panel = document.getElementById('editor-panel');
        if (panel) {
          panel.innerHTML = this.renderTabPanel(tabName);
          if (tabName === 'design') {
            this.renderComponentsPreview();
            this.setupDesignTabEvents();
          }
        }
      });
    });
    this.setupDesignTabEvents();
    document.querySelectorAll('.sidebar-item[data-screen-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        const screenId = item.dataset.screenId;
        this.setCurrentScreen(screenId);
      });
    });
    const addScreenBtn = document.querySelector('.add-screen');
    if (addScreenBtn) {
      addScreenBtn.addEventListener('click', () => {
        this.showAddScreenDialog();
      });
    }
    const editAppDetailsBtn = document.querySelector('.edit-app-details');
    if (editAppDetailsBtn) {
      editAppDetailsBtn.addEventListener('click', () => {
        this.showEditAppDetailsDialog();
      });
    }
    const saveBtn = document.querySelector('.editor-action-btn.primary');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveApp();
      });
    }
    const closePropBtn = document.getElementById('close-prop-panel');
    if (closePropBtn) {
      closePropBtn.addEventListener('click', () => {
        this.hidePropertyPanel();
      });
    }

    // Device Selector Listener
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
        deviceSelector.addEventListener('change', (e) => {
            this.changeDevicePreview(e.target.value);
        });
    }

    // Global keydown listener for arrows and delete
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    if (!this.selectedComponent) return; 
    
    const targetTagName = e.target.tagName.toUpperCase();
    const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'SELECT';

    let needsUpdate = false;
    const step = e.shiftKey ? 10 : 1; 

    switch (e.key) {
        case 'ArrowUp':
            if (isInputFocused) return; // Don't move component if editing input
            e.preventDefault();
            this.selectedComponent.properties.y -= step;
            needsUpdate = true;
            break;
        case 'ArrowDown':
            if (isInputFocused) return; // Don't move component if editing input
            e.preventDefault();
            this.selectedComponent.properties.y += step;
            needsUpdate = true;
            break;
        case 'ArrowLeft':
             // Allow default left arrow in inputs
            if (!isInputFocused) e.preventDefault(); 
            else return; 
            this.selectedComponent.properties.x -= step;
            needsUpdate = true;
            break;
        case 'ArrowRight':
            // Allow default right arrow in inputs
            if (!isInputFocused) e.preventDefault(); 
            else return;
            this.selectedComponent.properties.x += step;
            needsUpdate = true;
            break;
        case 'Delete':
        case 'Backspace': 
            // --- Check if focus is NOT on an input field --- 
            if (isInputFocused) {
                // Allow default backspace/delete behavior in input fields
                return; 
            }
            // --- End check --- 
            
            // If focus is not on input, proceed with component deletion
            e.preventDefault(); 
            this.appService.deleteComponent(this.currentApp.id, this.currentScreen.id, this.selectedComponent.id);
            this.hidePropertyPanel(); 
            this.renderComponentsPreview(); 
            break;
    }

    if (needsUpdate) {
        this.selectedComponent.properties.x = Math.max(0, this.selectedComponent.properties.x);
        this.selectedComponent.properties.y = Math.max(0, this.selectedComponent.properties.y);
        
        this.saveComponentUpdate(false, false); // Save without re-selecting or showing panel
        this.updatePropertyEditor(); 
    }
  }

  setupDesignTabEvents() {
    // Component Drag FROM sidebar
    document.querySelectorAll('.components-sidebar .component-item').forEach(item => {
      item.addEventListener('dragstart', this.handleDragStart.bind(this));
    });

    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        previewContainer.addEventListener('drop', this.handleDrop.bind(this));
    }

    this.renderComponentsPreview();
  }

  handleDragStart(e) {
      e.dataTransfer.setData('text/plain', e.target.closest('.component-item').dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
  }

  handleDragOver(e) {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'copy';
  }

  handleDrop(e) {
      e.preventDefault();
      const componentType = e.dataTransfer.getData('text/plain');
      const previewContainer = e.target.closest('.phone-content'); // #preview-container
      if (!componentType || !previewContainer) return;

      const rect = previewContainer.getBoundingClientRect();
      // Calculate drop position relative to the container, accounting for scroll
      const x = e.clientX - rect.left + previewContainer.scrollLeft;
      const y = e.clientY - rect.top + previewContainer.scrollTop;

      // Adjust slightly so the component top-left is near the cursor, not centered on it
      const adjustedX = Math.max(0, x - 10); 
      const adjustedY = Math.max(0, y - 10);

      this.addComponentToScreen(componentType, adjustedX, adjustedY);
  }

  renderComponentsPreview() {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    if (this.currentScreen.components.length === 0) {
      previewContainer.innerHTML = `<div class="empty-preview"><p>Drag and drop components here</p></div>`;
      return;
    }
    this.currentScreen.components.forEach(component => {
      const element = this.createComponentElement(component);
      previewContainer.appendChild(element);
    });
  }

  createComponentElement(component) {
    const element = document.createElement('div');
    element.className = `preview-component preview-${component.type}`;
    element.dataset.componentId = component.id;
    const props = component.properties;

    // Apply common styles first
    if (props.width === 'match_parent') element.style.width = '100%';
    else if (props.width === 'wrap_content') element.style.width = 'auto';
    else if (props.width !== undefined) element.style.width = `${props.width}px`;
    
    if (props.height === 'match_parent') element.style.height = '100%';
    else if (props.height === 'wrap_content') element.style.height = 'auto';
    else if (props.height !== undefined) element.style.height = `${props.height}px`;

    element.style.position = 'absolute'; 
    element.style.left = `${props.x || 0}px`; 
    element.style.top = `${props.y || 0}px`;
    if (props.margin) element.style.margin = props.margin;
    if (props.padding) element.style.padding = props.padding;
    element.style.backgroundColor = props.bgColor || 'transparent';
    if (props.font) element.style.fontFamily = props.font;
    element.style.fontSize = `${props.textSize || 14}px`;
    element.style.color = props.textColor || '#000000';
    element.style.borderColor = props.borderColor || 'transparent';
    element.style.borderWidth = props.borderColor && props.borderColor !== 'transparent' ? '1px' : '0'; 
    element.style.borderStyle = props.borderColor && props.borderColor !== 'transparent' ? 'solid' : 'none';
    element.style.borderRadius = props.borderRadius || '0px';
    element.style.boxShadow = props.boxShadow || 'none';
    
    // Component-specific rendering
    element.innerHTML = ''; // Clear default
    element.style.display = 'flex'; // Use flex for internal alignment often
    element.style.alignItems = 'center'; // Default alignment
    element.style.justifyContent = 'flex-start'; // Default alignment

    switch (component.type) {
      // Layouts
      case 'linearlayout-h':
      case 'scrollview-h':
        element.style.flexDirection = 'row';
        element.style.justifyContent = 'flex-start';
        element.style.alignItems = 'flex-start'; // Align children top
        element.innerHTML = `<!-- H Layout -->`; // Placeholder
        break;
      case 'linearlayout-v':
      case 'scrollview-v':
        element.style.flexDirection = 'column';
        element.style.justifyContent = 'flex-start';
        element.style.alignItems = 'flex-start'; // Align children left
        element.innerHTML = `<!-- V Layout -->`; // Placeholder
        break;
      case 'cardview':
         element.style.justifyContent = 'center'; // Center placeholder
         element.innerHTML = `<!-- Card -->`; // Placeholder
        break;

      // Widgets
      case 'button':
        element.textContent = props.text || 'Button';
        element.style.textAlign = 'center';
        element.style.cursor = 'pointer';
        element.style.justifyContent = 'center'; // Center text
        break;
      case 'textview':
        element.textContent = props.text || 'TextView';
        break;
      case 'edittext':
        if (props.text) {
            element.textContent = props.text;
            element.style.color = props.textColor || '#000000';
        } else {
            element.textContent = props.hint || 'Enter text';
            element.style.color = props.hintColor || '#A0A0A0';
        }
        // Keep border style from common styles
        break;
      case 'imageview':
        element.style.justifyContent = 'center'; // Center placeholder
        if (props.src) {
            const img = document.createElement('img');
            img.src = props.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = props.scaleType || 'contain'; // Use scaleType
            element.appendChild(img);
        } else {
             element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">image</i>'; // Placeholder icon
        }
        break;
      case 'checkbox':
      case 'radiobutton':
        const checkInput = document.createElement('input');
        checkInput.type = component.type === 'checkbox' ? 'checkbox' : 'radio';
        checkInput.checked = props.checked || false;
        checkInput.disabled = true; // Preview only
        checkInput.style.marginRight = '5px';
        element.appendChild(checkInput);
        element.appendChild(document.createTextNode(props.text || component.type));
        break;
      case 'switch':
        element.innerHTML = `<span style="margin-right: 5px;">${props.text || 'Switch'}</span>`;
        const switchToggle = document.createElement('div');
        switchToggle.style.width = '34px';
        switchToggle.style.height = '14px';
        switchToggle.style.borderRadius = '7px';
        switchToggle.style.backgroundColor = props.checked ? '#a5d6a7' : '#ccc'; // Greenish if checked
        switchToggle.style.position = 'relative';
        switchToggle.style.transition = 'background-color 0.2s';
        const switchThumb = document.createElement('div');
        switchThumb.style.width = '20px';
        switchThumb.style.height = '20px';
        switchThumb.style.borderRadius = '50%';
        switchThumb.style.backgroundColor = props.checked ? '#4caf50' : '#f1f1f1';
        switchThumb.style.position = 'absolute';
        switchThumb.style.top = '-3px';
        switchThumb.style.left = props.checked ? '17px' : '-3px';
        switchThumb.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        switchThumb.style.transition = 'left 0.2s, background-color 0.2s';
        switchToggle.appendChild(switchThumb);
        element.appendChild(switchToggle);
        break;
      case 'progressbar':
        element.style.padding = '0'; // No padding for progressbar itself
        const progressBg = document.createElement('div');
        progressBg.style.width = '100%';
        progressBg.style.height = '100%';
        progressBg.style.backgroundColor = '#e0e0e0';
        progressBg.style.borderRadius = 'inherit'; // Inherit from parent
        progressBg.style.overflow = 'hidden';
        const progressBar = document.createElement('div');
        progressBar.style.width = `${Math.min(100, Math.max(0, props.progress || 0))}%`;
        progressBar.style.height = '100%';
        progressBar.style.backgroundColor = props.progressColor || '#2196F3'; // Use a progress color property later if needed
        progressBg.appendChild(progressBar);
        element.appendChild(progressBg);
        break;
      case 'seekbar':
        element.style.padding = '0'; // No padding
        const track = document.createElement('div');
        track.style.width = '100%';
        track.style.height = '4px';
        track.style.backgroundColor = '#ccc';
        track.style.position = 'relative';
        track.style.borderRadius = '2px';
        const thumb = document.createElement('div');
        thumb.style.width = '14px';
        thumb.style.height = '14px';
        thumb.style.borderRadius = '50%';
        thumb.style.backgroundColor = '#2196F3';
        thumb.style.position = 'absolute';
        thumb.style.top = '50%';
        const progressPercent = Math.min(100, Math.max(0, props.progress || 0));
        thumb.style.left = `calc(${progressPercent}% - 7px)`; // Center thumb
        thumb.style.transform = 'translateY(-50%)';
        track.appendChild(thumb);
        element.appendChild(track);
        break;
      case 'spinner':
        element.innerHTML = `<span>${(props.items || '').split(',')[0] || 'Select'}</span><i class="material-icons" style="margin-left: auto;">arrow_drop_down</i>`;
        element.style.justifyContent = 'space-between';
        element.style.border = '1px solid #ccc'; // Mimic spinner border
        element.style.padding = props.padding || '4px 8px'; // Add default padding
        break;
      case 'listview':
        element.innerHTML = '<!-- ListView -->'; // Placeholder
        // Keep border from common styles
        break;
       case 'webview':
        element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">web</i>'; // Placeholder icon
        element.style.justifyContent = 'center';
        // Keep border from common styles
        break;
      default:
        element.textContent = component.type; // Fallback
    }
    
    // Mouse/Touch Events
    element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; 
        e.preventDefault();
        this.handleComponentMouseDown(e, component);
    });
    element.addEventListener('click', (e) => {
      if (!this.isDraggingComponent) {
        e.stopPropagation();
        this.selectComponent(component.id, false);
      }
    });
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        this.selectComponent(component.id, true);
    });
    
    return element;
  }

  handleComponentMouseDown(e, component) {
    if (e.button !== 0) return; 
    this.selectComponent(component.id, false);
    this.isDraggingComponent = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.draggedComponentStartX = component.properties.x || 0;
    this.draggedComponentStartY = component.properties.y || 0;

    // Show dimensions overlay on drag start
    this.updateDimensionOverlay(this.selectedComponent); 

    this.boundHandleMouseMove = this.handleComponentMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleComponentMouseUp.bind(this);
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  }

  handleComponentMouseMove(e) {
    if (!this.isDraggingComponent || !this.selectedComponent) return;

    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    const containerRect = previewContainer.getBoundingClientRect();

    // Calculate potential new raw position based on mouse delta
    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;
    let newX = this.draggedComponentStartX + deltaX;
    let newY = this.draggedComponentStartY + deltaY;

    // Get the dragged element and its dimensions
    const draggedElement = document.querySelector(`.preview-component[data-component-id="${this.selectedComponent.id}"]`);
    if (!draggedElement) return;
    const draggedRect = draggedElement.getBoundingClientRect(); // Use client rect for dimensions
    const draggedWidth = draggedRect.width;
    const draggedHeight = draggedRect.height;

    // --- Alignment Logic --- 
    const snapThreshold = 5;
    let activeSnapLines = [];
    let snapOffsetX = 0;
    let snapOffsetY = 0;

    // Targets: Container edges and center
    const containerCenterX = previewContainer.clientWidth / 2;
    const containerCenterY = previewContainer.clientHeight / 2;
    const targets = [
        // Container vertical
        { type: 'v', edge: 'left', pos: 0 },
        { type: 'v', edge: 'center', pos: containerCenterX },
        { type: 'v', edge: 'right', pos: previewContainer.clientWidth },
        // Container horizontal
        { type: 'h', edge: 'top', pos: 0 },
        { type: 'h', edge: 'center', pos: containerCenterY },
        { type: 'h', edge: 'bottom', pos: previewContainer.clientHeight }
    ];

    // Targets: Other components
    const otherComponents = this.currentScreen.components.filter(c => c.id !== this.selectedComponent.id);
    otherComponents.forEach(comp => {
        const compElement = document.querySelector(`.preview-component[data-component-id="${comp.id}"]`);
        if (!compElement) return;
        const compProps = comp.properties;
        const compX = compProps.x || 0;
        const compY = compProps.y || 0;
        // Use offsetWidth/Height as getBoundingClientRect might include transforms/margins inappropriately here
        const compWidth = compElement.offsetWidth; 
        const compHeight = compElement.offsetHeight;
        
        // Vertical edges + center
        targets.push({ type: 'v', edge: 'left', pos: compX });
        targets.push({ type: 'v', edge: 'center', pos: compX + compWidth / 2 });
        targets.push({ type: 'v', edge: 'right', pos: compX + compWidth });
        // Horizontal edges + center
        targets.push({ type: 'h', edge: 'top', pos: compY });
        targets.push({ type: 'h', edge: 'center', pos: compY + compHeight / 2 });
        targets.push({ type: 'h', edge: 'bottom', pos: compY + compHeight });
    });

    // Check snapping for vertical lines
    let snappedX = false;
    [newX, newX + draggedWidth / 2, newX + draggedWidth].forEach((draggedPos, i) => {
        if (snappedX) return; // Only snap once horizontally
        targets.forEach(target => {
            if (target.type === 'v') {
                const dist = Math.abs(draggedPos - target.pos);
                if (dist < snapThreshold) {
                    snapOffsetX = target.pos - draggedPos; 
                    activeSnapLines.push({ type: 'vertical', pos: target.pos });
                    snappedX = true;
                }
            }
        });
    });

    // Check snapping for horizontal lines
    let snappedY = false;
    [newY, newY + draggedHeight / 2, newY + draggedHeight].forEach((draggedPos, i) => {
        if (snappedY) return; // Only snap once vertically
        targets.forEach(target => {
            if (target.type === 'h') {
                const dist = Math.abs(draggedPos - target.pos);
                if (dist < snapThreshold) {
                    snapOffsetY = target.pos - draggedPos;
                    activeSnapLines.push({ type: 'horizontal', pos: target.pos });
                    snappedY = true;
                }
            }
        });
    });

    // Apply snapping offsets
    newX += snapOffsetX;
    newY += snapOffsetY;
    
    // Boundary check
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    if (newX + draggedWidth > previewContainer.clientWidth) {
      newX = previewContainer.clientWidth - draggedWidth;
    }
     if (newY + draggedHeight > previewContainer.clientHeight) {
      newY = previewContainer.clientHeight - draggedHeight;
    }

    // Update style directly for smooth feedback
    draggedElement.style.left = `${newX}px`;
    draggedElement.style.top = `${newY}px`;
    
    // Update properties (will be saved on mouseup)
    this.selectedComponent.properties.x = Math.round(newX);
    this.selectedComponent.properties.y = Math.round(newY);

    // Update property editor inputs in real-time
    this.updatePropertyEditor();

    // Draw alignment guides
    this.drawAlignmentGuides(activeSnapLines);

    // Update dimension overlay
    this.updateDimensionOverlay(this.selectedComponent, draggedElement); 
  }

  drawAlignmentGuides(lines) {
    const guidesContainer = document.getElementById('alignment-guides');
    if (!guidesContainer) return;
    guidesContainer.innerHTML = ''; // Clear previous guides

    lines.forEach(line => {
      const guide = document.createElement('div');
      guide.className = `alignment-guide ${line.type}`;
      if (line.type === 'horizontal') {
        guide.style.top = `${line.pos}px`;
      } else { // vertical
        guide.style.left = `${line.pos}px`;
      }
      guidesContainer.appendChild(guide);
    });
  }

  handleComponentMouseUp(e) {
    if (!this.isDraggingComponent) return;
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    
    // Clear guides & dimensions
    this.drawAlignmentGuides([]);
    this.clearDimensionOverlay(); 

    if (this.selectedComponent) {
      // Get the element within this function scope
      const draggedElement = document.querySelector(`.preview-component[data-component-id="${this.selectedComponent.id}"]`);
      if (draggedElement) { // Check if element exists before using it
          this.selectedComponent.properties.x = parseInt(draggedElement.style.left) || 0;
          this.selectedComponent.properties.y = parseInt(draggedElement.style.top) || 0;
          this.saveComponentUpdate(false, false); 
      }
    }
    setTimeout(() => { this.isDraggingComponent = false; }, 50);
  }

  saveComponentUpdate(reselect = true, showPanel = true) { 
    if (!this.selectedComponent) return;
    const componentIdToSelect = this.selectedComponent.id; 
    this.appService.updateComponent(this.currentApp.id, this.currentScreen.id, this.selectedComponent);
    this.renderComponentsPreview(); 
    if (reselect) {
        this.selectComponent(componentIdToSelect, showPanel); 
    }
  }

  selectComponent(componentId, showPanel = true) { // Added showPanel flag
    const prevSelected = document.querySelector('.preview-component.selected');
    if (prevSelected && prevSelected.dataset.componentId !== componentId) {
      prevSelected.classList.remove('selected');
    }
    
    // Find the newly selected component data
    const newSelectedComponent = this.currentScreen.components.find(c => c.id === componentId);
    if (!newSelectedComponent) {
        this.hidePropertyPanel(); // Hide if no component found
        this.selectedComponent = null;
        return;
    }
    this.selectedComponent = newSelectedComponent;
    
    // Highlight the element visually
    const element = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
    if (element && !element.classList.contains('selected')) {
      element.classList.add('selected');
    }
    
    // Show or hide panel based on flag
    if (showPanel) {
        this.showPropertyPanel();
    } else {
        // Ensure panel is hidden if left-clicking or starting drag
        if (this.propertyPanelVisible) {
            this.hidePropertyPanel();
        }
    }
  }

  showPropertyPanel() {
    const propPanel = document.getElementById('property-editor');
    if (!propPanel) return; // Should exist, but check anyway

    this.propertyPanelVisible = true;
    propPanel.classList.add('visible');

    // Populate values
    this.updatePropertyEditor(); 

    // Setup events now that the panel is visible and populated
    this.setupPropertyEditorEvents();

    // Setup close button event listener
    const closePropBtn = propPanel.querySelector('#close-prop-panel'); // Query within the panel
    if (closePropBtn) {
        // Remove previous listener if any to avoid duplicates
        closePropBtn.onclick = null;
        closePropBtn.onclick = () => {
            this.hidePropertyPanel();
        };
    }
  }

  hidePropertyPanel() {
    this.propertyPanelVisible = false;
    const propPanel = document.getElementById('property-editor');
    if (propPanel) propPanel.classList.remove('visible');
    
    if (this.selectedComponent) { // Only deselect if something was selected
        const prevSelected = document.querySelector(`.preview-component[data-component-id="${this.selectedComponent.id}"]`);
        if (prevSelected) prevSelected.classList.remove('selected');
        this.selectedComponent = null;
    }
  }

  updatePropertyEditor() {
    if (!this.selectedComponent) return;
    const props = this.selectedComponent.properties;
    const type = this.selectedComponent.type;
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
    setValue('prop-id', this.selectedComponent.id);
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
    const c = this.selectedComponent;
    if (!c) return;
    const panel = document.getElementById('property-editor');
    if (!panel) return;

    // Helper to add listener if element exists
    const addListener = (id, eventType, handler) => {
        const el = panel.querySelector(`#${id}`);
        if (el) {
            // Remove previous listener first if needed (simple overwrite works for onX)
            el[eventType] = (e) => { 
                if (!this.selectedComponent) return; // Re-check component exists
                handler(e);
                this.saveComponentUpdate(false, true); // Reselect, keep panel open
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

  setCurrentScreen(screenId) {
    const screen = this.currentApp.screens.find(s => s.id === screenId);
    if (screen) {
      this.currentScreen = screen;
      
      // Update active state in sidebar
      document.querySelectorAll('.sidebar-item[data-screen-id]').forEach(item => {
        if (item.dataset.screenId === screenId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Update screen title
      const screenTitle = document.querySelector('.editor-title');
      if (screenTitle) {
        screenTitle.innerHTML = `<i class="material-icons">edit</i> ${screen.name}`;
      }
      
      // Update preview area
      this.renderComponentsPreview();
    }
  }

  showAddScreenDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Add New Screen</h2>
        <div class="dialog-content">
          <div class="form-group">
            <label for="screen-name">Screen Name</label>
            <input type="text" id="screen-name" placeholder="Screen Name">
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn create-btn primary">Create</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Handle dialog actions
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const createBtn = dialog.querySelector('.create-btn');
    const nameInput = dialog.querySelector('#screen-name');

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    createBtn.addEventListener('click', () => {
      const screenName = nameInput.value.trim();
      if (screenName) {
        const newScreen = this.appService.addScreen(this.currentApp.id, screenName);
        if (newScreen) {
          // Update UI
          const screensList = document.querySelector('.screens-list');
          if (screensList) {
            screensList.innerHTML = this.renderScreensList();
            this.setCurrentScreen(newScreen.id);
            this.setupEventListeners();
          }
        }
        dialog.remove();
      } else {
        nameInput.classList.add('error');
        nameInput.placeholder = 'Please enter a name';
      }
    });

    // Focus input
    nameInput.focus();

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  showEditAppDetailsDialog() {
    const app = this.currentApp;
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Edit App Details</h2>
        <div class="dialog-content">
          <div class="form-group">
            <label for="app-name">App Name</label>
            <input type="text" id="app-name" value="${app.name}" placeholder="App Name">
          </div>
          <div class="form-group">
            <label for="package-name">Package Name</label>
            <input type="text" id="package-name" value="${app.packageName}" placeholder="com.example.app">
          </div>
          <div class="form-group">
            <label for="project-name">Project Name</label>
            <input type="text" id="project-name" value="${app.projectName}" placeholder="Project Name">
          </div>
          
          <div class="version-fields">
            <div class="form-group">
              <label for="version-code">Version Code</label>
              <input type="number" id="version-code" value="${app.versionCode}" min="1">
            </div>
            <div class="form-group">
              <label for="version-name">Version Name</label>
              <input type="text" id="version-name" value="${app.versionName}" placeholder="1.0.0">
            </div>
          </div>
          
          <div class="form-group">
            <label for="min-sdk">Minimum SDK</label>
            <select id="min-sdk">
              <option value="21" ${app.minSdk === "21" ? 'selected' : ''}>Android 5.0 (API 21)</option>
              <option value="23" ${app.minSdk === "23" ? 'selected' : ''}>Android 6.0 (API 23)</option>
              <option value="26" ${app.minSdk === "26" ? 'selected' : ''}>Android 8.0 (API 26)</option>
              <option value="29" ${app.minSdk === "29" ? 'selected' : ''}>Android 10.0 (API 29)</option>
              <option value="31" ${app.minSdk === "31" ? 'selected' : ''}>Android 12.0 (API 31)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Theme Color</label>
            <div class="color-selector">
              <div class="color-option colorAccent ${app.themeColor === 'colorAccent' ? 'selected' : ''}" data-color="colorAccent">
                <div class="color-tooltip">Accent Color</div>
              </div>
              <div class="color-option colorPrimary ${app.themeColor === 'colorPrimary' ? 'selected' : ''}" data-color="colorPrimary">
                <div class="color-tooltip">Primary Color</div>
              </div>
              <div class="color-option colorPrimaryDark ${app.themeColor === 'colorPrimaryDark' ? 'selected' : ''}" data-color="colorPrimaryDark">
                <div class="color-tooltip">Primary Dark</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn save-btn primary">Save Changes</button>
        </div>
        </div>
      `;

    document.body.appendChild(dialog);

    // Handle dialog actions
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const saveBtn = dialog.querySelector('.save-btn');
    
    // Color selection
    const colorOptions = dialog.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
      });
    });

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    saveBtn.addEventListener('click', () => {
      // Get values from form
      const appName = dialog.querySelector('#app-name').value.trim();
      const packageName = dialog.querySelector('#package-name').value.trim();
      const projectName = dialog.querySelector('#project-name').value.trim();
      const versionCode = dialog.querySelector('#version-code').value;
      const versionName = dialog.querySelector('#version-name').value.trim();
      const minSdk = dialog.querySelector('#min-sdk').value;
      const selectedColor = dialog.querySelector('.color-option.selected');
      const themeColor = selectedColor ? selectedColor.dataset.color : 'colorAccent';
      
      if (!appName || !packageName || !projectName || !versionName) {
        // Simple validation
        if (!appName) dialog.querySelector('#app-name').classList.add('error');
        if (!packageName) dialog.querySelector('#package-name').classList.add('error');
        if (!projectName) dialog.querySelector('#project-name').classList.add('error');
        if (!versionName) dialog.querySelector('#version-name').classList.add('error');
        return;
      }
      
      // Update app properties
      this.currentApp.name = appName;
      this.currentApp.packageName = packageName;
      this.currentApp.projectName = projectName;
      this.currentApp.versionCode = versionCode;
      this.currentApp.versionName = versionName;
      this.currentApp.minSdk = minSdk;
      this.currentApp.themeColor = themeColor;
      
      // Save changes
      if (this.appService.updateApp(this.currentApp)) {
        // Update UI
        const projectTitle = document.querySelector('.sidebar-section .sidebar-item.active span');
        if (projectTitle) {
          projectTitle.textContent = appName;
        }
        
        // Show success notification
        this.showNotification('App details updated successfully', 'success');
      } else {
        // Show error notification
        this.showNotification('Failed to update app details', 'error');
      }
      
      dialog.remove();
    });

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  addComponentToScreen(componentType, initialX = 0, initialY = 0) {
    let componentProps = {
      type: componentType,
      properties: {}
    };
    
    const defaultProps = {
        width: 'wrap_content',
        height: 'wrap_content',
        x: initialX,
        y: initialY,
        margin: '',
        padding: '',
        bgColor: 'transparent',
        font: '',
        borderColor: 'transparent', // Default border transparent
        borderRadius: '0px',
        boxShadow: 'none' 
    };

    switch (componentType) {
      // Layouts
      case 'linearlayout-h':
      case 'linearlayout-v':
        componentProps.properties = { ...defaultProps, width: 'match_parent', height: 100, bgColor: '#f0f0f0', padding: '4px', orientation: componentType.endsWith('-h') ? 'horizontal' : 'vertical', children: [] }; 
        break;
      case 'scrollview-h':
      case 'scrollview-v':
        componentProps.properties = { ...defaultProps, width: 'match_parent', height: 150, bgColor: '#e8e8e8', padding: '4px', orientation: componentType.endsWith('-h') ? 'horizontal' : 'vertical', children: [] };
        break;
      case 'cardview':
        componentProps.properties = { ...defaultProps, width: 150, height: 100, bgColor: '#ffffff', padding: '8px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)', children: [] };
        break;

      // Widgets
      case 'button':
        componentProps.properties = { ...defaultProps, text: 'Button', textSize: 14, textColor: '#000000', bgColor: '#E0E0E0', padding: '8px 16px', borderRadius: '4px' };
        break;
      case 'textview':
        componentProps.properties = { ...defaultProps, text: 'TextView', textSize: 14, textColor: '#000000' };
        break;
      case 'edittext':
        componentProps.properties = { ...defaultProps, text: '', hint: 'Enter text here', hintColor: '#A0A0A0', textSize: 14, textColor: '#000000', width: 'match_parent', bgColor: '#FFFFFF', padding: '8px', borderColor: '#CCCCCC', borderRadius: '4px' };
        break;
      case 'imageview':
        componentProps.properties = { ...defaultProps, src: '', scaleType: 'fitCenter', width: 100, height: 100, bgColor: '#cccccc' };
        break;
      case 'checkbox':
        componentProps.properties = { ...defaultProps, text: 'CheckBox', checked: false, textColor: '#000000' };
        break;
      case 'radiobutton':
        componentProps.properties = { ...defaultProps, text: 'RadioButton', checked: false, radioGroup: '', textColor: '#000000' };
        break;
      case 'switch':
        componentProps.properties = { ...defaultProps, text: 'Switch', checked: false, textColor: '#000000' };
        break;
      case 'progressbar':
        componentProps.properties = { ...defaultProps, progress: 50, max: 100, style: 'horizontal', width: 'match_parent', height: 4, indeterminate: false };
        break;
      case 'seekbar':
        componentProps.properties = { ...defaultProps, progress: 50, max: 100, width: 'match_parent', height: 'wrap_content' };
        break;
      case 'spinner':
        componentProps.properties = { ...defaultProps, items: 'Item 1, Item 2, Item 3', selectedIndex: 0, width: 'match_parent' };
        break;
      case 'listview':
        componentProps.properties = { ...defaultProps, items: '[]', layout: 'simple_list_item_1', width: 'match_parent', height: 200, bgColor: '#ffffff', borderColor: '#cccccc' };
        break;
      case 'webview':
        componentProps.properties = { ...defaultProps, url: 'https://example.com', width: 'match_parent', height: 300, bgColor: '#ffffff', borderColor: '#cccccc' };
        break;

      default:
         componentProps.properties = defaultProps;
         break;
    }

    // Ensure ID is unique (might need better generation later)
    componentProps.id = `${componentType}_${Date.now()}`;

    const newComponent = this.appService.addComponent(
      this.currentApp.id, 
      this.currentScreen.id, 
      componentProps
    );
    
    if (newComponent) {
      this.renderComponentsPreview();
      this.selectComponent(newComponent.id); // Select the newly added component
    }
  }

  saveApp() {
    if (this.appService.updateApp(this.currentApp)) {
      // Show success notification
      this.showNotification('App saved successfully', 'success');
    }
  }

  showNotification(message, type = 'info') {
      const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check_circle' : 
                 type === 'error' ? 'error' : 'info';
    
      notification.innerHTML = `
      <i class="material-icons">${icon}</i>
      <span>${message}</span>
      `;
    
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }

  changeDevicePreview(deviceName) {
    const newDevice = this.devices.find(d => d.name === deviceName);
    if (newDevice) {
        this.selectedDevice = newDevice;
        this.updateDevicePreviewSize();
    }
  }

  updateDevicePreviewSize() {
    const previewElement = document.querySelector('.phone-preview');
    if (previewElement) {
        previewElement.style.width = `${this.selectedDevice.width}px`;
        previewElement.style.height = `${this.selectedDevice.height}px`;
    }
  }

  updateDimensionOverlay(component, element) {
      const overlay = document.getElementById('dimension-overlay');
      if (!overlay || !component || !element) {
          this.clearDimensionOverlay();
          return;
      }

      overlay.innerHTML = ''; // Clear previous

      const x = component.properties.x || 0;
      const y = component.properties.y || 0;
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      const offset = 5; // How far outside the element to show labels

      // Top Label (Y)
      const topLabel = document.createElement('div');
      topLabel.className = 'dimension-indicator';
      topLabel.textContent = `Y: ${y}`;
      topLabel.style.left = `${x + w / 2}px`;
      topLabel.style.top = `${y - offset - 12}px`; // 12 is approx label height
      topLabel.style.transform = 'translateX(-50%)';
      overlay.appendChild(topLabel);

      // Left Label (X)
      const leftLabel = document.createElement('div');
      leftLabel.className = 'dimension-indicator';
      leftLabel.textContent = `X: ${x}`;
      leftLabel.style.left = `${x - offset}px`;
      leftLabel.style.top = `${y + h / 2}px`;
      leftLabel.style.transform = 'translate(-100%, -50%)';
      overlay.appendChild(leftLabel);

      // Bottom Label (H)
      const bottomLabel = document.createElement('div');
      bottomLabel.className = 'dimension-indicator';
      bottomLabel.textContent = `H: ${h}`;
      bottomLabel.style.left = `${x + w / 2}px`;
      bottomLabel.style.top = `${y + h + offset}px`;
      bottomLabel.style.transform = 'translateX(-50%)';
      overlay.appendChild(bottomLabel);

      // Right Label (W)
      const rightLabel = document.createElement('div');
      rightLabel.className = 'dimension-indicator';
      rightLabel.textContent = `W: ${w}`;
      rightLabel.style.left = `${x + w + offset}px`;
      rightLabel.style.top = `${y + h / 2}px`;
      rightLabel.style.transform = 'translateY(-50%)';
      overlay.appendChild(rightLabel);
  }

  clearDimensionOverlay() {
      const overlay = document.getElementById('dimension-overlay');
      if (overlay) overlay.innerHTML = '';
  }
}

export default EditorView; 