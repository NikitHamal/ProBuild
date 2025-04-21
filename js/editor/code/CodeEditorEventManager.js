class CodeEditorEventManager {
  constructor(codeManager) {
    this.codeManager = codeManager;
    this.editorView = codeManager.editorView;
    this.isCtrlPressed = false; // Track Ctrl key state for shortcuts
  }

  setupAllEventListeners() {
    this.setupToolbarListeners();
    this.setupKeyboardShortcuts();
    // Editor specific listeners will be setup when the editor is initialized
  }

  setupToolbarListeners() {
    // Toggle Sidebar button
    document.getElementById('toggle-sidebar-btn')?.addEventListener('click', 
      () => this.codeManager.uiManager.toggleSidebar());
    
    // Format button
    document.getElementById('code-format-btn')?.addEventListener('click', 
      () => this.codeManager.formatCode());
    
    // Undo button
    document.getElementById('code-undo-btn')?.addEventListener('click', 
      () => this.codeManager.historyManager.undoChange());
    
    // Redo button
    document.getElementById('code-redo-btn')?.addEventListener('click', 
      () => this.codeManager.historyManager.redoChange());
    
    // Search functionality
    const searchInput = document.getElementById('code-search-input');
    document.getElementById('code-search-btn')?.addEventListener('click', 
      () => {
          this.codeManager.searchManager.searchInCode(searchInput.value);
          this.codeManager.uiManager.updateSearchButtonStates();
      });
      
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.codeManager.searchManager.searchInCode(searchInput.value);
        this.codeManager.uiManager.updateSearchButtonStates();
      }
    });
    
    document.getElementById('code-search-next-btn')?.addEventListener('click', 
      () => this.codeManager.searchManager.searchNext());
      
    document.getElementById('code-search-prev-btn')?.addEventListener('click', 
      () => this.codeManager.searchManager.searchPrev());
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (this.editorView.activeTab !== 'code') return;
      
      if (e.key === 'Control') this.isCtrlPressed = true;
      
      // Ctrl+Z (Undo)
      if (this.isCtrlPressed && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.codeManager.historyManager.undoChange();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z (Redo)
      if (this.isCtrlPressed && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        this.codeManager.historyManager.redoChange();
      }
      
      // Ctrl+F (Search)
      if (this.isCtrlPressed && e.key === 'f') {
        e.preventDefault();
        document.getElementById('code-search-input')?.focus();
      }
      
      // F3 (Next search)
      if (e.key === 'F3' && !e.shiftKey) { // Check !e.shiftKey
        e.preventDefault();
        this.codeManager.searchManager.searchNext();
      }
      
      // Shift+F3 (Previous search)
      if (e.shiftKey && e.key === 'F3') {
        e.preventDefault();
        this.codeManager.searchManager.searchPrev();
      }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control') this.isCtrlPressed = false;
    });
    
    // Reset Ctrl state if window loses focus
    window.addEventListener('blur', () => {
        this.isCtrlPressed = false;
    });
  }
  
  setupEditorEventListeners(textarea) {
     if (!textarea) return;
     
     textarea.addEventListener('input', () => {
      // Use requestAnimationFrame to ensure history save happens before content update
      requestAnimationFrame(() => {
          this.codeManager.historyManager.saveToHistory();
          // Update content in file manager
          this.codeManager.fileManager.updateFileContent(
              this.codeManager.activeFile, 
              textarea.value
          ); 
          this.codeManager.uiManager.updateStatusBar();
      });
    });
    
    textarea.addEventListener('click', () => {
      this.codeManager.uiManager.updateStatusBar();
    });
    
    textarea.addEventListener('keyup', () => {
      this.codeManager.uiManager.updateStatusBar();
    });
  }
  
  // Add any necessary cleanup methods if needed, e.g., removeEventListeners
  cleanup() {
      // TODO: Remove listeners if the code editor tab is destroyed
  }
}

export default CodeEditorEventManager; 