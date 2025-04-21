import NotificationManager from '../utils/NotificationManager.js';

class CodeEditorUIManager {
  constructor(codeManager) {
    this.codeManager = codeManager;
    this.editorView = codeManager.editorView;
    this.notificationManager = new NotificationManager();
    this.editorInstance = null;
    this.isSidebarCollapsed = false; // Initial state
  }

  renderCodeTabContent() {
    // Load CSS if needed
    this.loadCodeEditorCSS();
    this.loadSidebarCSS(); // Load sidebar specific CSS
    
    // Overall layout container
    return `
      <div class="code-editor-layout">
        ${this.renderFileSidebar()} 
        <div class="code-editor-main">
          <div class="code-toolbar">
             <button id="toggle-sidebar-btn" title="Toggle File Explorer">
               <i class="material-icons">menu</i>
             </button>
            <div class="code-toolbar-actions">
              <button class="code-toolbar-btn" id="code-format-btn" title="Format code">
                <i class="material-icons">format_align_left</i>
                <span>Format</span>
              </button>
              <button class="code-toolbar-btn" id="code-undo-btn" title="Undo" disabled>
                <i class="material-icons">undo</i>
              </button>
              <button class="code-toolbar-btn" id="code-redo-btn" title="Redo" disabled>
                <i class="material-icons">redo</i>
              </button>
              <div class="code-search">
                <input type="text" id="code-search-input" placeholder="Search...">
                <button id="code-search-btn" title="Search">
                  <i class="material-icons">search</i>
                </button>
                <button id="code-search-next-btn" title="Next match" disabled>
                  <i class="material-icons">arrow_downward</i>
                </button>
                <button id="code-search-prev-btn" title="Previous match" disabled>
                  <i class="material-icons">arrow_upward</i>
                </button>
              </div>
            </div>
          </div>
          <div class="code-editor-container" id="code-editor-container">
            ${this.renderCodeEditorPlaceholder()}
          </div>
          <div class="code-status-bar">
            <span class="code-status-position">Line: 1, Col: 1</span>
            <span class="code-status-file-type">${this.codeManager.fileManager.getFileExtension(this.codeManager.activeFile)}</span>
            <span class="code-status-encoding">UTF-8</span>
          </div>
        </div>
      </div>
    `;
  }
  
  loadCodeEditorCSS() {
    if (!document.getElementById('code-editor-css')) {
      const link = document.createElement('link');
      link.id = 'code-editor-css';
      link.rel = 'stylesheet';
      link.href = 'css/code-editor-improved.css';
      document.head.appendChild(link);
    }
  }
  
  loadSidebarCSS() {
    if (!document.getElementById('code-sidebar-css')) {
      const link = document.createElement('link');
      link.id = 'code-sidebar-css';
      link.rel = 'stylesheet';
      link.href = 'css/code-editor-sidebar.css'; // Load the new CSS
      document.head.appendChild(link);
    }
  }
  
  renderFileSidebar() {
    const files = this.codeManager.fileManager.getFilesList();
    const activeFile = this.codeManager.activeFile;
    const dirtyFiles = this.codeManager.fileManager.dirtyFiles;
    
    const fileItemsHtml = files.map(file => {
      const isDirty = dirtyFiles.has(file.id);
      const dirtyIndicator = isDirty ? '<span class="dirty-indicator" title="Unsaved changes">*</span>' : '';
      return `
        <li class="file-list-item ${file.id === activeFile ? 'active' : ''}" data-file-id="${file.id}" title="${file.name}">
          <span>${file.name}</span>${dirtyIndicator}
        </li>
      `;
    }).join('');

    return `
        <div class="code-sidebar ${this.isSidebarCollapsed ? 'collapsed' : ''}" id="code-sidebar">
            <div class="code-sidebar-header">Files</div>
            <ul class="file-list">
              ${fileItemsHtml}
            </ul>
        </div>
    `;
  }

  refreshFileSidebarUI() {
    const sidebar = document.getElementById('code-sidebar');
    if (sidebar) {
        // More efficient update: only update the file list, not the whole sidebar
        const fileListElement = sidebar.querySelector('.file-list');
        if(fileListElement) {
            const files = this.codeManager.fileManager.getFilesList();
            const activeFile = this.codeManager.activeFile;
            const dirtyFiles = this.codeManager.fileManager.dirtyFiles;
            
            fileListElement.innerHTML = files.map(file => {
              const isDirty = dirtyFiles.has(file.id);
              const dirtyIndicator = isDirty ? '<span class="dirty-indicator" title="Unsaved changes">*</span>' : '';
              return `
                <li class="file-list-item ${file.id === activeFile ? 'active' : ''}" data-file-id="${file.id}" title="${file.name}">
                  <span>${file.name}</span>${dirtyIndicator}
                </li>
              `;
            }).join('');
            
            // Re-attach listeners to the new list items
            this.attachSidebarFileListeners(fileListElement);
        }
    }
  }

  attachSidebarFileListeners(container) {
    container.querySelectorAll('.file-list-item').forEach(item => {
      item.addEventListener('click', (event) => {
        const fileId = event.currentTarget.dataset.fileId;
        if (fileId) {
          this.codeManager.switchToFile(fileId);
        }
      });
    });
  }
  
  toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      const sidebar = document.getElementById('code-sidebar');
      if (sidebar) {
          sidebar.classList.toggle('collapsed', this.isSidebarCollapsed);
      }
      // Optional: trigger resize/reflow for editor if needed
  }

  renderCodeEditorPlaceholder() {
    return `<div class="code-editor-placeholder">Loading code editor...</div>`;
  }
  
  initCodeEditor() {
    const editorContainer = document.getElementById('code-editor-container');
    if (!editorContainer) return;
    
    const textarea = document.createElement('textarea');
    textarea.id = 'code-editor-textarea';
    textarea.className = 'code-editor-textarea'; // CSS will handle padding
    textarea.value = this.codeManager.fileManager.getActiveFileContent();
    textarea.spellcheck = false;
    
    editorContainer.innerHTML = ''; // Clear placeholder
    editorContainer.appendChild(textarea);
    
    this.editorInstance = textarea; // Store reference
    this.codeManager.editorInstance = textarea; // Link back to main manager

    // Listeners are attached in CodeManager.initializeEditorAndListeners
    
    textarea.focus();
    this.updateStatusBar();
    this.applySyntaxHighlighting();
  }
  
  updateEditorContent() {
    if (this.editorInstance) {
        this.editorInstance.value = this.codeManager.fileManager.getActiveFileContent();
        this.updateStatusBar();
        this.applySyntaxHighlighting();
    }
  }

  updateStatusBar() {
    const statusPosition = document.querySelector('.code-status-position');
    const statusFileType = document.querySelector('.code-status-file-type');
    const textarea = this.editorInstance;
    
    if (!statusPosition || !statusFileType || !textarea) return;
    
    const content = textarea.value;
    const position = textarea.selectionStart;
    const lines = content.substr(0, position).split('\n');
    const lineNumber = lines.length;
    const colNumber = lines[lines.length - 1].length + 1;
    
    statusPosition.textContent = `Line: ${lineNumber}, Col: ${colNumber}`;
    statusFileType.textContent = this.codeManager.fileManager.getFileExtension(this.codeManager.activeFile);
  }

  applySyntaxHighlighting() {
    // Syntax highlighting removed as requested
    // const fileExt = this.codeManager.fileManager.getFileExtension(this.codeManager.activeFile);
    // console.log(`Applying ${fileExt} syntax highlighting (simulated).`); 
  }
  
  updateSearchButtonStates() {
      const searchNextBtn = document.getElementById('code-search-next-btn');
      const searchPrevBtn = document.getElementById('code-search-prev-btn');
      const hasMatches = this.codeManager.searchManager.searchResults.matches.length > 0;
      
      if(searchNextBtn) searchNextBtn.disabled = !hasMatches;
      if(searchPrevBtn) searchPrevBtn.disabled = !hasMatches;
  }
}

export default CodeEditorUIManager; 