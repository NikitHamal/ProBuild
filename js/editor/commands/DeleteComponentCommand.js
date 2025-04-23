import Command from './Command.js';

/**
 * Command to delete a component from the screen
 */
class DeleteComponentCommand extends Command {
  /**
   * @param {Object} editorView - The editor view
   * @param {string} componentId - The ID of the component to delete
   */
  constructor(editorView, componentId) {
    super(editorView);
    this.componentId = componentId;
    this.deletedComponent = null; // Will store the component data for undo
    this.parentId = null; // Will store the parent component ID if any
  }
  
  execute() {
    try {
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screen = this.editorView.currentScreen;
      
      // Find the component to delete
      const component = this._findComponent(screen.components, this.componentId);
      
      if (!component) {
        return false;
      }
      
      // Store the component data for undo
      this.deletedComponent = JSON.parse(JSON.stringify(component));
      
      // Find parent ID (if it's a nested component)
      this.parentId = this._findParentId(screen.components, this.componentId);
      
      // Delete the component
      const result = this.editorView.appService.deleteComponent(
        app.id,
        screen.id,
        this.componentId
      );
      
      if (result) {
        // Update UI
        if (this.editorView.componentManager) {
          this.editorView.componentManager.renderComponentsPreview();
        }
        
        // If this was the selected component, clear selection
        if (this.editorView.selectedComponent?.id === this.componentId) {
          this.editorView.selectedComponent = null;
          if (this.editorView.propertyPanel) {
            this.editorView.propertyPanel.hidePropertyPanel();
          }
        }
        
        // Update code files for the component deletion
        this._updateCodeForComponentChange();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error executing DeleteComponentCommand:', error);
      return false;
    }
  }
  
  undo() {
    try {
      if (!this.deletedComponent) {
        return false;
      }
      
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screenId = this.editorView.currentScreen.id;
      
      // Create a deep copy of the component to avoid reference issues
      const componentCopy = JSON.parse(JSON.stringify(this.deletedComponent));
      
      // Restore the component
      const addedComponent = this.editorView.appService.addComponent(
        app.id,
        screenId,
        componentCopy,
        this.parentId
      );
      
      if (addedComponent) {
        // Update UI
        if (this.editorView.componentManager) {
          this.editorView.componentManager.renderComponentsPreview();
        }
        
        // Update code files for the component restoration
        this._updateCodeForComponentChange();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error undoing DeleteComponentCommand:', error);
      return false;
    }
  }
  
  /**
   * Helper method to update code files when a component changes
   * @private
   */
  _updateCodeForComponentChange() {
    try {
      if (!this.editorView.codeManager || !this.editorView.codeManager.fileManager) {
        return;
      }
      
      console.log(`DeleteComponentCommand: Updating code files for component ${this.componentId}`);
      
      // Mark relevant files as dirty
      const fileManager = this.editorView.codeManager.fileManager;
      fileManager.markFileAsDirty(this.componentId, 'layout');
      fileManager.markFileAsDirty(this.componentId, 'main');
      
      // Regenerate affected files
      const affectedFiles = ['layout', 'main'];
      affectedFiles.forEach(fileId => {
        const newContent = fileManager.generateFileContent(fileId);
        fileManager.updateFileContent(fileId, newContent);
      });
      
      // Force immediate save
      fileManager.triggerAutoSave(true);
    } catch (error) {
      console.error('Error updating code for component change:', error);
    }
  }
  
  /**
   * Helper to find a component in the component tree
   * @param {Array} components - Array of components to search in
   * @param {string} id - ID of the component to find
   * @returns {Object|null} The found component or null
   */
  _findComponent(components, id) {
    for (const component of components) {
      if (component.id === id) {
        return component;
      }
      
      // Check children if this is a container
      if (component.children && component.children.length > 0) {
        const found = this._findComponent(component.children, id);
        if (found) {
          return found;
        }
      }
      
      // Also check properties.children if component has them
      if (component.properties && component.properties.children && 
          Array.isArray(component.properties.children) && 
          component.properties.children.length > 0) {
        const found = this._findComponent(component.properties.children, id);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Helper to find the parent ID of a component
   * @param {Array} components - Array of components to search in
   * @param {string} id - ID of the component whose parent to find
   * @param {string|null} parentId - Current parent ID in the recursion
   * @returns {string|null} The parent ID or null if top-level
   */
  _findParentId(components, id, parentId = null) {
    for (const component of components) {
      if (component.id === id) {
        return parentId;
      }
      
      // Check children if this is a container
      if (component.children && component.children.length > 0) {
        const found = this._findParentId(component.children, id, component.id);
        if (found !== null) {
          return found;
        }
      }
      
      // Also check properties.children if component has them
      if (component.properties && component.properties.children && 
          Array.isArray(component.properties.children) && 
          component.properties.children.length > 0) {
        const found = this._findParentId(component.properties.children, id, component.id);
        if (found !== null) {
          return found;
        }
      }
    }
    
    return null;
  }
}

export default DeleteComponentCommand; 