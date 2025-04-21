import NotificationManager from '../utils/NotificationManager.js';

class CodeHistoryManager {
  constructor(codeManager) {
    this.codeManager = codeManager; // Reference to the main manager
    this.notificationManager = new NotificationManager();
    this.fileHistory = {
      undo: {},
      redo: {}
    };
  }

  saveToHistory() {
    const activeFile = this.codeManager.activeFile;
    const editorInstance = this.codeManager.editorInstance;
    
    if (!activeFile || !editorInstance) return;
    
    if (!this.fileHistory.undo[activeFile]) {
      this.fileHistory.undo[activeFile] = [];
    }
    
    this.fileHistory.undo[activeFile].push(editorInstance.value);
    this.fileHistory.redo[activeFile] = []; // Clear redo on new change
    
    this.updateUndoRedoButtons();
    
    // Limit history size
    if (this.fileHistory.undo[activeFile].length > 50) {
      this.fileHistory.undo[activeFile].shift();
    }
  }

  undoChange() {
    const activeFile = this.codeManager.activeFile;
    const editorInstance = this.codeManager.editorInstance;
    
    if (!activeFile || !editorInstance) return;
    
    if (!this.fileHistory.undo[activeFile] || this.fileHistory.undo[activeFile].length === 0) {
      return;
    }
    
    if (!this.fileHistory.redo[activeFile]) {
      this.fileHistory.redo[activeFile] = [];
    }
    
    this.fileHistory.redo[activeFile].push(editorInstance.value);
    const previousState = this.fileHistory.undo[activeFile].pop();
    
    editorInstance.value = previousState;
    // Ensure fileContents exists before assignment
    if (typeof this.codeManager.fileContents === 'object' && this.codeManager.fileContents !== null) {
      this.codeManager.fileContents[activeFile] = previousState; // Update main manager's content
    } else {
      console.error("CodeHistoryManager: codeManager.fileContents is not an object during undo!");
      // Optionally re-initialize or handle error
    }
    
    this.updateUndoRedoButtons();
    this.notificationManager.showNotification('Undo successful', 'info', 1000);
    this.codeManager.triggerAutoSave(); // Trigger save in main manager
  }

  redoChange() {
    const activeFile = this.codeManager.activeFile;
    const editorInstance = this.codeManager.editorInstance;

    if (!activeFile || !editorInstance) return;

    if (!this.fileHistory.redo[activeFile] || this.fileHistory.redo[activeFile].length === 0) {
      return;
    }
    
    if (!this.fileHistory.undo[activeFile]) {
      this.fileHistory.undo[activeFile] = [];
    }

    this.fileHistory.undo[activeFile].push(editorInstance.value);
    const nextState = this.fileHistory.redo[activeFile].pop();

    editorInstance.value = nextState;
    // Ensure fileContents exists before assignment
    if (typeof this.codeManager.fileContents === 'object' && this.codeManager.fileContents !== null) {
        this.codeManager.fileContents[activeFile] = nextState; // Update main manager's content
    } else {
        console.error("CodeHistoryManager: codeManager.fileContents is not an object during redo!");
        // Optionally re-initialize or handle error
    }

    this.updateUndoRedoButtons();
    this.notificationManager.showNotification('Redo successful', 'info', 1000);
    this.codeManager.triggerAutoSave(); // Trigger save in main manager
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('code-undo-btn');
    const redoBtn = document.getElementById('code-redo-btn');
    const activeFile = this.codeManager.activeFile;

    if (undoBtn) {
      undoBtn.disabled = !(this.fileHistory.undo[activeFile]?.length > 0);
    }
    
    if (redoBtn) {
      redoBtn.disabled = !(this.fileHistory.redo[activeFile]?.length > 0);
    }
  }
  
  clearHistoryForFile(fileId) {
      this.fileHistory.undo[fileId] = [];
      this.fileHistory.redo[fileId] = [];
  }
  
  clearAllHistory() {
       this.fileHistory = {
        undo: {},
        redo: {}
      };
  }
}

export default CodeHistoryManager; 