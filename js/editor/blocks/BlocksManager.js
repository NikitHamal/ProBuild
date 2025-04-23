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
    console.log("BlocksManager.initializeBlockly() called");
    
    // Check if we're running on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // Ensure the blockly div exists and has dimensions
    let blocklyDiv = document.getElementById('blockly-div');
    
    // Special handling for GitHub Pages
    if (!blocklyDiv && isGitHubPages) {
      console.warn("Primary blockly-div not found, checking for fallback on GitHub Pages");
      blocklyDiv = document.getElementById('blockly-div-fallback');
      
      if (blocklyDiv) {
        console.log("Using fallback blockly-div for GitHub Pages");
      }
    }
    
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
        
        // If on GitHub Pages, create a dynamic blockly div as last resort
        if (isGitHubPages) {
          console.log("Creating emergency blockly-div for GitHub Pages");
          blocklyDiv = document.createElement('div');
          blocklyDiv.id = 'blockly-div-emergency';
          blocklyDiv.style.width = '800px';
          blocklyDiv.style.height = '600px';
          blocklyDiv.style.position = 'absolute';
          blocklyDiv.style.top = '50px';
          blocklyDiv.style.left = '50px';
          blocklyDiv.style.zIndex = '1000';
          blocklyDiv.style.backgroundColor = '#f0f0f0';
          blocklyDiv.style.border = '1px solid #ccc';
          
          // Find a suitable container
          const container = document.getElementById('editor-panel') || 
                           document.getElementById('app-root') || 
                           document.body;
          
          container.appendChild(blocklyDiv);
          console.log("Emergency blockly-div created and attached to:", container.id || 'body');
        } else {
          this.notificationManager.showNotification('Error initializing blocks editor container.', 'error');
          return;
        }
    }
    
    // Ensure Blockly is properly loaded
    if (typeof Blockly === 'undefined') {
        console.error("Blockly library is not defined! Cannot initialize workspace.");
        this.notificationManager.showNotification('Blockly library not loaded. Try reloading the page.', 'error');
        return; 
    }
    
    const rect = blocklyDiv.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        console.warn("Blockly div has zero dimensions, may cause rendering issues:", rect);
    }

    console.log(`BlocksManager: Initializing Blockly in div with dimensions ${rect.width}x${rect.height}px`);
    
    // Clear any previous workspace
    if (this.workspaceManager.getWorkspace()) {
        console.log("Disposing existing workspace before re-initialization");
        this.workspaceManager.dispose();
    }
    
    // Delegate initialization to the WorkspaceManager
    const success = this.workspaceManager.initialize(blocklyDiv, toolboxXml, this.dropdownHelper);
    
    if (success) {
        console.log("BlocksManager: Blockly initialization succeeded");
    } else {
        console.error("BlocksManager: Blockly initialization failed");
        this.notificationManager.showNotification('Failed to initialize blocks editor. Try switching tabs.', 'error');
    }
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
    console.log("BlocksManager.ensureWorkspaceReady() called");
    
    // Check if we're running on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (!this.workspaceManager.getWorkspace()) {
      console.log('BlocksManager: Workspace not ready, initializing now...');
      
      // Find an appropriate blockly div
      let blocklyDiv = document.getElementById('blockly-div') || 
                      (isGitHubPages ? document.getElementById('blockly-div-fallback') : null);
      
      if (blocklyDiv) {
        this.initializeBlockly();
      } else {
        console.error('BlocksManager: Cannot initialize, blockly-div not found in DOM.');
        
        // If on GitHub Pages, create the emergency div
        if (isGitHubPages) {
          console.log("Creating emergency blockly-div during ensureWorkspaceReady for GitHub Pages");
          this.initializeBlockly(); // This will create the emergency div
          return true; // Try to proceed
        }
        
        // We're likely being called from the Code tab, so don't show a notification
        // that would confuse the user since they're not on the Blocks tab
        console.log('Blocks workspace not ready when requested from another tab.');
        
        // Return false to indicate the workspace is not ready
        return false;
      }
    } else {
       // Workspace exists, ensure blocks are loaded for the current screen
       console.log('BlocksManager: Workspace already exists, loading state...');
       this.workspaceManager.loadState();
       console.log('BlocksManager: State loaded.');
       
       // Return true to indicate the workspace is ready
       return true;
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
