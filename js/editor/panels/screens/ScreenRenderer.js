class ScreenRenderer {
  constructor(appService) {
    this.appService = appService;
  }
  
  renderScreensList(app, currentScreenId) {
    if (!app || !app.screens || app.screens.length === 0) {
      return '<div class="empty-screens">No screens available</div>';
    }
    
    let html = '';
    app.screens.forEach(screen => {
      const isActive = screen.id === currentScreenId;
      html += `
        <div class="screen-item ${isActive ? 'active' : ''}" data-screen-id="${screen.id}">
          <div class="screen-preview">
            <div class="screen-icon">
              <i class="material-icons">smartphone</i>
            </div>
          </div>
          <div class="screen-name">${screen.name}</div>
          <div class="screen-actions">
            <button class="screen-edit-btn" data-screen-id="${screen.id}">
              <i class="material-icons">edit</i>
            </button>
            <button class="screen-delete-btn" data-screen-id="${screen.id}">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
      `;
    });
    
    return html;
  }
  
  generateScreenPreview(screen) {
    // Generate a preview of the screen layout based on its components
    return `
      <div class="preview-container">
        <!-- Screen preview would be generated based on components -->
        <div class="screen-placeholder"></div>
      </div>
    `;
  }
  
  renderScreenDetails(screen) {
    if (!screen) {
      return '<div class="empty-screen-details">No screen selected</div>';
    }
    
    return `
      <div class="screen-details">
        <h3>${screen.name}</h3>
        <div class="screen-properties">
          <div class="property">
            <span class="property-label">ID:</span>
            <span class="property-value">${screen.id}</span>
          </div>
          <div class="property">
            <span class="property-label">Components:</span>
            <span class="property-value">${screen.components ? screen.components.length : 0}</span>
          </div>
        </div>
      </div>
    `;
  }
}

export default ScreenRenderer; 