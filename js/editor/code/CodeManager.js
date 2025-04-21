import CodeFormatter from './CodeFormatter.js';
import CodeHistoryManager from './CodeHistoryManager.js';
import CodeSearchManager from './CodeSearchManager.js';
import CodeFileManager from './CodeFileManager.js';
import CodeEditorUIManager from './CodeEditorUIManager.js';
import CodeEditorEventManager from './CodeEditorEventManager.js';
import NotificationManager from '../utils/NotificationManager.js';

class CodeManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.currentApp = editorView.currentApp;
    this.currentScreen = editorView.currentScreen;
    this.notificationManager = new NotificationManager();

    this.activeFile = 'main'; // Default active file
    this.editorInstance = null; // Reference to the actual editor (textarea)

    // Instantiate Managers
    this.codeFormatter = new CodeFormatter();
    this.historyManager = new CodeHistoryManager(this);
    this.searchManager = new CodeSearchManager(this);
    this.fileManager = new CodeFileManager(this);
    this.uiManager = new CodeEditorUIManager(this);
    this.eventManager = new CodeEditorEventManager(this);
    
    // --- Load existing code from the App model ---
    if (this.currentApp && this.currentApp.generatedCode) {
        console.log("CodeManager: Loading previously saved code from App model.");
        // Copy saved code into the file manager's cache
        // Ensure we don't overwrite it later with default generation unless necessary
        Object.keys(this.currentApp.generatedCode).forEach(fileId => {
            this.fileManager.fileContents[fileId] = this.currentApp.generatedCode[fileId];
        });
        // Mark loaded files initially as non-dirty (assuming loaded code is the saved state)
        this.fileManager.clearDirtyFiles(); 
    } else {
        console.log("CodeManager: No previously saved code found in App model, will generate defaults if needed.");
    }
    // --- End Load existing code ---

    // Expose fileContents via fileManager
    // Use this.fileManager.fileContents to access
  }
  
  // --- Initialization and Rendering ---
  renderCodeTab() {
    // Generate initial code ONLY if it wasn't loaded
    // The generateFileContent method inside generateCodeForAllFiles
    // already checks if content exists in fileContents, so this call is okay.
    // It will only generate for files missing from the loaded generatedCode.
    this.fileManager.generateCodeForAllFiles();
    
    // Render the main UI structure
    const tabContent = this.uiManager.renderCodeTabContent();
    
    // Return the HTML content
    return tabContent;
  }
  
  initializeEditorAndListeners() {
      // Render the initial code editor structure (placeholder)
      // The actual editor instance is created by initCodeEditor
      // Note: renderCodeTab already generated the HTML string in EditorView
      
      // Find the container where the editor should be initialized
      const editorContainer = document.getElementById('editor-panel'); 
      if (!editorContainer) {
          console.error("Cannot initialize code editor: #editor-panel not found.");
          return;
      }

      // Initialize the actual editor instance (textarea) via UIManager
      this.uiManager.initCodeEditor(); 
      
      // Setup event listeners for the editor and toolbar via EventManager
      this.eventManager.setupAllEventListeners();
      // Pass the newly created editor instance to the event manager
      if(this.editorInstance) {
          this.eventManager.setupEditorEventListeners(this.editorInstance); 
      } else {
          console.error("Editor instance was not created by UIManager during initialization.");
      }
      
      // Attach listeners to the sidebar file list items
      const fileListContainer = editorContainer.querySelector('.file-list');
      if (fileListContainer) {
          this.uiManager.attachSidebarFileListeners(fileListContainer);
      } else {
           console.error("Could not find .file-list container to attach listeners.");
      }
      
      // Initial UI updates via respective managers
      this.historyManager.updateUndoRedoButtons();
      this.uiManager.updateSearchButtonStates();
  }

  // --- Core Actions (Delegated) ---
  formatCode() {
    if (!this.editorInstance || !this.activeFile) return;
    
    // Delegate history saving
    this.historyManager.saveToHistory(); 
    
    const currentCode = this.editorInstance.value;
    const fileType = this.fileManager.getFileExtension(this.activeFile);
    const formattedCode = this.codeFormatter.format(currentCode, fileType);
    
    // Update editor via UIManager is preferred, but direct update might be okay for now
    this.editorInstance.value = formattedCode;
    // Update file content via FileManager
    this.fileManager.updateFileContent(this.activeFile, formattedCode); 
    
    this.notificationManager.showNotification('Code formatted', 'success');
  }

  switchToFile(fileId) {
    if (this.activeFile === fileId || !fileId) return;

    // Update active file state (managed here)
    this.activeFile = fileId;
    
    // Update UI via UIManager (editor content, status bar, sidebar highlight)
    this.uiManager.updateEditorContent();
    this.uiManager.refreshFileSidebarUI(); // Use the renamed method
    
    // Update button states via respective managers
    this.historyManager.updateUndoRedoButtons();
    this.searchManager.resetSearch();
    this.uiManager.updateSearchButtonStates();
  }
  
  // --- Interaction with other Editor parts ---
  changeScreen(screenId) {
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (screen) {
      // Update current screen (managed here)
      this.currentScreen = screen;
      
      // Preserve user modifications before clearing
      const userModifiedFiles = {};
      Object.keys(this.fileManager.fileContents).forEach(fileId => {
          // Compare against newly generated content for THIS screen
          const generatedContent = this.fileManager.generateFileContent(fileId); // Pass currentScreen implicitly
          if (this.fileManager.fileContents[fileId] !== generatedContent) {
              userModifiedFiles[fileId] = this.fileManager.fileContents[fileId];
          }
      });

      // Clear caches and states via managers
      this.fileManager.clearFileCache();
      this.fileManager.clearDirtyFiles();
      this.historyManager.clearAllHistory();
      this.searchManager.resetSearch();
      
      // Regenerate code for the new screen via FileManager
      this.fileManager.generateCodeForAllFiles(); 
      
      // Restore user modifications via FileManager
      Object.keys(userModifiedFiles).forEach(fileId => {
          this.fileManager.fileContents[fileId] = userModifiedFiles[fileId]; 
      });
      
      // Update UI via UIManager
      this.uiManager.refreshFileSidebarUI(); // Use the renamed method
      // Update editor for the default file ('main') of the NEW screen
      this.activeFile = 'main'; // Reset to default file
      this.uiManager.updateEditorContent(); 
      
      // Update button states via managers
      this.historyManager.updateUndoRedoButtons();
      this.uiManager.updateSearchButtonStates();
    }
  }
  
  // Called externally when component ID changes (e.g., from PropertyPanel via ComponentIdManager)
  handleComponentIdChange(oldId, newId) {
     // This method now focuses SOLELY on updating the code content based on ID change.
     // The UI updates and appService calls are handled by ComponentIdManager.
     console.log(`CodeManager: Updating code references from ${oldId} to ${newId}`);
     
     // Determine affected files (e.g., main Java and layout XML)
     // This logic could be refined or moved to FileManager if complex
     const affectedFiles = ['main', 'layout']; 
     
     affectedFiles.forEach(fileId => {
         // Regenerate content based on the NEW component ID (already updated in the model)
         const newContent = this.fileManager.generateFileContent(fileId);
         // Update content in file manager, mark as dirty, and trigger save
         this.fileManager.updateFileContent(fileId, newContent); 
     });
     
     // If an affected file is active, update the editor via UIManager
     if (affectedFiles.includes(this.activeFile) && this.editorInstance) {
         this.uiManager.updateEditorContent();
     }
  }

  updateCodeFromBlocks(generatedJavaCode) {
      // Check if generated code is valid
      if (typeof generatedJavaCode !== 'string') {
          console.warn('CodeManager: updateCodeFromBlocks received invalid code (null or not string). Skipping update.');
          return; 
      }
      
      const targetFileId = 'main';
      const placeholder = '// <<< BLOCKS_CODE_GOES_HERE >>>';
      // *** Use simpler delimiters ***
      const startComment = '// BLOCKS_START';
      const endComment = '// BLOCKS_END';
      
      // Get current content via FileManager
      let currentContent = this.fileManager.fileContents[targetFileId] || this.fileManager.generateFileContent(targetFileId);
      let updatedContent = '';

      // Determine base indentation (try start comment, then placeholder, then fallback)
      let baseIndent = '        '; // Default fallback indent
      const startCommentMatch = currentContent.match(/^(\s*)\/\/\s*BLOCKS_START/m); // Updated regex
      const placeholderMatch = currentContent.match(/^(\s*)\/\/\s*<<<\s*BLOCKS_CODE_GOES_HERE\s*>>>/m);

      if (startCommentMatch) {
          baseIndent = startCommentMatch[1];
      } else if (placeholderMatch) {
          baseIndent = placeholderMatch[1];
      }
      
      const indentedCode = generatedJavaCode.split('\n').map(line => line.trim() ? baseIndent + line : '').join('\n');

      // Improved Replacement Logic (using new delimiters)
      const startIndex = currentContent.indexOf(startComment);
      const endIndex = currentContent.indexOf(endComment);

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
          // Found existing block - replace content between comments
          const before = currentContent.substring(0, startIndex + startComment.length);
          const after = currentContent.substring(endIndex);
          updatedContent = `${before}\n${indentedCode}\n${baseIndent}${endComment}`;
          console.log('CodeManager: Replacing existing generated code block.');
      } else if (currentContent.includes(placeholder)) {
          // Found placeholder - replace it
           updatedContent = currentContent.replace(placeholder,
              `${startComment}\n${indentedCode}\n${baseIndent}${endComment}`
          );
          console.log('CodeManager: Replacing placeholder with generated code.');
      } else {
          // Fallback logic
          console.warn(`Placeholder "${placeholder}" not found, attempting fallback insertion.`);
          const onCreateEndMatch = currentContent.match(/^(\s*)}\s*\/\/\s*end\s+onCreate/m); // Example fallback
          if (onCreateEndMatch) {
             const insertionPoint = onCreateEndMatch.index;
             const insertionIndent = onCreateEndMatch[1] || baseIndent;
             updatedContent =
                  currentContent.slice(0, insertionPoint) +
                  `${insertionIndent}${startComment} // Fallback Insertion\n` + // Updated comment
                  `${indentedCode}\n` +
                  `${insertionIndent}${endComment}\n` +
                  currentContent.slice(insertionPoint);
             console.log('CodeManager: Using fallback insertion point.');
          } else {
             console.error('Could not find placeholder, existing block, or fallback location.');
             updatedContent = currentContent + `\n\n${baseIndent}// !!! Code Integration Error !!!\n${startComment}\n${indentedCode}\n${baseIndent}${endComment}`;
          }
      }
      
      // Update file content via FileManager
      this.fileManager.updateFileContent(targetFileId, updatedContent);
      
      // Update editor UI if the modified file is active
      if (this.activeFile === targetFileId && this.editorInstance) {
          this.uiManager.updateEditorContent();
      } else if (this.activeFile === targetFileId) {
          console.warn('CodeManager: Cannot update editor UI, editorInstance is not set.');
      }
  }
  
  // --- Expose necessary methods/properties for managers ---
  // Allow managers to trigger auto-save via the fileManager
  triggerAutoSave(immediate = false) {
      this.fileManager.triggerAutoSave(immediate);
  }
}

export default CodeManager;