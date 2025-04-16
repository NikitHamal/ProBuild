class BlocksUndoManager {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.undoStack = [];
    this.redoStack = [];
    this.workspaceManager = blocksManager.workspaceManager;
    this.notificationManager = blocksManager.notificationManager;
  }
  
  addToUndoStack() {
    // Save current state to undo stack
    if (this.blocksManager.blocksWorkspace) {
      const currentState = this.blocksManager.blocksWorkspace.innerHTML;
      this.undoStack.push(currentState);
      
      // Clear redo stack when a new action is performed
      this.redoStack = [];
      
      // Update buttons state
      this.updateUndoRedoButtons();
    }
  }
  
  undoAction() {
    if (this.undoStack.length === 0) return;
    
    // Get last state from undo stack
    const prevState = this.undoStack.pop();
    
    // Save current state to redo stack
    if (this.blocksManager.blocksWorkspace) {
      const currentState = this.blocksManager.blocksWorkspace.innerHTML;
      this.redoStack.push(currentState);
      
      // Restore previous state
      this.blocksManager.blocksWorkspace.innerHTML = prevState;
      
      // Enable/disable buttons
      this.updateUndoRedoButtons();
      
      // Reinitialize workspace events
      this.workspaceManager.initializeWorkspace();
    }
    
    this.notificationManager.showNotification('Undo action', 'info');
  }
  
  redoAction() {
    if (this.redoStack.length === 0) return;
    
    // Get last state from redo stack
    const nextState = this.redoStack.pop();
    
    // Save current state to undo stack
    if (this.blocksManager.blocksWorkspace) {
      const currentState = this.blocksManager.blocksWorkspace.innerHTML;
      this.undoStack.push(currentState);
      
      // Restore next state
      this.blocksManager.blocksWorkspace.innerHTML = nextState;
      
      // Enable/disable buttons
      this.updateUndoRedoButtons();
      
      // Reinitialize workspace events
      this.workspaceManager.initializeWorkspace();
    }
    
    this.notificationManager.showNotification('Redo action', 'info');
  }
  
  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('blocks-undo-btn');
    const redoBtn = document.getElementById('blocks-redo-btn');
    
    if (undoBtn) {
      if (this.undoStack.length === 0) {
        undoBtn.setAttribute('disabled', '');
      } else {
        undoBtn.removeAttribute('disabled');
      }
    }
    
    if (redoBtn) {
      if (this.redoStack.length === 0) {
        redoBtn.setAttribute('disabled', '');
      } else {
        redoBtn.removeAttribute('disabled');
      }
    }
  }
  
  clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateUndoRedoButtons();
  }
  
  canUndo() {
    return this.undoStack.length > 0;
  }
  
  canRedo() {
    return this.redoStack.length > 0;
  }
}

export default BlocksUndoManager; 