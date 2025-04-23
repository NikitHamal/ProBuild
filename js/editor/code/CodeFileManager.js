import CodeGenerator from './CodeGenerator.js';
import NotificationManager from '../utils/NotificationManager.js';

class CodeFileManager {
  constructor(codeManager) {
    this.codeManager = codeManager; // Reference to main manager
    this.editorView = codeManager.editorView;
    this.codeGenerator = new CodeGenerator(this.codeManager); // Pass main manager here
    this.notificationManager = new NotificationManager();
    this.fileContents = {};
    this.dirtyFiles = new Set();
    this.autoSaveTimer = null;
  }

  getFilesList() {
    const screenName = this.editorView.currentScreen.name;
    // const packagePath = this.editorView.currentApp.packageName.replace(/\./g, '/'); // Not currently used
    
    // Basic file list - could be expanded later
    return [
      { id: 'main', name: `${screenName}.java` },
      { id: 'layout', name: `activity_${screenName.toLowerCase()}.xml` },
      { id: 'strings', name: 'strings.xml' }, // Global files
      { id: 'colors', name: 'colors.xml' },    // Global files
      { id: 'manifest', name: 'AndroidManifest.xml' }, // Global file
      // { id: 'gradle', name: 'build.gradle' } // Consider if needed
    ];
  }
  
  getFileExtension(fileId) {
    switch (fileId) {
      case 'main':
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

  generateFileContent(fileId) {
    return this.codeGenerator.generateFile(fileId, this.editorView.currentScreen);
  }

  getActiveFileContent() {
    const activeFile = this.codeManager.activeFile;
    if (this.fileContents[activeFile]) {
      return this.fileContents[activeFile];
    }
    
    const content = this.generateFileContent(activeFile);
    this.fileContents[activeFile] = content;
    return content;
  }
  
  generateCodeForAllFiles() {
    const files = this.getFilesList();
    files.forEach(file => {
      if (!this.fileContents[file.id]) {
        this.fileContents[file.id] = this.generateFileContent(file.id);
      }
    });
  }

  saveCode(immediate = false) {
    const activeFile = this.codeManager.activeFile;
    const editorInstance = this.codeManager.editorInstance;
    
    // Store current editor content if available
    if (editorInstance && activeFile) {
      this.fileContents[activeFile] = editorInstance.value;
    }
    
    // Update app model with all cached file contents
    const currentApp = this.editorView.currentApp;
    if (!currentApp.generatedCode) {
      currentApp.generatedCode = {};
    }
    Object.keys(this.fileContents).forEach(fileId => {
      currentApp.generatedCode[fileId] = this.fileContents[fileId];
    });
    
    try {
      // Update app in storage
      this.editorView.appService.updateApp(currentApp);
      
      // Clear the dirty status for all files that were just saved
      this.dirtyFiles.clear(); 
      // Refresh the sidebar UI to remove the dirty indicators
      this.codeManager.uiManager?.refreshFileSidebarUI();
      
      if (immediate) {
        this.notificationManager.showNotification('Code saved successfully', 'success');
      }
      console.log('Code saved successfully.'); // Optional console log
      
    } catch (error) {
        console.error("Error saving code:", error);
        this.notificationManager.showNotification('Failed to save code!', 'error');
    }
  }

  triggerAutoSave(immediate = false) {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    if (immediate) {
      this.saveCode(true);
    } else {
      this.autoSaveTimer = setTimeout(() => {
        this.saveCode();
        this.autoSaveTimer = null;
      }, 1500); // 1.5 seconds delay
    }
  }

  markFileAsDirty(componentId, propertyName) {
    // Basic logic: layout properties affect layout.xml, others might affect Java
    let propId = '';
    if (propertyName) {
      propId = propertyName.startsWith('prop-') ? propertyName.replace('prop-', '') : propertyName;
    }
    
    console.log(`File Manager: Property changed: ${propId} for component ${componentId}`);

    // Layout file affected by most visual properties
    this.dirtyFiles.add('layout'); 
    
    // Java file affected by interaction properties
    if ([ 'text', 'checked', 'progress', 'id' /* Add others needing logic updates */ ].includes(propId)) {
         this.dirtyFiles.add('main');
    }

    // Refresh the file sidebar UI via the UIManager
    this.codeManager.uiManager?.refreshFileSidebarUI();
  }
  
  clearDirtyFiles() {
      this.dirtyFiles.clear();
  }
  
  clearFileCache() {
      this.fileContents = {};
  }
  
  updateFileContent(fileId, content) {
      this.fileContents[fileId] = content;
      this.dirtyFiles.add(fileId);
      this.codeManager.uiManager?.refreshFileSidebarUI(); // Corrected function name
      this.triggerAutoSave(); // Auto-save after update
  }
}

export default CodeFileManager; 