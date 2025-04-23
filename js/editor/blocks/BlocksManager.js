import NotificationManager from '../utils/NotificationManager.js';
import { toolboxXml } from './ToolboxConfig.js';
import BlockDropdowns from './BlockDropdowns.js';
import { defineCustomBlocks } from './CustomBlocks.js';
import WorkspaceManager from './WorkspaceManager.js';

// REMOVED OLD TOOLBOX XML DEFINITION HERE

class BlocksManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.currentApp = editorView.currentApp;
    this.currentScreen = editorView.currentScreen;
    this.notificationManager = new NotificationManager();

    // Instantiate helpers and managers
    this.dropdownHelper = new BlockDropdowns(this);
    this.workspaceManager = new WorkspaceManager(this);

    // Define custom blocks, passing the global Blockly and the helper
    // Assumes Blockly is loaded globally via script tag in editor.html
    if (typeof Blockly !== 'undefined') {
      defineCustomBlocks(Blockly, this.dropdownHelper);
    } else {
      console.error("Blockly global object not found during BlocksManager construction!");
      this.notificationManager.showNotification('Critical Error: Blockly library failed to load.', 'error');
    }
  }

  renderBlocksTab() {
    // Simple structure: a div for Blockly. Toolbox is passed during initialization.
    return `
      <div class="blocks-editor-container" style="width:100%; height:100%;">
        <div id="blockly-div" class="blockly-workspace" style="width:100%; height:100%;"></div>
      </div>
    `;
  }

  // Main initialization point, called by EditorView after the tab is rendered
  initializeBlockly() {
    // Wait for the DOM to be ready
    setTimeout(() => {
      const blocklyDiv = document.getElementById('blockly-div');
      if (!blocklyDiv) {
          console.error("Cannot initialize Blockly: #blockly-div not found!");
          
          // Additional debugging information
          console.log("Available divs with IDs:", Array.from(document.querySelectorAll('[id]')).map(el => el.id));
          console.log("DOM structure for blocks-editor-container:", document.querySelector('.blocks-editor-container')?.innerHTML || 'blocks-editor-container not found');
          console.log("DOM structure for blocks-editor:", document.querySelector('.blocks-editor')?.innerHTML || 'blocks-editor not found');
          
          // Try another way to find the container
          const editorPanel = document.getElementById('editor-panel');
          console.log("Editor panel exists:", !!editorPanel);
          console.log("Editor panel content:", editorPanel?.innerHTML || 'editor-panel not found');
          
          this.notificationManager.showNotification('Error initializing blocks editor container.', 'error');
          return;
      }
      
      console.log("Blockly div found, initializing workspace...");
      // Delegate initialization to the WorkspaceManager
      this.workspaceManager.initialize(blocklyDiv, toolboxXml, this.dropdownHelper);
    }, 150); // Longer delay to ensure DOM is fully updated
  }
  
  // Method called by WorkspaceManager on block changes to update CodeManager
  triggerCodeUpdate() {
             const generatedCode = this.getGeneratedCode();
             if (generatedCode !== null && this.editorView.codeManager) {
          // Update code view via CodeManager
                 this.editorView.codeManager.updateCodeFromBlocks(generatedCode); 
      } else if (generatedCode === null) {
          console.warn("Code generation failed, not updating code view.");
      }
  }

  // Generates code from the current workspace state
  getGeneratedCode() {
    const workspace = this.workspaceManager.getWorkspace();
    if (!workspace) {
        // Don't show notification here, as ensureWorkspaceReady should handle it
        // this.notificationManager.showNotification('Blocks workspace not initialized.', 'warning');
        console.warn("getGeneratedCode called before workspace was initialized.");
        return null;
    }
    try {
        // Configure JavaScript generator
        window.LoopTrap = 1000; // Basic infinite loop protection
        Blockly.JavaScript.INFINITE_LOOP_TRAP = 'if (--window.LoopTrap == 0) throw "Infinite loop.";\n';
        // Generate the code
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        return code;
    } catch (e) {
        console.error("Error generating code from Blockly workspace:", e);
        this.notificationManager.showNotification(`Code Generation Error: ${e}`, 'error');
        return null;
    }
  }
  
  // Handles screen switching
  changeScreen(screenId) {
    if (this.currentScreen && this.currentScreen.id === screenId) {
      return; // No change
    }
    
    // Save current workspace state before switching
    this.workspaceManager.saveState();
    
    // Update current screen reference
    const newScreen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (newScreen) {
      this.currentScreen = newScreen;
      console.log(`BlocksManager: Switched to screen ${this.currentScreen.name}`);
      
      // Load the state for the new screen via WorkspaceManager
      this.workspaceManager.loadState(); 
    } else {
      console.error(`BlocksManager: Screen with ID ${screenId} not found during changeScreen.`);
    }
  }

  // Handles component ID changes, delegates to WorkspaceManager
  handleComponentIdChange(oldId, newId) {
    this.workspaceManager.updateComponentIdReferences(oldId, newId);
  }

  // Ensures the workspace is initialized, called by EditorView
  ensureWorkspaceReady() {
    if (!this.workspaceManager.getWorkspace()) {
      console.log('BlocksManager: Workspace not ready via ensureWorkspaceReady, calling initializeBlockly.');
      this.initializeBlockly(); 
    } else {
       // Workspace exists, ensure blocks are loaded for the current screen
       // This might be needed if ensureWorkspaceReady is called after a screen switch but before block init
       this.workspaceManager.loadState();
       console.log('BlocksManager: Workspace already exists, ensured state loaded.');
    }
  }
  
  // Expose save functionality if needed externally (e.g., global save button)
  saveBlocks() {
      this.workspaceManager.saveState();
  }
  
  // Clean up when the editor is closed or blocks tab destroyed
  dispose() {
      this.workspaceManager.dispose();
      console.log("BlocksManager disposed.");
  }
}

export default BlocksManager; 
