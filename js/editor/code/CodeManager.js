import CodeGenerator from './CodeGenerator.js';
import NotificationManager from '../utils/NotificationManager.js';
import CodeFormatter from './CodeFormatter.js';

class CodeManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.currentApp = editorView.currentApp;
    this.currentScreen = editorView.currentScreen;
    this.codeGenerator = new CodeGenerator(this);
    this.codeFormatter = new CodeFormatter();
    this.notificationManager = new NotificationManager();
    this.activeFile = 'main';
    this.fileContents = {};
    this.editorInstance = null;
    this.fileHistory = {
      undo: {},
      redo: {}
    };
    this.searchResults = {
      query: '',
      matches: [],
      currentIndex: -1
    };
    this.dirtyFiles = new Set(); // Keep track of files modified by property changes
  }
  
  renderCodeTab() {
    // Generate the code files for the current screen
    this.generateCode();
    
    // Load CSS file for code editor
    this.loadCodeEditorCSS();
    
    return `
      <div class="code-editor">
        <div class="code-toolbar">
          <div class="code-file-tabs">
            ${this.renderFileTabs()}
          </div>
          <div class="code-toolbar-actions">
            <button class="code-toolbar-btn" id="code-run-btn" title="Run the generated code">
              <i class="material-icons">play_arrow</i>
              <span>Run</span>
            </button>
            <button class="code-toolbar-btn" id="code-save-btn" title="Save changes">
              <i class="material-icons">save</i>
              <span>Save</span>
            </button>
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
              <button id="code-search-next-btn" title="Next match">
                <i class="material-icons">arrow_downward</i>
              </button>
              <button id="code-search-prev-btn" title="Previous match">
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
          <span class="code-status-file-type">${this.getFileExtension(this.activeFile)}</span>
          <span class="code-status-encoding">UTF-8</span>
        </div>
      </div>
    `;
  }
  
  loadCodeEditorCSS() {
    // Check if the CSS is already loaded
    if (!document.getElementById('code-editor-css')) {
      const link = document.createElement('link');
      link.id = 'code-editor-css';
      link.rel = 'stylesheet';
      link.href = 'css/code-editor-improved.css';
      document.head.appendChild(link);
    }
  }
  
  setupEventListeners() {
    // Set up tab switching
    document.querySelectorAll('.code-file-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const fileId = tab.dataset.fileId;
        this.switchToFile(fileId);
      });
    });
    
    // Run button
    const runBtn = document.getElementById('code-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCode());
    }
    
    // Save button
    const saveBtn = document.getElementById('code-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCode());
    }
    
    // Format button
    const formatBtn = document.getElementById('code-format-btn');
    if (formatBtn) {
      formatBtn.addEventListener('click', () => this.formatCode());
    }
    
    // Undo button
    const undoBtn = document.getElementById('code-undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undoChange());
    }
    
    // Redo button
    const redoBtn = document.getElementById('code-redo-btn');
    if (redoBtn) {
      redoBtn.addEventListener('click', () => this.redoChange());
    }
    
    // Search functionality
    const searchInput = document.getElementById('code-search-input');
    const searchBtn = document.getElementById('code-search-btn');
    const searchNextBtn = document.getElementById('code-search-next-btn');
    const searchPrevBtn = document.getElementById('code-search-prev-btn');
    
    if (searchInput && searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.searchInCode(searchInput.value);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchInCode(searchInput.value);
        }
      });
    }
    
    if (searchNextBtn) {
      searchNextBtn.addEventListener('click', () => {
        this.searchNext();
      });
    }
    
    if (searchPrevBtn) {
      searchPrevBtn.addEventListener('click', () => {
        this.searchPrev();
      });
    }
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle if code tab is active
      if (this.editorView.activeTab !== 'code') return;
      
      // Ctrl+S for save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveCode();
      }
      
      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undoChange();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        this.redoChange();
      }
      
      // Ctrl+F for search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('code-search-input')?.focus();
      }
      
      // F3 for next search match
      if (e.key === 'F3') {
        e.preventDefault();
        this.searchNext();
      }
      
      // Shift+F3 for previous search match
      if (e.shiftKey && e.key === 'F3') {
        e.preventDefault();
        this.searchPrev();
      }
    });
    
    // Initialize code editor
    this.initCodeEditor();
  }
  
  initCodeEditor() {
    // In a real implementation, we would initialize a code editor like CodeMirror or Monaco
    // For now, we'll use a simple textarea with enhanced features
    const editorContainer = document.getElementById('code-editor-container');
    if (!editorContainer) return;
    
    const textarea = document.createElement('textarea');
    textarea.id = 'code-editor-textarea';
    textarea.className = 'code-editor-textarea';
    textarea.value = this.getActiveFileContent();
    textarea.spellcheck = false;
    
    editorContainer.innerHTML = '';
    editorContainer.appendChild(textarea);
    
    // Set up textarea events
    textarea.addEventListener('input', () => {
      // Save to undo history before updating
      this.saveToHistory();
      
      // Update content
      this.fileContents[this.activeFile] = textarea.value;
      
      // Update status bar
      this.updateStatusBar(textarea);
    });
    
    // Track cursor position for status bar
    textarea.addEventListener('click', () => {
      this.updateStatusBar(textarea);
    });
    
    textarea.addEventListener('keyup', () => {
      this.updateStatusBar(textarea);
    });
    
    // Focus the textarea
    textarea.focus();
    
    // Store reference
    this.editorInstance = textarea;
    
    // Update status bar initially
    this.updateStatusBar(textarea);
    
    // Apply syntax highlighting (simulated)
    this.applySyntaxHighlighting();
  }
  
  updateStatusBar(textarea) {
    const statusPosition = document.querySelector('.code-status-position');
    if (!statusPosition || !textarea) return;
    
    // Calculate line and column
    const content = textarea.value;
    const position = textarea.selectionStart;
    
    // Count lines up to position
    const lines = content.substr(0, position).split('\n');
    const lineNumber = lines.length;
    const colNumber = lines[lines.length - 1].length + 1;
    
    statusPosition.textContent = `Line: ${lineNumber}, Col: ${colNumber}`;
  }
  
  applySyntaxHighlighting() {
    // In a real implementation, this would use a library for syntax highlighting
    // For now, we'll just simulate it with a notification
    const fileExt = this.getFileExtension(this.activeFile);
    this.notificationManager.showNotification(`Applied ${fileExt} syntax highlighting`, 'info', 1000);
  }
  
  getFileExtension(fileId) {
    switch (fileId) {
      case 'main':
      case 'java':
        return 'Java';
      case 'layout':
      case 'strings':
      case 'colors':
      case 'manifest':
        return 'XML';
      case 'gradle':
        return 'Gradle';
      default:
        return 'Text';
    }
  }
  
  saveToHistory() {
    // Only save if we have an active file and editor
    if (!this.activeFile || !this.editorInstance) return;
    
    // Initialize array for this file if not exists
    if (!this.fileHistory.undo[this.activeFile]) {
      this.fileHistory.undo[this.activeFile] = [];
    }
    
    // Save current content to undo history
    this.fileHistory.undo[this.activeFile].push(this.editorInstance.value);
    
    // Clear redo history for this file when a new change is made
    this.fileHistory.redo[this.activeFile] = [];
    
    // Update button states
    this.updateUndoRedoButtons();
    
    // Limit history size
    if (this.fileHistory.undo[this.activeFile].length > 50) {
      this.fileHistory.undo[this.activeFile].shift();
    }
  }
  
  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('code-undo-btn');
    const redoBtn = document.getElementById('code-redo-btn');
    
    if (undoBtn) {
      if (this.fileHistory.undo[this.activeFile]?.length > 0) {
        undoBtn.removeAttribute('disabled');
      } else {
        undoBtn.setAttribute('disabled', '');
      }
    }
    
    if (redoBtn) {
      if (this.fileHistory.redo[this.activeFile]?.length > 0) {
        redoBtn.removeAttribute('disabled');
      } else {
        redoBtn.setAttribute('disabled', '');
      }
    }
  }
  
  undoChange() {
    if (!this.activeFile || !this.editorInstance) return;
    
    // Check if we have history
    if (!this.fileHistory.undo[this.activeFile] || this.fileHistory.undo[this.activeFile].length === 0) {
      return;
    }
    
    // Initialize redo array if not exists
    if (!this.fileHistory.redo[this.activeFile]) {
      this.fileHistory.redo[this.activeFile] = [];
    }
    
    // Save current state to redo history
    this.fileHistory.redo[this.activeFile].push(this.editorInstance.value);
    
    // Get previous state
    const previousState = this.fileHistory.undo[this.activeFile].pop();
    
    // Restore previous state
    this.editorInstance.value = previousState;
    this.fileContents[this.activeFile] = previousState;
    
    // Update button states
    this.updateUndoRedoButtons();
    
    this.notificationManager.showNotification('Undo successful', 'info', 1000);
  }
  
  redoChange() {
    if (!this.activeFile || !this.editorInstance) return;
    
    // Check if we have redo history
    if (!this.fileHistory.redo[this.activeFile] || this.fileHistory.redo[this.activeFile].length === 0) {
      return;
    }
    
    // Initialize undo array if not exists
    if (!this.fileHistory.undo[this.activeFile]) {
      this.fileHistory.undo[this.activeFile] = [];
    }
    
    // Save current state to undo history
    this.fileHistory.undo[this.activeFile].push(this.editorInstance.value);
    
    // Get next state
    const nextState = this.fileHistory.redo[this.activeFile].pop();
    
    // Restore next state
    this.editorInstance.value = nextState;
    this.fileContents[this.activeFile] = nextState;
    
    // Update button states
    this.updateUndoRedoButtons();
    
    this.notificationManager.showNotification('Redo successful', 'info', 1000);
  }
  
  searchInCode(query) {
    if (!query || !this.editorInstance) return;
    
    const content = this.editorInstance.value;
    
    // Reset search results
    this.searchResults = {
      query,
      matches: [],
      currentIndex: -1
    };
    
    // Find all matches
    let matchIndex = content.indexOf(query);
    while (matchIndex !== -1) {
      this.searchResults.matches.push(matchIndex);
      matchIndex = content.indexOf(query, matchIndex + 1);
    }
    
    if (this.searchResults.matches.length === 0) {
      this.notificationManager.showNotification(`No matches found for "${query}"`, 'info');
      return;
    }
    
    // Set first match as current
    this.searchResults.currentIndex = 0;
    const firstMatch = this.searchResults.matches[0];
    
    // Set selection to match
    this.editorInstance.focus();
    this.editorInstance.setSelectionRange(firstMatch, firstMatch + query.length);
    
    // Scroll to match if needed
    this.scrollToSelection();
    
    // Notify user
    this.notificationManager.showNotification(
      `Found ${this.searchResults.matches.length} match${this.searchResults.matches.length !== 1 ? 'es' : ''}`, 
      'info'
    );
  }
  
  scrollToSelection() {
    if (!this.editorInstance) return;
    
    // Calculate position of selection
    const textarea = this.editorInstance;
    const content = textarea.value.substring(0, textarea.selectionStart);
    const lines = content.split('\n');
    
    // Estimate line height (can vary by browser/font)
    const lineHeight = 18; // px, approximate
    
    // Calculate scroll position to center selection
    const linePos = lines.length * lineHeight;
    const viewportHeight = textarea.clientHeight;
    const scrollPos = linePos - (viewportHeight / 2);
    
    // Set scroll position
    if (scrollPos > 0) {
      textarea.scrollTop = scrollPos;
    }
  }
  
  searchNext() {
    if (!this.searchResults.query || this.searchResults.matches.length === 0 || !this.editorInstance) return;
    
    // Move to next match
    this.searchResults.currentIndex = (this.searchResults.currentIndex + 1) % this.searchResults.matches.length;
    const matchPos = this.searchResults.matches[this.searchResults.currentIndex];
    
    // Set selection
    this.editorInstance.focus();
    this.editorInstance.setSelectionRange(matchPos, matchPos + this.searchResults.query.length);
    
    // Scroll to match
    this.scrollToSelection();
  }
  
  searchPrev() {
    if (!this.searchResults.query || this.searchResults.matches.length === 0 || !this.editorInstance) return;
    
    // Move to previous match
    this.searchResults.currentIndex = 
      (this.searchResults.currentIndex - 1 + this.searchResults.matches.length) % this.searchResults.matches.length;
    const matchPos = this.searchResults.matches[this.searchResults.currentIndex];
    
    // Set selection
    this.editorInstance.focus();
    this.editorInstance.setSelectionRange(matchPos, matchPos + this.searchResults.query.length);
    
    // Scroll to match
    this.scrollToSelection();
  }
  
  renderFileTabs() {
    const files = this.getFilesList();
    
    return files.map(file => {
      const isDirty = this.dirtyFiles.has(file.id);
      const dirtyIndicator = isDirty ? '<span class="dirty-indicator" title="Code may be out of sync">*</span>' : '';
      return `
        <div class="code-file-tab ${file.id === this.activeFile ? 'active' : ''}" data-file-id="${file.id}" title="${file.name}">
          <span>${file.name}</span>${dirtyIndicator}
        </div>
      `;
    }).join('');
  }
  
  renderCodeEditorPlaceholder() {
    return `<div class="code-editor-placeholder">Loading code editor...</div>`;
  }
  
  getFilesList() {
    // In a real implementation, this would be more dynamic based on project structure
    // For now, return a static list of files for the current screen
    const screenName = this.currentScreen.name;
    const packagePath = this.currentApp.packageName.replace(/\./g, '/');
    
    return [
      { id: 'main', name: `${screenName}.java` },
      { id: 'layout', name: `activity_${screenName.toLowerCase()}.xml` },
      { id: 'strings', name: 'strings.xml' },
      { id: 'colors', name: 'colors.xml' },
      { id: 'manifest', name: 'AndroidManifest.xml' },
      { id: 'gradle', name: 'build.gradle' }
    ];
  }
  
  switchToFile(fileId) {
    if (this.activeFile === fileId) return;
    
    // Update active file
    this.activeFile = fileId;
    
    // Update UI
    document.querySelectorAll('.code-file-tab').forEach(tab => {
      const fileId = tab.dataset.fileId;
      const isDirty = this.dirtyFiles.has(fileId);
      const dirtyIndicator = tab.querySelector('.dirty-indicator');
      
      if (fileId === this.activeFile) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
      
      // Update or remove dirty indicator
      if (isDirty && !dirtyIndicator) {
          const indicator = document.createElement('span');
          indicator.className = 'dirty-indicator';
          indicator.title = 'Code may be out of sync';
          indicator.textContent = '*';
          tab.appendChild(indicator);
      } else if (!isDirty && dirtyIndicator) {
          dirtyIndicator.remove();
      }
    });
    
    // Update file type in status bar
    const fileTypeStatus = document.querySelector('.code-status-file-type');
    if (fileTypeStatus) {
      fileTypeStatus.textContent = this.getFileExtension(fileId);
    }
    
    // Update editor content
    if (this.editorInstance) {
      this.editorInstance.value = this.getActiveFileContent();
      this.updateStatusBar(this.editorInstance);
      
      // Apply syntax highlighting for new file
      this.applySyntaxHighlighting();
    }
    
    // Update undo/redo buttons
    this.updateUndoRedoButtons();
    
    // Reset search results when switching files
    this.searchResults = {
      query: '',
      matches: [],
      currentIndex: -1
    };
  }
  
  getActiveFileContent() {
    // Get cached content if available
    if (this.fileContents[this.activeFile]) {
      return this.fileContents[this.activeFile];
    }
    
    // Generate code for the file
    const content = this.generateFileContent(this.activeFile);
    this.fileContents[this.activeFile] = content;
    
    return content;
  }
  
  generateFileContent(fileId) {
    return this.codeGenerator.generateFile(fileId, this.currentScreen);
  }
  
  generateCode() {
    // Use the CodeGenerator to generate all files
    const files = this.getFilesList();
    
    files.forEach(file => {
      // Only generate if not already generated
      if (!this.fileContents[file.id]) {
        this.fileContents[file.id] = this.generateFileContent(file.id);
      }
    });
  }
  
  saveCode() {
    // Store current file content
    if (this.editorInstance && this.activeFile) {
      this.fileContents[this.activeFile] = this.editorInstance.value;
    }
    
    // In a real implementation, we would save all files to storage
    // For now, just show a notification and simulate saving to the app
    
    // Update app model with generated code
    if (!this.currentApp.generatedCode) {
      this.currentApp.generatedCode = {};
    }
    
    // Save all files to app model
    Object.keys(this.fileContents).forEach(fileId => {
      this.currentApp.generatedCode[fileId] = this.fileContents[fileId];
    });
    
    // Update app in storage
    this.editorView.appService.updateApp(this.currentApp);
    
    this.notificationManager.showNotification('Code saved successfully', 'success');
  }
  
  runCode() {
    // Save before running
    this.saveCode();
    
    // In a real implementation, we would compile and run the code
    // For now, show a notification
    this.notificationManager.showNotification(`Simulating run for ${this.currentScreen.name}... Check console for details.`, 'info');
    console.log(`--- Running Code for ${this.currentScreen.name} ---`);
    console.log(`App Name: ${this.currentApp.name}`);
    console.log(`Package Name: ${this.currentApp.packageName}`);
    console.log(`Screen: ${this.currentScreen.name}`);
    console.log("Code Files:", this.fileContents);
    console.log("--- End Run Simulation ---");
  }
  
  formatCode() {
    if (!this.editorInstance || !this.activeFile) return;
    
    // Save current state to undo history
    this.saveToHistory();
    
    // Get the current code
    const currentCode = this.editorInstance.value;
    
    // Format based on file type
    const formattedCode = this.codeFormatter.format(currentCode, this.getFileExtension(this.activeFile));
    
    // Update editor
    this.editorInstance.value = formattedCode;
    this.fileContents[this.activeFile] = formattedCode;
    
    this.notificationManager.showNotification('Code formatted', 'success');
  }
  
  markFileAsDirty(componentId, propertyName) {
    // Determine which files are affected by this property change
    // Basic logic: layout properties affect layout.xml, others might affect Java
    // TODO: Refine this logic based on specific properties
    const propId = propertyName.replace('prop-', ''); // e.g., 'prop-text' -> 'text'
    
    console.log(`Property changed: ${propId} for component ${componentId}`);

    // Layout file is affected by most visual properties
    this.dirtyFiles.add('layout'); 
    
    // Java file is affected by things needing event handlers or variable references (like ID changes, though ID is read-only for now)
    // For now, let's assume text changes might also need Java updates (e.g., if used in logic)
    if ([ 'text', 'checked', 'progress' /* other interaction props */ ].includes(propId)) {
         this.dirtyFiles.add('main');
    }

    // Refresh the file tabs UI to show dirty indicators
    this.refreshFileTabsUI();
  }

  refreshFileTabsUI() {
    const fileTabsContainer = document.querySelector('.code-file-tabs');
    if (fileTabsContainer) {
      fileTabsContainer.innerHTML = this.renderFileTabs();
      // Re-attach event listeners to the new tabs
      document.querySelectorAll('.code-file-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const fileId = tab.dataset.fileId;
          this.switchToFile(fileId);
        });
      });
    }
  }

  changeScreen(screenId) {
    // Update current screen and regenerate code
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (screen) {
      this.currentScreen = screen;
      
      // Keep existing user changes
      const userModifiedFiles = {};
      
      // Check which files have been modified by the user
      if (this.editorInstance && this.activeFile) {
        this.fileContents[this.activeFile] = this.editorInstance.value;
      }
      
      // Get generated content for comparison
      Object.keys(this.fileContents).forEach(fileId => {
        const generatedContent = this.generateFileContent(fileId);
        
        // If file was modified by user, save it
        if (this.fileContents[fileId] !== generatedContent) {
          userModifiedFiles[fileId] = this.fileContents[fileId];
        }
      });
      
      // Clear file cache for regeneration
      this.fileContents = {};
      this.dirtyFiles.clear(); // Clear dirty status on screen change
      
      // Generate new code
      this.generateCode();
      
      // Restore user modifications
      Object.keys(userModifiedFiles).forEach(fileId => {
        this.fileContents[fileId] = userModifiedFiles[fileId];
      });
      
      // Clear history for clean state
      this.fileHistory = {
        undo: {},
        redo: {}
      };
      
      // Reset search results
      this.searchResults = {
        query: '',
        matches: [],
        currentIndex: -1
      };
      
      // Update UI
      const fileTabsContainer = document.querySelector('.code-file-tabs');
      if (fileTabsContainer) {
        fileTabsContainer.innerHTML = this.renderFileTabs();
        // Re-attach listeners after re-rendering tabs
        document.querySelectorAll('.code-file-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            const fileId = tab.dataset.fileId;
            this.switchToFile(fileId);
          });
        });
      }
      
      // Update editor content if active
      if (this.editorInstance) {
        this.editorInstance.value = this.getActiveFileContent();
      }
    }
  }
}

export default CodeManager; 