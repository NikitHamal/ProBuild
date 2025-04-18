import Command from './Command.js';

/**
 * Command to add a component to the screen
 */
class AddComponentCommand extends Command {
  /**
   * @param {Object} editorView - The editor view
   * @param {Object} component - The component data to add
   * @param {string} parentId - The parent component ID (optional, for nested components)
   */
  constructor(editorView, component, parentId = null) {
    super(editorView);
    this.component = component;
    this.parentId = parentId;
    this.addedComponentId = null; // Will be set after execution
  }
  
  execute() {
    try {
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screenId = this.editorView.currentScreen.id;
      
      // Create a deep copy of the component to avoid reference issues
      const componentCopy = JSON.parse(JSON.stringify(this.component));
      
      // Add the component to the screen
      const addedComponent = this.editorView.appService.addComponent(
        app.id, 
        screenId, 
        componentCopy, 
        this.parentId
      );
      
      if (addedComponent) {
        // Store the ID of the newly added component for undo
        this.addedComponentId = addedComponent.id;
        
        // Update the UI
        if (this.editorView.componentManager) {
          this.editorView.componentManager.renderComponentsPreview();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error executing AddComponentCommand:', error);
      return false;
    }
  }
  
  undo() {
    try {
      if (!this.addedComponentId) {
        return false;
      }
      
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screenId = this.editorView.currentScreen.id;
      
      // Delete the component that was added
      const result = this.editorView.appService.deleteComponent(
        app.id, 
        screenId, 
        this.addedComponentId
      );
      
      if (result) {
        // Update the UI
        if (this.editorView.componentManager) {
          this.editorView.componentManager.renderComponentsPreview();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error undoing AddComponentCommand:', error);
      return false;
    }
  }
}

export default AddComponentCommand; 