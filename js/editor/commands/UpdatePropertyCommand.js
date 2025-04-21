import Command from './Command.js';

/**
 * Command to update a component property
 */
class UpdatePropertyCommand extends Command {
  /**
   * @param {Object} editorView - The editor view
   * @param {string} componentId - The ID of the component to update
   * @param {string} propertyPath - The path to the property to update (e.g. 'properties.x' or 'properties.text')
   * @param {any} newValue - The new value for the property
   * @param {any} oldValue - Optional: The old value for the property (for undo)
   */
  constructor(editorView, componentId, propertyPath, newValue, oldValue = null) {
    super(editorView);
    this.componentId = componentId;
    this.propertyPath = propertyPath;
    this.newValue = newValue;
    this.oldValue = oldValue; // If provided, use it; otherwise, will be set during execution
  }
  
  execute() {
    try {
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screen = this.editorView.currentScreen;
      
      // Find the component to update
      const component = this._findComponent(screen.components, this.componentId);
      
      if (!component) {
        return false;
      }
      
      // Get/set deeply nested properties using the path
      // e.g., 'properties.text' -> component.properties.text
      const parts = this.propertyPath.split('.');
      
      // Navigate to the parent object of the property to update
      let obj = component;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) {
          obj[parts[i]] = {};
        }
        obj = obj[parts[i]];
      }
      
      // Store the old value for undo if not already provided
      const lastPart = parts[parts.length - 1];
      if (this.oldValue === null) {
        this.oldValue = obj[lastPart];
      }
      
      // Set the new value
      obj[lastPart] = this.newValue;
      
      // Update the component in the app
      const result = this.editorView.appService.updateComponent(
        app.id,
        screen.id,
        component
      );
      
      if (result) {
        // Immediately update visual representation for better UX
        // If the property is directly on 'properties', update the visual
        if (this.propertyPath.startsWith('properties.') && this.editorView.componentManager) {
          // Extract the property name from the path
          const propertyName = this.propertyPath.split('.').pop();
          
          // Create an object with just the changed property
          const updateObj = {};
          updateObj[propertyName] = this.newValue;
          
          // Update visuals immediately
          this.editorView.componentManager.updateComponentVisuals(this.componentId, updateObj);
        } else {
          // For more complex changes, re-render the preview
          if (this.editorView.componentManager) {
            this.editorView.componentManager.renderComponentsPreview();
          }
        }
        
        // Update property panel if this component is selected
        if (this.editorView.selectedComponent?.id === this.componentId && 
            this.editorView.propertyPanel) {
          this.editorView.propertyPanel.updatePropertyValues();
        }
        
        // Notify code manager that property has changed (for generated code)
        if (this.propertyPath.startsWith('properties.')) {
          const propertyName = this.propertyPath.split('.').pop();
          this.editorView.notifyCodePotentiallyDirty(this.componentId, propertyName);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error executing UpdatePropertyCommand:', error);
      return false;
    }
  }
  
  undo() {
    try {
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screen = this.editorView.currentScreen;
      
      // Find the component to update
      const component = this._findComponent(screen.components, this.componentId);
      
      if (!component) {
        return false;
      }
      
      // Get/set deeply nested properties using the path
      // e.g., 'properties.text' -> component.properties.text
      const parts = this.propertyPath.split('.');
      
      // Navigate to the parent object of the property to update
      let obj = component;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) {
          obj[parts[i]] = {};
        }
        obj = obj[parts[i]];
      }
      
      // Restore the old value
      const lastPart = parts[parts.length - 1];
      obj[lastPart] = this.oldValue;
      
      // Update the component in the app
      const result = this.editorView.appService.updateComponent(
        app.id,
        screen.id,
        component
      );
      
      if (result) {
        // Immediately update visual representation for better UX during undo
        if (this.propertyPath.startsWith('properties.') && this.editorView.componentManager) {
          // Extract the property name from the path
          const propertyName = this.propertyPath.split('.').pop();
          
          // Create an object with just the changed property
          const updateObj = {};
          updateObj[propertyName] = this.oldValue;
          
          // Update visuals immediately for undo
          this.editorView.componentManager.updateComponentVisuals(this.componentId, updateObj);
        } else {
          // For more complex changes, re-render the preview
          if (this.editorView.componentManager) {
            this.editorView.componentManager.renderComponentsPreview();
          }
        }
        
        // Update property panel if this component is selected
        if (this.editorView.selectedComponent?.id === this.componentId && 
            this.editorView.propertyPanel) {
          this.editorView.propertyPanel.updatePropertyValues();
        }
        
        // Notify code manager that property has been reverted (for generated code)
        if (this.propertyPath.startsWith('properties.')) {
          const propertyName = this.propertyPath.split('.').pop();
          this.editorView.notifyCodePotentiallyDirty(this.componentId, propertyName);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error undoing UpdatePropertyCommand:', error);
      return false;
    }
  }
  
  /**
   * Helper to find a component in the component tree
   * @param {Array} components - Array of components to search in
   * @param {string} id - ID of the component to find
   * @returns {Object|null} The found component or null
   */
  _findComponent(components, id) {
    if (!components) return null;
    
    for (const component of components) {
      if (component.id === id) {
        return component;
      }
      
      // Check children if this is a container
      // Support both children array and properties.children
      const children = component.children || 
                      (component.properties && component.properties.children);
                      
      if (children && children.length > 0) {
        const found = this._findComponent(children, id);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
}

export default UpdatePropertyCommand; 