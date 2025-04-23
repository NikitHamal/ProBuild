import AddScreenDialog from './AddScreenDialog.js';
import EditScreenDialog from './EditScreenDialog.js';
import ScreenRenderer from './ScreenRenderer.js';

class ScreenManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.appService = editorView.appService;
    this.currentScreenId = null;
    this.screenRenderer = new ScreenRenderer(this.appService);
    this.addScreenDialog = new AddScreenDialog(this);
    this.editScreenDialog = new EditScreenDialog(this);
    
    // Set initial screen
    if (editorView.currentScreen) {
      this.currentScreenId = editorView.currentScreen.id;
    }
  }

  // Compatibility with original ScreenManager
  renderScreensList() {
    return this.editorView.currentApp.screens.map(screen => {
      const isActive = screen.id === this.editorView.currentScreen.id;
      return `<div class="sidebar-item ${isActive ? 'active' : ''}" data-screen-id="${screen.id}"><i class="material-icons">phone_android</i><span>${screen.name}</span></div>`;
    }).join('');
  }
  
  // Compatibility with original ScreenManager
  setupScreenEventListeners() {
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
  }
  
  // Compatibility with original ScreenManager
  setCurrentScreen(screenId) {
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (screen) {
      // Instead of handling UI updates ourselves, delegate to editorView.onScreenChanged
      // which will update all necessary components (code editor, blocks manager, design view)
      this.editorView.onScreenChanged(screenId);
    }
  }
  
  // Compatibility with original ScreenManager
  showAddScreenDialog() {
    this.addScreenDialog.show();
  }

  // Add the missing method for editing app details
  showEditAppDialog(app) {
    if (!app) return;
    
    // Create a simple modal for editing app details
    const modalHtml = `
      <div class="dialog-overlay">
        <div class="dialog-content">
          <h2>Edit App Details</h2>
          <div class="form-group">
            <label for="app-name">App Name</label>
            <input type="text" id="app-name" value="${app.name || ''}">
          </div>
          <div class="form-group">
            <label for="app-package">Package Name</label>
            <input type="text" id="app-package" value="${app.packageName || 'com.example.app'}">
          </div>
          <div class="dialog-buttons">
            <button class="btn btn-cancel">Cancel</button>
            <button class="btn btn-save">Save</button>
          </div>
        </div>
      </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Setup event listeners
    const saveBtn = modalContainer.querySelector('.btn-save');
    const cancelBtn = modalContainer.querySelector('.btn-cancel');
    
    saveBtn.addEventListener('click', () => {
      const newName = document.getElementById('app-name').value.trim();
      const newPackage = document.getElementById('app-package').value.trim();
      
      if (newName) {
        // Update app details
        app.name = newName;
        app.packageName = newPackage;
        
        // Save changes using app service
        this.appService.updateApp(app);
        
        // Update UI
        if (this.editorView.sidebarManager) {
          this.editorView.sidebarManager.refreshProjectPanel();
        }
      }
      
      document.body.removeChild(modalContainer);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
  }

  showDeleteScreenDialog(screen) {
    if (!screen) return;
    this.confirmDeleteScreen(screen.id);
  }

  showEditScreenDialog(screen) {
    if (!screen) return;
    this.editScreen(screen.id);
  }

  // New implementation methods below
  initialize() {
    // Only call when using the new implementation
    this.renderScreensPanel();
    this.setupNewEventListeners();
  }

  renderScreensPanel() {
    const app = this.editorView.currentApp;
    const screensList = document.getElementById('screens-list');
    
    if (screensList) {
      screensList.innerHTML = this.screenRenderer.renderScreensList(app, this.currentScreenId);
      
      if (app.screens && app.screens.length > 0 && !this.currentScreenId) {
        this.setActiveScreen(app.screens[0].id);
      }
    }
  }

  setupNewEventListeners() {
    const screensList = document.getElementById('screens-list');
    const addScreenBtn = document.getElementById('add-screen-btn');
    
    if (screensList) {
      // Delegate event for screen selection
      screensList.addEventListener('click', (e) => {
        const screenItem = e.target.closest('.screen-item');
        if (screenItem) {
          const screenId = screenItem.dataset.screenId;
          if (!e.target.closest('.screen-edit-btn') && !e.target.closest('.screen-delete-btn')) {
            this.setActiveScreen(screenId);
          }
        }
        
        // Handle edit button click
        if (e.target.closest('.screen-edit-btn')) {
          const screenId = e.target.closest('.screen-edit-btn').dataset.screenId;
          this.editScreen(screenId);
        }
        
        // Handle delete button click
        if (e.target.closest('.screen-delete-btn')) {
          const screenId = e.target.closest('.screen-delete-btn').dataset.screenId;
          this.confirmDeleteScreen(screenId);
        }
      });
    }
    
    if (addScreenBtn) {
      addScreenBtn.addEventListener('click', () => {
        this.addScreenDialog.show();
      });
    }
  }

  setActiveScreen(screenId) {
    if (this.currentScreenId === screenId) return;
    
    this.currentScreenId = screenId;
    this.setCurrentScreen(screenId); // Use the compatibility method
    this.renderScreensPanel();
  }

  updateScreenDetails(screenId) {
    const screenDetailsPanel = document.getElementById('screen-details-panel');
    if (screenDetailsPanel) {
      const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
      screenDetailsPanel.innerHTML = this.screenRenderer.renderScreenDetails(screen);
    }
  }

  editScreen(screenId) {
    this.editScreenDialog.show(screenId);
  }

  confirmDeleteScreen(screenId) {
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (!screen) return;
    
    if (confirm(`Are you sure you want to delete the screen "${screen.name}"?`)) {
      this.deleteScreen(screenId);
    }
  }

  deleteScreen(screenId) {
    const result = this.editorView.appService.deleteScreen(this.editorView.currentApp.id, screenId);
    
    if (result) {
      // If the deleted screen was the active one, set the first available screen as active
      if (this.currentScreenId === screenId) {
        if (this.editorView.currentApp.screens && this.editorView.currentApp.screens.length > 0) {
          this.setActiveScreen(this.editorView.currentApp.screens[0].id);
        } else {
          this.currentScreenId = null;
        }
      }
      
      this.renderScreensPanel();
    } else {
      alert('Failed to delete screen');
    }
  }
}

export default ScreenManager; 