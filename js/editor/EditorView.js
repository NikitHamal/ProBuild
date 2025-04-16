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

class EditorView {
  constructor() {
    this.appService = AppService;
    this.currentApp = null;
    this.currentScreen = null;
    this.selectedComponent = null;
    this.propertyPanelVisible = false;
    
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
              <button class="editor-action-btn preview-app-btn" style="background-color: #2196F3; color: white;"><i class="material-icons">visibility</i>Preview</button>
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
            <div class="screens-list">${this.screenManager.renderScreensList()}</div>
            <div class="sidebar-item add-screen"><i class="material-icons">add</i><span>Add Screen</span></div>
          </div>
        </div>
        ${this.propertyPanel.renderPropertyPanel()} 
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
          if (tabName === 'design') {
            this.componentManager.renderComponentsPreview();
            this.componentManager.setupDesignTabEvents();
          } else if (tabName === 'blocks') {
            this.blocksManager.setupEventListeners();
            if (this.currentScreen) {
              this.blocksManager.changeScreen(this.currentScreen.id);
            }
          } else if (tabName === 'code') {
            this.codeManager.setupEventListeners();
            if (this.currentScreen) {
              this.codeManager.changeScreen(this.currentScreen.id);
            }
          }
        }
      });
    });
    
    this.componentManager.setupDesignTabEvents();
    this.screenManager.setupScreenEventListeners();
    
    const editAppDetailsBtn = document.querySelector('.edit-app-details');
    if (editAppDetailsBtn) {
      editAppDetailsBtn.addEventListener('click', () => {
        this.dialogManager.showEditAppDetailsDialog();
      });
    }
    
    const saveBtn = document.querySelector('.editor-action-btn.primary');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveApp();
      });
    }

    // Run Button Listener
    const allActionBtns = document.querySelectorAll('.editor-action-btn');
    allActionBtns.forEach(btn => {
      const icon = btn.querySelector('i.material-icons');
      if (icon && icon.textContent === 'play_arrow') {
        btn.addEventListener('click', () => {
          this.runManager.showBuildDialog();
        });
      }
    });

    // Preview Button Listener
    const previewBtn = document.querySelector('.preview-app-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.previewManager.launchAppPreview();
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
    this.componentManager.handleKeyDown(e);
  }

  saveApp() {
    if (this.appService.updateApp(this.currentApp)) {
      this.notificationManager.showNotification('App saved successfully', 'success');
    }
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
    }
  }

  requestPreviewUpdate() {
    if (this.previewManager && this.previewManager.isPreviewWindowOpen()) {
      this.previewManager.updatePreviewContent();
    }
  }

  notifyCodePotentiallyDirty(componentId, propertyName) {
    if (this.codeManager) {
      this.codeManager.markFileAsDirty(componentId, propertyName);
    }
  }
}

export default EditorView; 