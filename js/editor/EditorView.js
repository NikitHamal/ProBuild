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

// --- New Modular Managers ---
import EditorLayoutManager from './managers/EditorLayoutManager.js';
import EditorTabManager from './managers/EditorTabManager.js';
import EditorSidebarManager from './managers/EditorSidebarManager.js';
import DevicePreviewManager from './managers/DevicePreviewManager.js';
import UndoRedoManager from './managers/UndoRedoManager.js';

class EditorView {
  constructor() {
    console.log("EditorView constructing...");
    this.appService = AppService;
    this.currentApp = null;
    this.currentScreen = null;
    this.selectedComponent = null;
    this.activeTab = 'design'; // Initial tab state
    
    // --- Instantiate Managers ---
    // Core functionality managers (might be further refactored later)
    this.notificationManager = new NotificationManager();
    this.dialogManager = new DialogManager(this); // Likely needs access to view
    this.dialogUtility = window.DialogUtility; // Reference to DialogUtility for other managers
    this.propertyPanel = new PropertyPanel(this); // Needs access to view/selected component
    this.screenManager = new ScreenManager(this); // Needed for screen dialogs
    this.componentManager = new ComponentManager(this); // Manages design canvas interactions
    this.blocksManager = new BlocksManager(this); // Manages blocks tab
    this.codeManager = new CodeManager(this); // Manages code tab
    this.previewManager = new PreviewManager(this); // Manages preview window
    this.buildWorkflowManager = new BuildWorkflowManager(this); // Manages build process
    
    // New UI/State Managers
    this.layoutManager = new EditorLayoutManager(this);
    this.tabManager = new EditorTabManager(this);
    this.sidebarManager = new EditorSidebarManager(this);
    this.devicePreviewManager = new DevicePreviewManager(this);
    this.undoRedoManager = new UndoRedoManager(this);
    
    console.log("EditorView managers instantiated.");
    
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
    console.log("EditorView initializing...");
    // 1. Get App ID and Load App Data
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get('id');
    
    if (!appId) {
      console.error("No App ID found in URL. Redirecting to home.");
      this.redirectToHome();
      return;
    }
    
    this.currentApp = this.appService.getAppById(appId);
    
    if (!this.currentApp || !this.currentApp.screens || this.currentApp.screens.length === 0) {
      console.error("App data not found or invalid for ID:", appId, ". Redirecting to home.");
      this.notificationManager.showNotification('Error loading app data.', 'error');
      this.redirectToHome();
      return;
    }
    
    // Set the first screen as active by default
    this.currentScreen = this.currentApp.screens[0];
    console.log(`Initial app loaded: ${this.currentApp.name}, screen: ${this.currentScreen.name}`);

    // 2. Render the main editor layout
    // This will also trigger the .init() methods of managers that depend on the DOM
    this.layoutManager.renderInitialLayout();

    // 3. Setup remaining global event listeners (like keyboard shortcuts)
    this.setupGlobalEventListeners();

    console.log("EditorView initialization complete.");
  }

  redirectToHome() {
     // Abstracted redirection
     window.location.href = 'index.html';
  }

  // --- Global Event Listeners (e.g., Keyboard) ---
  setupGlobalEventListeners() {
      document.addEventListener('keydown', (e) => {
          this.handleKeyDown(e);
      });
      
      // Add keyup handler for cleaning up after key events
      document.addEventListener('keyup', (e) => {
          this.handleKeyUp(e);
      });
      
      // Add other global listeners if needed
  }

  handleKeyDown(e) {
      // Check for Ctrl+S or Cmd+S for saving (centralized handling)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          console.log(`Ctrl+S detected in active tab: ${this.activeTab}`);
          this.saveCurrentView();
          return; // Handled
      }

       // Check for Ctrl+Z / Cmd+Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          this.undoRedoManager.undo();
          return; // Handled
      }

      // Check for Ctrl+Y / Cmd+Shift+Z (Redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
          e.preventDefault();
          this.undoRedoManager.redo();
          return; // Handled
      }
      
      // Delegate other keydown events based on the active tab
      switch (this.activeTab) {
          case 'design':
              // Delegate to ComponentInteractionHandler for component operations
              if (this.componentManager && this.componentManager.interactionHandler) {
                  this.componentManager.interactionHandler.handleKeyDown(e);
              }
              break;
          case 'blocks':
              // this.blocksManager?.handleKeyDown(e); // If needed
              break;
          case 'code':
              // this.codeManager?.handleKeyDown(e); // If needed (CodeMirror might handle most)
              break;
      }
  }

  // Handle keyup events (primarily for cleaning up)
  handleKeyUp(e) {
      // Delegate keyup events based on the active tab
      switch (this.activeTab) {
          case 'design':
              if (this.componentManager && this.componentManager.interactionHandler) {
                  this.componentManager.interactionHandler.handleKeyUp(e);
              }
              break;
          // Add other tab handlers if needed
      }
  }

  saveCurrentView() {
      switch (this.activeTab) {
        case 'code':
              // Assuming CodeManager might have its own specific save logic (e.g., for files)
              this.codeManager?.saveCurrentChanges ? this.codeManager.saveCurrentChanges() : this.saveApp();
              console.log("Triggering code save/app save...");
          break;
        case 'blocks':
              // Saving blocks often implicitly saves the app state they generate
              // Explicitly save blocks state into the app object here
              this.blocksManager?.saveBlocks(); 
              this.saveApp(); // Save the overall app state
              console.log("Triggering blocks save/app save...");
          break;
        case 'design':
          default:
              // Saving design changes means saving the app state
          this.saveApp(); 
              console.log("Triggering app save (for design/default)...");
          break;
      }
  }

  // --- Core Actions / State Changes ---

  saveApp() {
      console.log("Saving app state...");
      try {
          // Ensure latest blocks state is saved to the currentApp object before persisting
          this.blocksManager?.saveBlocks(); 
          
          // Ensure latest screen data is captured before saving
          // If blocks/code generate component structure, ensure it's updated
          // This might involve calling methods on blocksManager or codeManager if necessary
          
      if (this.appService.updateApp(this.currentApp)) {
        // this.notificationManager.showNotification('App saved successfully!', 'success'); // Commented out to reduce noise
              // Maybe reset undo history on explicit save?
              // this.undoRedoManager.clearHistory(); 
      } else {
        this.notificationManager.showNotification('Error: App not found. Could not save.', 'error');
      }
    } catch (error) {
      console.error("Error during save operation:", error);
      this.notificationManager.showNotification('Error saving app. Check console for details.', 'error');
    }
  }

  onScreenChanged(screenId) {
      const newScreen = this.currentApp.screens.find(s => s.id === screenId);
      if (newScreen && newScreen.id !== this.currentScreen?.id) {
          console.log(`Screen changed TO: ${newScreen.name} (ID: ${screenId})`);
          this.currentScreen = newScreen;
          this.selectedComponent = null; // Clear selection when screen changes
          
          // Update UI elements managed directly or by specific managers
          this.layoutManager.updateScreenTitle(newScreen.name);
          this.sidebarManager.updateActiveScreen(screenId);
          this.propertyPanel.clearPanel(); // Clear property panel
          
          // Notify relevant managers about the screen change
          this.tabManager.handleScreenChange(); // Let TabManager update its current view
          // ComponentManager is handled via tabManager calling renderComponentsPreview
          // BlocksManager is handled via tabManager calling changeScreen
          // CodeManager is handled via tabManager calling changeScreen
          
          // Clear undo/redo history when changing screens
          this.undoRedoManager.clearHistory();
          console.log(`Screen change processed for ${newScreen.name}.`);
      } else if (!newScreen) {
          console.error(`Attempted to change to non-existent screen ID: ${screenId}`);
      } else {
          console.log(`Attempted to change to the *same* screen: ${newScreen.name}`);
      }
  }

  setSelectedComponent(component) {
      console.log("Setting selected component:", component?.id || null);
      if (this.selectedComponent !== component) {
        this.selectedComponent = component;
        this.propertyPanel.showPropertyPanel();
         // Update UI to reflect selection (ComponentManager might handle visual selection)
         this.componentManager?.highlightSelection(component ? component.id : null);
         this.updatePropertyPanelVisibility(); // Update panel based on selection
      }
  }
  
  // Centralized method to control property panel visibility
  updatePropertyPanelVisibility(forceHide = null) {
      const shouldBeVisible = forceHide === false || (forceHide === null && this.activeTab === 'design' && this.selectedComponent);
      
      if (shouldBeVisible) {
          this.propertyPanel?.showPropertyPanel();
      } else {
          this.propertyPanel?.hidePropertyPanel();
      }
  }

  // Called by ComponentManager or PropertyPanel when a property changes
  // Ensures changes trigger necessary updates (save, preview, undo)
  handleComponentPropertyChange(component, propertyName, oldValue, newValue) {
      console.log(`Property changed: ${component.id}.${propertyName} from ${oldValue} to ${newValue}`);
      
      // Create a Command pattern for property changes for Undo/Redo
      const command = new UpdatePropertyCommand(
        this, 
        component.id, 
        `properties.${propertyName}`, 
        newValue, 
        oldValue
      );
      
      // Execute the command through the UndoRedoManager
      this.undoRedoManager.executeCommand(command);
      
      // Update UI components immediately for a better user experience
      
      // 1. Update the preview if the component is visible
      const componentElement = document.querySelector(`.preview-component[data-component-id="${component.id}"]`);
      if (componentElement && this.propertyPanel) {
        // Let property panel handle the direct DOM update for consistent behavior
        this.propertyPanel.updateComponentPreview(component.id, propertyName, newValue);
      }
      
      // 2. Update the property panel values if it's visible and showing this component
      if (this.propertyPanelVisible && this.selectedComponent && this.selectedComponent.id === component.id) {
        this.propertyPanel.updatePropertyValues();
      }
      
      // 3. Request a preview update for the live preview window if open
      this.requestPreviewUpdate();
      
      // 4. Notify code/blocks managers about the change (for potential code generation)
      this.notifyCodePotentiallyDirty(component.id, propertyName);
      
      // 5. Save the app state
      this.saveApp();
  }
  
  findComponentInApp(componentId) {
      if (!this.currentScreen || !this.currentScreen.components) return null;
      // First try a direct lookup in the current screen's components
      const component = this.currentScreen.components.find(c => c.id === componentId);
      if (component) return component;
      
      // If not found, try a recursive search (for nested components)
      return this.findComponentRecursively(this.currentScreen.components, componentId);
  }
  
  findComponentRecursively(components, componentId) {
    if (!components || !components.length) return null;
    
    for (const component of components) {
      if (component.id === componentId) return component;
      
      // Check children if this component has them
      if (component.properties && component.properties.children) {
        const found = this.findComponentRecursively(component.properties.children, componentId);
        if (found) return found;
      }
    }
    
    return null;
  }

  // Called by ComponentManager when component structure changes (add, delete, move)
  handleComponentStructureChange(command) { // Expecting a Command object
       console.log("Handling component structure change via command:", command);
      this.undoRedoManager.executeCommand(command);
      // Save and preview update are handled by executeCommand -> saveApp
  }

  requestPreviewUpdate() {
      this.previewManager?.updatePreview();
  }

  notifyCodePotentiallyDirty(componentId, propertyName) {
      // This could later trigger analysis or warnings in Blocks/Code tabs
    // console.log(`Component ${componentId} property ${propertyName} changed.`);
       // Removed call to non-existent blocksManager.markCodeDirty
       // Removed call to non-existent codeManager.markCodeDirty
  }
  
}

export default EditorView; 