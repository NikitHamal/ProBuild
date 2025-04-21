class ComponentIdManager {
  constructor(editorView) {
    this.editorView = editorView;
  }
  
  /**
   * Validates and handles component ID changes
   * @param {string} oldId - The current component ID
   * @param {string} newId - The proposed new component ID
   * @param {string} screenId - The ID of the screen containing the component
   * @returns {boolean} - Whether the ID change was successful
   */
  handleIdChange(oldId, newId, screenId) {
    // If IDs are the same, no change needed
    if (oldId === newId) return true;
    
    // Validate the new ID format
    if (!this.isValidComponentId(newId)) {
      this.editorView.notificationManager.showNotification(
        'Invalid ID format. Use only letters, numbers, and underscores, starting with a letter.',
        'error'
      );
      return false;
    }
    
    // Check if ID already exists in the current screen
    if (this.isIdUsedInScreen(newId, screenId)) {
      this.editorView.notificationManager.showNotification(
        `ID "${newId}" is already used by another component in this screen.`,
        'error'
      );
      return false;
    }
    
    // Update all references to this component ID
    this.updateComponentId(oldId, newId, screenId);
    
    // Show success notification
    this.editorView.notificationManager.showNotification(
      `Component ID changed from "${oldId}" to "${newId}"`,
      'success'
    );
    
    // ID change successful
    return true;
  }
  
  /**
   * Validates component ID format
   * @param {string} id - The ID to validate
   * @returns {boolean} - Whether the ID is valid
   */
  isValidComponentId(id) {
    // Check if ID is a string with letters, numbers, and underscores,
    // starting with a letter and at least 1 character long
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(id);
  }
  
  /**
   * Checks if an ID is already used by a component in the screen
   * @param {string} id - The ID to check
   * @param {string} screenId - The ID of the screen to check in
   * @returns {boolean} - Whether the ID is already used
   */
  isIdUsedInScreen(id, screenId) {
    // Find the screen
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (!screen || !screen.components) return false;
    
    // Check if any component in the screen has this ID
    return screen.components.some(c => c.id === id && c !== this.editorView.selectedComponent);
  }
  
  /**
   * Updates all references to a component ID
   * @param {string} oldId - The old component ID
   * @param {string} newId - The new component ID
   * @param {string} screenId - The ID of the screen containing the component
   */
  updateComponentId(oldId, newId, screenId) {
    // Find the screen
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (!screen || !screen.components) return;
    
    // Find the component in the screen
    const component = screen.components.find(c => c.id === oldId);
    if (!component) return;
    
    // Update component ID
    component.id = newId;
    
    // If the component is currently selected, update the selectedComponent reference
    if (this.editorView.selectedComponent && this.editorView.selectedComponent.id === oldId) {
      this.editorView.selectedComponent.id = newId;
    }
    
    // Update the component element's data attribute
    const componentElement = document.querySelector(`.preview-component[data-component-id="${oldId}"]`);
    if (componentElement) {
      componentElement.dataset.componentId = newId;
    }
    
    // TODO: Update any other references to this component ID in events or layouts
    
    // Save app changes
    this.editorView.saveApp();
  }
}

export default ComponentIdManager; 