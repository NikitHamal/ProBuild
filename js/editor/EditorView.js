import AppService from '../app-service.js';
import ComponentManager from './components/ComponentManager.js';
import PropertyPanel from './panels/PropertyPanel.js';
import ScreenManager from './panels/ScreenManager.js';
import DialogManager from './utils/DialogManager.js';
import NotificationManager from './utils/NotificationManager.js';
import BlocksManager from './blocks/BlocksManager.js';
import CodeManager from './code/CodeManager.js';
import RunManager from './utils/RunManager.js';
import PreviewManager from './utils/PreviewManager.js';
import BuildWorkflowManager from './build/BuildWorkflowManager.js';

class EditorView {
  constructor() {
    this.appService = AppService;
    this.currentApp = null;
    this.currentScreen = null;
    this.selectedComponent = null;
    this.propertyPanelVisible = false;
    
    // --- Undo/Redo History ---
    this.undoStack = [];
    this.redoStack = [];
    // -------------------------
    
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
      // Redirect to home if app not found
      window.location.href = 'index.html';
      return;
    }
    
    // Set the first screen as active by default
    this.currentScreen = this.currentApp.screens[0];
    
    // Initialize managers
    this.componentManager = new ComponentManager(this);
    this.propertyPanel = new PropertyPanel(this);
    this.screenManager = new ScreenManager(this);
    this.dialogManager = new DialogManager(this);
    this.notificationManager = new NotificationManager();
    this.blocksManager = new BlocksManager(this);
    this.codeManager = new CodeManager(this);
    this.runManager = new RunManager(this);
    this.previewManager = new PreviewManager(this);
    this.buildWorkflowManager = new BuildWorkflowManager(this);
    
    this.renderEditor();
    this.setupEventListeners();
    this.updateUndoRedoButtons(); // Initial state
  }

  renderEditor() {
    // Main render method now calls helper methods
    document.body.innerHTML = `
      <div class="editor-container">
        ${this._renderComponentsSidebar()}
        <div class="editor-workspace">
          ${this._renderEditorHeader()}
          ${this._renderEditorWorkspaceContent()}
        </div>
        ${this._renderEditorSidebar()}
        ${this.propertyPanel.renderPropertyPanel()}
      </div>
    `;
    // Apply initial device size after rendering
    this.updateDevicePreviewSize();
  }

  // --- Refactored Rendering Methods ---

  _renderComponentsSidebar() {
    // Added search input
    return `
      <div class="components-sidebar">
        <div class="sidebar-section" style="padding: 8px;">
          <input type="search" id="component-search" placeholder="Search components..." class="property-input" style="width: 100%; font-size: 0.9rem; padding: 4px 6px;">
        </div>
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
    `;
  }

  _renderEditorHeader() {
    const deviceOptionsHtml = this.devices.map(device =>
        `<option value="${device.name}"${device.name === this.selectedDevice.name ? ' selected' : ''}>${device.name}</option>`
    ).join('');

    // Changed Run button to Build button
    return `
      <div class="editor-header">
        <div class="editor-title">
          <i class="material-icons">edit</i>
          ${this.currentScreen.name}
        </div>
        <div class="editor-actions">
          <select id="device-selector">${deviceOptionsHtml}</select>
          <button id="undo-btn" class="editor-action-btn" title="Undo"><i class="material-icons">undo</i></button>
          <button id="redo-btn" class="editor-action-btn" title="Redo"><i class="material-icons">redo</i></button>
          <button class="editor-action-btn primary save-app-btn"><i class="material-icons">save</i>Save</button>
          <button class="editor-action-btn preview-app-btn" style="background-color: #2196F3; color: white;"><i class="material-icons">visibility</i>Preview</button>
          <button class="editor-action-btn build-app-btn" style="background-color: #4CAF50; color: white;"><i class="material-icons">build</i>Build</button>
        </div>
      </div>
    `;
  }

  _renderEditorWorkspaceContent() {
    return `
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
    `;
  }

  _renderEditorSidebar() {
    // The sidebar now has tabs for PROJECT/SCREENS and PROPERTIES
    return `
      <div class="editor-sidebar">
        <div class="sidebar-tabs">
          <div class="sidebar-tab active" data-sidebar-tab="project">PROJECT</div>
          <div class="sidebar-tab" data-sidebar-tab="properties">PROPERTIES</div>
        </div>
        
        <div class="sidebar-panel active" id="project-panel">
          <div class="sidebar-section">
            <div class="sidebar-title">PROJECT</div>
            <div class="sidebar-item active"><i class="material-icons">phone_android</i><span>${this.currentApp.name}</span></div>
            <div class="sidebar-item edit-app-details"><i class="material-icons">settings</i><span>App Details</span></div>
          </div>
          <div class="sidebar-section">
            <div class="sidebar-title">SCREENS</div>
            <div class="screens-list">
              ${this.currentApp.screens.map(screen => {
                const isActive = screen.id === this.currentScreen.id;
                return `
                  <div class="sidebar-item screen-item ${isActive ? 'active' : ''}" data-screen-id="${screen.id}">
                    <div class="screen-item-info">
                      <i class="material-icons">phone_android</i>
                      <span>${screen.name}</span>
                    </div>
                    <div class="screen-item-actions">
                      ${screen.name !== 'MainActivity' ? `
                      <button class="screen-action-btn edit-screen-btn" data-screen-id="${screen.id}" title="Edit Screen">
                        <i class="material-icons">edit</i>
                      </button>
                      ${this.currentApp.screens.length > 1 ? 
                        `<button class="screen-action-btn delete-screen-btn" data-screen-id="${screen.id}" title="Delete Screen">
                          <i class="material-icons">delete</i>
                        </button>` : 
                        ''
                      }
                      ` : '' }
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="sidebar-item add-screen"><i class="material-icons">add</i><span>Add Screen</span></div>
          </div>
        </div>
        
        <div class="sidebar-panel" id="properties-panel">
          ${this.propertyPanel.renderSidebarPropertyPanel()}
        </div>
      </div>
    `;
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
      return this.blocksManager.renderBlocksTab();
    } else if (tab === 'code') {
      return this.codeManager.renderCodeTab();
    }
    return '';
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
        }
        
        if (tabName === 'design') {
          this.componentManager.setupDesignTabEvents();
        } else if (tabName === 'blocks') {
          this.blocksManager.initializeBlockly();
        } else if (tabName === 'code') {
          this.codeManager.initCodeEditor();
        }
      });
    });
    
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const currentActive = document.querySelector('.sidebar-tab.active');
        if (currentActive) {
          currentActive.classList.remove('active');
          const activePanel = document.querySelector('.sidebar-panel.active');
          if (activePanel) activePanel.classList.remove('active');
        }
        
        tab.classList.add('active');
        const panelId = tab.dataset.sidebarTab + '-panel';
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
      });
    });
    
    // Device selector
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
      deviceSelector.addEventListener('change', (e) => {
        const deviceName = e.target.value;
        this.changeDevicePreview(deviceName);
      });
    }
    
    // Screen selection
    document.querySelectorAll('.screen-item').forEach(screenItem => {
      screenItem.addEventListener('click', (e) => {
        if (e.target.closest('.screen-action-btn')) return;
        const screenId = screenItem.dataset.screenId;
        this.onScreenChanged(screenId);
      });
    });
    
    // Edit screen
    document.querySelectorAll('.edit-screen-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screenId = btn.dataset.screenId;
        const screen = this.currentApp.screens.find(s => s.id === screenId);
        if (screen) {
          this.screenManager.showEditScreenDialog(screen);
        }
      });
    });
    
    // Delete screen
    document.querySelectorAll('.delete-screen-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screenId = btn.dataset.screenId;
        const screen = this.currentApp.screens.find(s => s.id === screenId);
        if (screen) {
          this.screenManager.showDeleteScreenDialog(screen);
        }
      });
    });
    
    // Add screen
    const addScreenBtn = document.querySelector('.add-screen');
    if (addScreenBtn) {
      addScreenBtn.addEventListener('click', () => {
        this.screenManager.showAddScreenDialog();
      });
    }
    
    // Edit app details
    const editAppDetailsBtn = document.querySelector('.edit-app-details');
    if (editAppDetailsBtn) {
      editAppDetailsBtn.addEventListener('click', () => {
        this.screenManager.showEditAppDialog(this.currentApp);
      });
    }
    
    // Save app button
    const saveAppBtn = document.querySelector('.save-app-btn');
    if (saveAppBtn) {
      saveAppBtn.addEventListener('click', () => {
        this.saveApp();
      });
    }
    
    // Preview button
    const previewAppBtn = document.querySelector('.preview-app-btn');
    if (previewAppBtn) {
      previewAppBtn.addEventListener('click', () => {
        this.previewManager.showPreviewDialog(this.currentApp);
      });
    }
    
    // Change Run button to Build button
    const buildAppBtn = document.querySelector('.build-app-btn');
    if (buildAppBtn) {
      buildAppBtn.addEventListener('click', () => {
        this.buildWorkflowManager.startBuildProcess();
      });
    }
    
    // Component search
    const componentSearch = document.getElementById('component-search');
    if (componentSearch) {
      componentSearch.addEventListener('input', (e) => {
        this.handleComponentSearch(e);
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
    
    // Initialize the components manager 
    // (for drag & drop functionality and component selection)
    this.componentManager.setupDesignTabEvents();
  }

  handleKeyDown(e) {
    // Delegate to component manager, but also check for undo/redo shortcuts here
    // (Already handled in setupEventListeners, but could be placed here too)
    this.componentManager.handleKeyDown(e);
  }

  // Added method for component search filtering
  handleComponentSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const componentItems = document.querySelectorAll('.components-list .component-item');
    componentItems.forEach(item => {
      const nameElement = item.querySelector('.component-name');
      const componentName = nameElement ? nameElement.textContent.toLowerCase() : '';
      if (componentName.includes(searchTerm)) {
        item.style.display = ''; // Show item
      } else {
        item.style.display = 'none'; // Hide item
      }
    });
  }

  saveApp() {
    // Improved save feedback using NotificationManager
    try {
      if (this.appService.updateApp(this.currentApp)) {
        this.notificationManager.showNotification('App saved successfully!', 'success');
      } else {
        // This case might happen if the app was deleted in another tab/window
        this.notificationManager.showNotification('Error: App not found. Could not save.', 'error');
      }
    } catch (error) {
      console.error("Error during save operation:", error);
      this.notificationManager.showNotification('Error saving app. Check console for details.', 'error');
    }
    // Optionally clear undo/redo history on manual save? Or keep it? Keeping it for now.
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
  
  onScreenChanged(screenId) {
    // Method to be called when screen is changed from any manager
    const screen = this.currentApp.screens.find(s => s.id === screenId);
    if (screen) {
      this.currentScreen = screen;
      
      // Update UI
      const screenTitle = document.querySelector('.editor-title');
      if (screenTitle) {
        screenTitle.innerHTML = `<i class="material-icons">edit</i> ${screen.name}`;
      }
      
      // Update active state in sidebar
      document.querySelectorAll('.sidebar-item[data-screen-id]').forEach(item => {
        if (item.dataset.screenId === screenId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Notify other managers about screen change
      const activeTab = document.querySelector('.editor-tab.active');
      if (activeTab) {
        const tabName = activeTab.dataset.tab;
        if (tabName === 'design') {
          this.componentManager.renderComponentsPreview();
        } else if (tabName === 'blocks') {
          this.blocksManager.changeScreen(screenId);
        } else if (tabName === 'code') {
          this.codeManager.changeScreen(screenId);
        }
      }
      
      // Clear undo/redo history when changing screens
      this.undoStack = [];
      this.redoStack = [];
      this.updateUndoRedoButtons();
    }
  }

  requestPreviewUpdate() {
    this.previewManager.updatePreview();
  }

  notifyCodePotentiallyDirty(componentId, propertyName) {
    // Potentially mark code as dirty or trigger analysis later
    // console.log(`Component ${componentId} property ${propertyName} changed.`);
  }

  // --- Undo/Redo Implementation ---

  /**
   * Executes a command, adds it to the undo stack, and updates UI.
   * NOTE: Methods in ComponentManager, PropertyPanel etc. should call this.
   * Example: this.editorView.executeCommand(new AddComponentCommand(...));
   */
  executeCommand(command) {
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack when a new command is executed
    command.execute();
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.undoStack.length === 0) {
      return;
    }
    const command = this.undoStack.pop();
    if (!command.undo()) {
      // If undo fails, push it back onto the stack?
      // Or notify the user?
      // For now, let's assume undo can fail silently but log it
    } else {
      this.redoStack.push(command);
    }
    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) {
      return;
    }
    const command = this.redoStack.pop();
    if (!command.execute()) {
      // If redo fails, push it back onto the stack?
    } else {
      this.undoStack.push(command);
    }
    this.updateUndoRedoButtons();
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) {
      undoBtn.disabled = this.undoStack.length === 0;
    }
    if (redoBtn) {
      redoBtn.disabled = this.redoStack.length === 0;
    }
  }

  // --- End Undo/Redo Implementation ---
}

export default EditorView; 