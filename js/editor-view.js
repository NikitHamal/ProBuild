import AppService from './app-service.js';

class EditorView {
  constructor() {
    this.appService = AppService;
    this.currentApp = null;
    this.currentScreen = null;
    this.selectedComponent = null;
    
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
    document.body.innerHTML = `
      <div class="editor-container">
        <div class="editor-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-title">PROJECT</div>
            <div class="sidebar-item active">
              <i class="material-icons">phone_android</i>
              <span>${this.currentApp.name}</span>
            </div>
            <div class="sidebar-item edit-app-details">
              <i class="material-icons">settings</i>
              <span>App Details</span>
            </div>
          </div>
          
          <div class="sidebar-section">
            <div class="sidebar-title">SCREENS</div>
            <div class="screens-list">
              ${this.renderScreensList()}
            </div>
            <div class="sidebar-item add-screen">
              <i class="material-icons">add</i>
              <span>Add Screen</span>
            </div>
          </div>
        </div>
        
        <div class="editor-workspace">
          <div class="editor-header">
            <div class="editor-title">
              <i class="material-icons">edit</i>
              ${this.currentScreen.name}
            </div>
            <div class="editor-actions">
              <button class="editor-action-btn">
                <i class="material-icons">undo</i>
              </button>
              <button class="editor-action-btn">
                <i class="material-icons">redo</i>
              </button>
              <button class="editor-action-btn primary">
                <i class="material-icons">save</i>
                Save
              </button>
              <button class="editor-action-btn">
                <i class="material-icons">play_arrow</i>
                Run
              </button>
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
            
            <div class="property-editor">
              <h3 class="panel-title">Properties</h3>
              <div class="property-group">
                <div class="property-group-title">Layout</div>
                <div class="property-row">
                  <div class="property-label">Width</div>
                  <div class="property-input">
                    <select id="prop-width">
                      <option value="wrap_content">Wrap Content</option>
                      <option value="match_parent">Match Parent</option>
                      <option value="fixed">Fixed Size</option>
                    </select>
                  </div>
                </div>
                <div class="property-row">
                  <div class="property-label">Height</div>
                  <div class="property-input">
                    <select id="prop-height">
                      <option value="wrap_content">Wrap Content</option>
                      <option value="match_parent">Match Parent</option>
                      <option value="fixed">Fixed Size</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="property-group">
                <div class="property-group-title">Appearance</div>
                <div class="property-row">
                  <div class="property-label">Text</div>
                  <div class="property-input">
                    <input type="text" id="prop-text" placeholder="Text">
                  </div>
                </div>
                <div class="property-row">
                  <div class="property-label">Text Size</div>
                  <div class="property-input">
                    <input type="number" id="prop-textsize" value="14">
                  </div>
                </div>
                <div class="property-row">
                  <div class="property-label">Text Color</div>
                  <div class="property-input">
                    <input type="color" id="prop-textcolor" value="#000000">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTabPanel(tab) {
    if (tab === 'design') {
      return `
        <div class="components-panel">
          <h3 class="panel-title">Components</h3>
          <div class="components-list">
            <div class="component-item" data-type="button">
              <i class="material-icons">smart_button</i>
              <div class="component-name">Button</div>
            </div>
            <div class="component-item" data-type="textview">
              <i class="material-icons">text_fields</i>
              <div class="component-name">TextView</div>
            </div>
            <div class="component-item" data-type="edittext">
              <i class="material-icons">edit</i>
              <div class="component-name">EditText</div>
            </div>
            <div class="component-item" data-type="imageview">
              <i class="material-icons">image</i>
              <div class="component-name">ImageView</div>
            </div>
            <div class="component-item" data-type="listview">
              <i class="material-icons">list</i>
              <div class="component-name">ListView</div>
            </div>
            <div class="component-item" data-type="checkbox">
              <i class="material-icons">check_box</i>
              <div class="component-name">CheckBox</div>
            </div>
            <div class="component-item" data-type="radiobutton">
              <i class="material-icons">radio_button_checked</i>
              <div class="component-name">RadioButton</div>
            </div>
            <div class="component-item" data-type="switch">
              <i class="material-icons">toggle_on</i>
              <div class="component-name">Switch</div>
            </div>
            <div class="component-item" data-type="progressbar">
              <i class="material-icons">linear_scale</i>
              <div class="component-name">ProgressBar</div>
            </div>
          </div>
        </div>
        <div class="canvas-container">
          <div class="phone-preview">
            <div class="phone-status-bar"></div>
            <div class="phone-content" id="preview-container"></div>
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

  renderScreensList() {
    return this.currentApp.screens.map(screen => {
      const isActive = screen.id === this.currentScreen.id;
      return `
        <div class="sidebar-item ${isActive ? 'active' : ''}" data-screen-id="${screen.id}">
          <i class="material-icons">phone_android</i>
          <span>${screen.name}</span>
        </div>
      `;
    }).join('');
  }

  setupEventListeners() {
    // Tab switching
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

    // Design tab events
    this.setupDesignTabEvents();

    // Screen selection
    document.querySelectorAll('.sidebar-item[data-screen-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        const screenId = item.dataset.screenId;
        this.setCurrentScreen(screenId);
      });
    });

    // Add screen button
    const addScreenBtn = document.querySelector('.add-screen');
    if (addScreenBtn) {
      addScreenBtn.addEventListener('click', () => {
        this.showAddScreenDialog();
      });
    }

    // Edit app details button
    const editAppDetailsBtn = document.querySelector('.edit-app-details');
    if (editAppDetailsBtn) {
      editAppDetailsBtn.addEventListener('click', () => {
        this.showEditAppDetailsDialog();
      });
    }

    // Save button
    const saveBtn = document.querySelector('.editor-action-btn.primary');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveApp();
      });
    }
  }

  setupDesignTabEvents() {
    // Component dragging
    document.querySelectorAll('.component-item').forEach(item => {
      item.addEventListener('click', () => {
        const componentType = item.dataset.type;
        this.addComponentToScreen(componentType);
      });
    });
    // Render preview
    this.renderComponentsPreview();
  }

  renderComponentsPreview() {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    if (this.currentScreen.components.length === 0) {
      previewContainer.innerHTML = `
        <div class="empty-preview">
          <p>Drag and drop components here</p>
        </div>
      `;
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
    if (props.width === 'match_parent') {
      element.style.width = '100%';
    } else if (props.width === 'wrap_content') {
      element.style.width = 'auto';
    } else if (props.width) {
      element.style.width = `${props.width}px`;
    }
    if (props.height === 'match_parent') {
      element.style.height = '100%';
    } else if (props.height === 'wrap_content') {
      element.style.height = 'auto';
    } else if (props.height) {
      element.style.height = `${props.height}px`;
    }
    switch (component.type) {
      case 'button':
        element.innerHTML = props.text || 'Button';
        element.style.background = '#E0E0E0';
        element.style.color = props.textColor || '#000000';
        element.style.padding = '8px 16px';
        element.style.borderRadius = '4px';
        element.style.textAlign = 'center';
        element.style.fontSize = `${props.textSize || 14}px`;
        break;
      case 'textview':
        element.innerHTML = props.text || 'TextView';
        element.style.color = props.textColor || '#000000';
        element.style.fontSize = `${props.textSize || 14}px`;
        break;
      case 'edittext':
        element.innerHTML = `<div style="color: #757575;">${props.hint || 'Enter text'}</div>`;
        element.style.border = '1px solid #CCCCCC';
        element.style.borderRadius = '4px';
        element.style.padding = '8px';
        element.style.fontSize = `${props.textSize || 14}px`;
        break;
    }
    element.addEventListener('click', () => {
      this.selectComponent(component.id);
    });
    return element;
  }

  selectComponent(componentId) {
    const prevSelected = document.querySelector('.preview-component.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }
    this.selectedComponent = this.currentScreen.components.find(c => c.id === componentId);
    if (!this.selectedComponent) return;
    const element = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
    if (element) {
      element.classList.add('selected');
    }
    this.updatePropertyEditor();
    this.setupPropertyEditorEvents();
  }

  updatePropertyEditor() {
    if (!this.selectedComponent) return;
    const props = this.selectedComponent.properties;
    const widthSelect = document.getElementById('prop-width');
    const heightSelect = document.getElementById('prop-height');
    if (widthSelect) widthSelect.value = props.width || 'wrap_content';
    if (heightSelect) heightSelect.value = props.height || 'wrap_content';
    const textInput = document.getElementById('prop-text');
    const textSizeInput = document.getElementById('prop-textsize');
    const textColorInput = document.getElementById('prop-textcolor');
    if (textInput && props.text !== undefined) {
      textInput.value = props.text;
    }
    if (textSizeInput && props.textSize !== undefined) {
      textSizeInput.value = props.textSize;
    }
    if (textColorInput && props.textColor !== undefined) {
      textColorInput.value = props.textColor;
    }
  }

  setupPropertyEditorEvents() {
    const widthSelect = document.getElementById('prop-width');
    const heightSelect = document.getElementById('prop-height');
    const textInput = document.getElementById('prop-text');
    const textSizeInput = document.getElementById('prop-textsize');
    const textColorInput = document.getElementById('prop-textcolor');
    if (widthSelect) {
      widthSelect.onchange = (e) => {
        if (!this.selectedComponent) return;
        this.selectedComponent.properties.width = e.target.value;
        this.saveComponentUpdate();
      };
    }
    if (heightSelect) {
      heightSelect.onchange = (e) => {
        if (!this.selectedComponent) return;
        this.selectedComponent.properties.height = e.target.value;
        this.saveComponentUpdate();
      };
    }
    if (textInput) {
      textInput.oninput = (e) => {
        if (!this.selectedComponent) return;
        this.selectedComponent.properties.text = e.target.value;
        this.saveComponentUpdate();
      };
    }
    if (textSizeInput) {
      textSizeInput.oninput = (e) => {
        if (!this.selectedComponent) return;
        this.selectedComponent.properties.textSize = parseInt(e.target.value) || 14;
        this.saveComponentUpdate();
      };
    }
    if (textColorInput) {
      textColorInput.oninput = (e) => {
        if (!this.selectedComponent) return;
        this.selectedComponent.properties.textColor = e.target.value;
        this.saveComponentUpdate();
      };
    }
  }

  saveComponentUpdate() {
    if (!this.selectedComponent) return;
    this.appService.updateComponent(this.currentApp.id, this.currentScreen.id, this.selectedComponent);
    this.renderComponentsPreview();
    this.selectComponent(this.selectedComponent.id);
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

  addComponentToScreen(componentType) {
    let componentProps = {
      type: componentType,
      properties: {}
    };
    
    // Set default properties based on component type
    switch (componentType) {
      case 'button':
        componentProps.properties = {
          text: 'Button',
          textSize: 14,
          textColor: '#000000',
          width: 'wrap_content',
          height: 'wrap_content'
        };
        break;
      case 'textview':
        componentProps.properties = {
          text: 'TextView',
          textSize: 14,
          textColor: '#000000',
          width: 'wrap_content',
          height: 'wrap_content'
        };
        break;
      case 'edittext':
        componentProps.properties = {
          hint: 'Enter text here',
          textSize: 14,
          textColor: '#000000',
          width: 'match_parent',
          height: 'wrap_content'
        };
        break;
      // Add other component types as needed
    }
    
    const newComponent = this.appService.addComponent(
      this.currentApp.id, 
      this.currentScreen.id, 
      componentProps
    );
    
    if (newComponent) {
      this.renderComponentsPreview();
      this.selectComponent(newComponent.id);
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
}

export default EditorView; 