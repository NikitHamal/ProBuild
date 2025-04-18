import Command from './Command.js';

/**
 * Command to move a component (change position or parent)
 */
class MoveComponentCommand extends Command {
  /**
   * @param {Object} editorView - The editor view
   * @param {string} componentId - The ID of the component to move
   * @param {Object} newPosition - The new position {x, y} or null if just changing parent
   * @param {string|null} newParentId - The new parent component ID (null for root level)
   * @param {Object|null} startPosition - The starting position before move, if known
   */
  constructor(editorView, componentId, newPosition = null, newParentId = null, startPosition = null) {
    super(editorView);
    this.componentId = componentId;
    this.newPosition = newPosition;
    this.newParentId = newParentId;
    
    // If start position is provided, use it; otherwise it will be determined during execute
    this.oldPosition = startPosition || null;
    this.oldParentId = null;
  }
  
  execute() {
    try {
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screen = this.editorView.currentScreen;
      
      // Find the component to move
      const component = this._findComponent(screen.components, this.componentId);
      
      if (!component) {
        return false;
      }
      
      // If oldPosition wasn't provided in constructor, store it now
      if (!this.oldPosition) {
        this.oldPosition = { 
          x: parseInt(component.properties.x, 10) || 0, 
          y: parseInt(component.properties.y, 10) || 0 
        };
      }
      
      this.oldParentId = this._findParentId(screen.components, this.componentId);
      
      // If only moving position (not changing parent)
      if (this.newPosition && this.oldParentId === this.newParentId) {
        // Save the new position to component properties
        component.properties.x = this.newPosition.x;
        component.properties.y = this.newPosition.y;
        
        // Update the component
        const result = this.editorView.appService.updateComponent(
          app.id,
          screen.id,
          component
        );
        
        if (result) {
          // Update UI
          if (this.editorView.componentManager) {
            this.editorView.componentManager.renderComponentsPreview();
          }
          
          return true;
        }
        
        return false;
      }
      
      // If changing parent (more complex)
      // First remove from old parent
      const deleteResult = this.editorView.appService.deleteComponent(
        app.id,
        screen.id,
        this.componentId
      );
      
      if (!deleteResult) {
        return false;
      }
      
      // Then add to new parent with potentially new position
      const componentCopy = JSON.parse(JSON.stringify(component));
      if (this.newPosition) {
        componentCopy.properties.x = this.newPosition.x;
        componentCopy.properties.y = this.newPosition.y;
      }
      
      const addedComponent = this.editorView.appService.addComponent(
        app.id,
        screen.id,
        componentCopy,
        this.newParentId
      );
      
      if (addedComponent) {
        // Update UI
        if (this.editorView.componentManager) {
          this.editorView.componentManager.renderComponentsPreview();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error executing MoveComponentCommand:', error);
      return false;
    }
  }
  
  undo() {
    try {
      // Get the current app and screen
      const app = this.editorView.currentApp;
      const screen = this.editorView.currentScreen;
      
      // Find the component to move back
      const component = this._findComponent(screen.components, this.componentId);
      
      if (!component) {
        return false;
      }
      
      // If only position was changed (not parent)
      if (this.oldPosition && this.oldParentId === this.newParentId) {
        // Restore old position
        component.properties.x = this.oldPosition.x;
        component.properties.y = this.oldPosition.y;
        
        // Update the component
        const result = this.editorView.appService.updateComponent(
          app.id,
          screen.id,
          component
        );
        
        if (result) {
          // Update UI
          if (this.editorView.componentManager) {
            this.editorView.componentManager.renderComponentsPreview();
          }
          
          return true;
        }
        
        return false;
      }
      
      // If parent was changed, remove from current parent
      const deleteResult = this.editorView.appService.deleteComponent(
        app.id,
        screen.id,
        this.componentId
      );
      
      if (!deleteResult) {
        return false;
      }
      
      // Then add back to original parent with original position
      const componentCopy = JSON.parse(JSON.stringify(component));
      if (this.oldPosition) {
        componentCopy.properties.x = this.oldPosition.x;
        componentCopy.properties.y = this.oldPosition.y;
      }
      
      const addedComponent = this.editorView.appService.addComponent(
        app.id,
        screen.id,
        componentCopy,
        this.oldParentId
      );
      
      if (addedComponent) {
        // Update UI
        if (this.editorView.componentManager) {
          this.editorView.componentManager.renderComponentsPreview();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error undoing MoveComponentCommand:', error);
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
    for (const component of components) {
      if (component.id === id) {
        return component;
      }
      
      // Check children if this component is a container
      if (component.children && component.children.length > 0) {
        const found = this._findComponent(component.children, id);
        if (found) {
          return found;
        }
      }
      
      // Also check within properties.children for layout containers
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
      
      // Also check within properties.children for layout containers
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

export default MoveComponentCommand; 