import BlocksRenderer from './BlocksRenderer.js';
import BlocksCategories from './BlocksCategories.js';
import BlocksToolbox from './BlocksToolbox.js';
import BlockFactory from './BlockFactory.js';
import WorkspaceManager from './WorkspaceManager.js';
import NotificationManager from '../utils/NotificationManager.js';
import BlocksCodeGenerator from './BlocksCodeGenerator.js';
import BlocksUndoManager from './BlocksUndoManager.js';
import BlocksViewport from './BlocksViewport.js';
import BlocksSerializer from './BlocksSerializer.js';

class BlocksManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.currentApp = editorView.currentApp;
    this.currentScreen = editorView.currentScreen;
    this.blocksWorkspace = null;
    this.notificationManager = new NotificationManager();
    this.scale = 1.0;
    
    // Initialize components
    this.blockCategories = new BlocksCategories(this);
    this.blocksRenderer = new BlocksRenderer(this);
    this.blocksToolbox = new BlocksToolbox(this);
    this.blockFactory = new BlockFactory(this);
    this.workspaceManager = new WorkspaceManager(this);
    
    // Initialize refactored modules
    this.codeGenerator = new BlocksCodeGenerator(this);
    this.undoManager = new BlocksUndoManager(this);
    this.viewport = new BlocksViewport(this);
    this.serializer = new BlocksSerializer(this);
  }
  
  renderBlocksTab() {
    // Get screen logic blocks if any
    const screenBlocks = this.serializer.getScreenBlocks(this.currentScreen.id);
    
    return `
      <div class="blocks-editor">
        <div class="blocks-toolbar">
          <div class="blocks-toolbar-actions">
            <button class="blocks-toolbar-btn" id="blocks-run-btn" title="Run the blocks code">
              <i class="material-icons">play_arrow</i>
              <span>Run</span>
            </button>
            <button class="blocks-toolbar-btn" id="blocks-save-btn" title="Save blocks">
              <i class="material-icons">save</i>
              <span>Save</span>
            </button>
            <button class="blocks-toolbar-btn" id="blocks-undo-btn" title="Undo the last action" ${this.undoManager.canUndo() ? '' : 'disabled'}>
              <i class="material-icons">undo</i>
              <span>Undo</span>
            </button>
            <button class="blocks-toolbar-btn" id="blocks-redo-btn" title="Redo the last undone action" ${this.undoManager.canRedo() ? '' : 'disabled'}>
              <i class="material-icons">redo</i>
              <span>Redo</span>
            </button>
            <button class="blocks-toolbar-btn" id="blocks-zoom-in-btn" title="Zoom in">
              <i class="material-icons">zoom_in</i>
            </button>
            <button class="blocks-toolbar-btn" id="blocks-zoom-out-btn" title="Zoom out">
              <i class="material-icons">zoom_out</i>
            </button>
            <button class="blocks-toolbar-btn" id="blocks-center-btn" title="Center workspace">
              <i class="material-icons">center_focus_strong</i>
            </button>
            <div class="blocks-zoom-level">${Math.round(this.viewport.getZoomLevel() * 100)}%</div>
          </div>
          <div class="blocks-search">
            <input type="text" id="blocks-search-input" placeholder="Search blocks...">
            <i class="material-icons">search</i>
          </div>
        </div>
        <div class="blocks-main">
          <div class="blocks-categories">
            ${this.blockCategories.render()}
          </div>
          <div class="blocks-workspace" id="blocks-workspace">
            ${this.blocksRenderer.renderCanvas(screenBlocks)}
          </div>
          <div class="blocks-toolbox">
            ${this.blocksToolbox.render()}
          </div>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Toolbar buttons
    const runBtn = document.getElementById('blocks-run-btn');
    const saveBtn = document.getElementById('blocks-save-btn');
    const undoBtn = document.getElementById('blocks-undo-btn');
    const redoBtn = document.getElementById('blocks-redo-btn');
    const zoomInBtn = document.getElementById('blocks-zoom-in-btn');
    const zoomOutBtn = document.getElementById('blocks-zoom-out-btn');
    const centerBtn = document.getElementById('blocks-center-btn');
    const searchInput = document.getElementById('blocks-search-input');
    
    if (runBtn) runBtn.addEventListener('click', () => this.runBlocks());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveBlocks());
    if (undoBtn) undoBtn.addEventListener('click', () => this.undoManager.undoAction());
    if (redoBtn) redoBtn.addEventListener('click', () => this.undoManager.redoAction());
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.viewport.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.viewport.zoomOut());
    if (centerBtn) centerBtn.addEventListener('click', () => this.viewport.centerWorkspace());
    
    // Handle search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchBlocks(e.target.value);
      });
    }
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle if blocks tab is active
      if (this.editorView.activeTab !== 'blocks') return;
      
      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undoManager.undoAction();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        this.undoManager.redoAction();
      }
      
      // Ctrl+S for save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveBlocks();
      }
      
      // Delete key for deleting selected blocks
      if (e.key === 'Delete') {
        this.deleteSelectedBlocks();
      }
    });
    
    // Set up category and toolbox events
    this.blockCategories.setupEventListeners();
    this.blocksToolbox.setupEventListeners();
    
    // Set up the block workspace events
    this.setupWorkspaceEvents();
  }
  
  setupWorkspaceEvents() {
    this.blocksWorkspace = document.getElementById('blocks-workspace');
    if (!this.blocksWorkspace) return;
    
    // Add trash area for deleting blocks
    const trashArea = document.createElement('div');
    trashArea.className = 'blocks-trash-area';
    trashArea.innerHTML = '<i class="material-icons">delete</i>';
    this.blocksWorkspace.appendChild(trashArea);
    
    // Initialize drag and drop, block connections, etc.
    this.workspaceManager.initializeWorkspace();
  }
  
  searchBlocks(query) {
    if (!query) {
      // Reset search
      document.querySelectorAll('.blocks-toolbox .block').forEach(block => {
        block.style.display = '';
      });
      return;
    }
    
    query = query.toLowerCase();
    
    // Search in both toolbox and workspace
    document.querySelectorAll('.blocks-toolbox .block').forEach(block => {
      const blockText = block.textContent.toLowerCase();
      if (blockText.includes(query)) {
        block.style.display = '';
      } else {
        block.style.display = 'none';
      }
    });
    
    // Highlight matching blocks in workspace
    document.querySelectorAll('.blocks-workspace .block').forEach(block => {
      const blockText = block.textContent.toLowerCase();
      if (blockText.includes(query)) {
        block.classList.add('search-highlight');
      } else {
        block.classList.remove('search-highlight');
      }
    });
  }
  
  deleteSelectedBlocks() {
    const selectedBlocks = document.querySelectorAll('.block.selected');
    if (selectedBlocks.length === 0) return;
    
    // Store state for undo
    this.undoManager.addToUndoStack();
    
    selectedBlocks.forEach(block => {
      // Disconnect the block from any connected blocks
      this.disconnectBlock(block);
      
      // Remove from DOM
      block.remove();
    });
    
    // Show notification
    this.notificationManager.showNotification(`Deleted ${selectedBlocks.length} block(s)`, 'info');
  }
  
  disconnectBlock(block) {
    if (!block) return;
    
    const blockId = block.dataset.blockId;
    
    // Find all connections this block has
    const connections = block.querySelectorAll('.block-connection');
    
    // For each connection, find the connected block and remove the connection
    connections.forEach(connection => {
      const connectedToId = connection.dataset.connectedTo;
      if (connectedToId) {
        // Find the connected block
        const connectedBlock = document.querySelector(`.block[data-block-id="${connectedToId}"]`);
        if (connectedBlock) {
          // Find the connection in the connected block
          const connectedConnection = connectedBlock.querySelector(`.block-connection[data-connected-to="${blockId}"]`);
          if (connectedConnection) {
            // Remove the connection
            connectedConnection.dataset.connectedTo = '';
            connectedConnection.classList.remove('connected');
          }
        }
        
        // Clear this connection too
        connection.dataset.connectedTo = '';
        connection.classList.remove('connected');
      }
    });
    
    // Find all connections to this block and remove them
    document.querySelectorAll(`.block-connection[data-connected-to="${blockId}"]`).forEach(conn => {
      conn.dataset.connectedTo = '';
      conn.classList.remove('connected');
    });
  }
  
  refreshConnections() {
    // Update all connections in the workspace
    // This helps fix any inconsistencies that might have happened during duplication
    const blocks = this.blocksWorkspace.querySelectorAll('.block');
    
    blocks.forEach(block => {
      const connections = block.querySelectorAll('.block-connection');
      
      connections.forEach(connection => {
        const connectedToId = connection.dataset.connectedTo;
        
        if (connectedToId) {
          // Check if the connected block exists
          const connectedBlock = document.querySelector(`.block[data-block-id="${connectedToId}"]`);
          
          if (!connectedBlock) {
            // The connected block doesn't exist, so clear this connection
            connection.dataset.connectedTo = '';
            connection.classList.remove('connected');
          }
        }
      });
    });
  }
  
  deselectAllBlocks() {
    const selectedBlocks = document.querySelectorAll('.block.selected');
    selectedBlocks.forEach(block => block.classList.remove('selected'));
  }
  
  saveBlocks() {
    // Save current state before saving
    this.undoManager.addToUndoStack();
    
    // Save blocks using serializer
    const blocks = this.serializer.saveBlocks();
    
    this.notificationManager.showNotification('Blocks saved successfully', 'success');
    
    return blocks;
  }
  
  runBlocks() {
    // Save blocks before running
    this.saveBlocks();
    
    // Generate code and show in dialog
    this.codeGenerator.showGeneratedCode();
    
    this.notificationManager.showNotification('Running blocks...', 'info');
  }
  
  changeScreen(screenId) {
    // Update current screen and refresh the blocks
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (screen) {
      this.currentScreen = screen;
      
      // Clear undo/redo stacks
      this.undoManager.clearHistory();
      
      // Reset zoom
      this.viewport.resetZoom();
      
      // Refresh blocks for the new screen
      const blocks = this.serializer.getScreenBlocks(screenId);
      this.refreshBlocks(blocks);
    }
  }
  
  refreshBlocks(blocks) {
    // Update the workspace with the new blocks
    if (this.blocksWorkspace) {
      this.blocksWorkspace.innerHTML = this.blocksRenderer.renderCanvas(blocks);
      
      // Reset zoom and center
      this.viewport.applyZoom();
      
      // Initialize workspace events
      this.workspaceManager.initializeWorkspace();
    }
  }
  
  addBlock(blockType, position) {
    // Create a new block and add it to the workspace
    const block = this.blockFactory.createBlock(blockType);
    
    if (block && this.blocksWorkspace) {
      // Save state for undo
      this.undoManager.addToUndoStack();
      
      // Add the block to the workspace
      block.style.left = `${position.x}px`;
      block.style.top = `${position.y}px`;
      this.blocksWorkspace.appendChild(block);
      
      // Setup block interactions
      this.workspaceManager.setupBlockInteractions(block);
      
      return block;
    }
    
    return null;
  }
}

export default BlocksManager; 