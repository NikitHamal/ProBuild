class AppCard {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'app-card';
    this.render();
  }

  render() {
    const lastModified = this.app.lastModified 
      ? new Date(this.app.lastModified).toLocaleDateString() 
      : 'New Project';

    // Get the app theme color
    const themeColor = this.getThemeColor(this.app.themeColor || 'colorAccent', this.app.customColors);

    // Prepare icon content
    let iconContent = '';
    if (this.app.customIconUrl) {
      iconContent = `<img src="${this.app.customIconUrl}" alt="${this.app.name} icon">`;
    } else {
      iconContent = `<i class="material-icons">${this.app.icon || 'smartphone'}</i>`;
    }

    this.element.innerHTML = `
      <div class="app-thumbnail" style="background-color: ${themeColor};">
        ${iconContent}
      </div>
      <div class="app-info">
        <h3 class="app-name">${this.app.name}</h3>
        <p class="app-package">${this.app.packageName || ''}</p>
        <p class="app-date">Last modified: ${lastModified}</p>
        <p class="app-version">Version ${this.app.versionName || '1.0'} (${this.app.versionCode || '1'}) | API ${this.app.minSdk || '21'}</p>
      </div>
      <div class="app-actions">
        <button class="app-action-btn edit-btn" title="Edit">
          <i class="material-icons">edit</i>
        </button>
        <button class="app-action-btn delete-btn" title="Delete">
          <i class="material-icons">delete</i>
        </button>
      </div>
    `;

    this.setupEventListeners();
  }

  getThemeColor(themeColorName, customColors = null) {
    const defaultColors = {
      'colorAccent': '#2196F3',
      'colorPrimary': '#3F51B5',
      'colorPrimaryDark': '#303F9F',
      'colorControlHighlight': '#E0E0E0'
    };
    
    if (customColors && customColors[themeColorName]) {
      return customColors[themeColorName];
    }
    
    return defaultColors[themeColorName] || '#2196F3';
  }

  setupEventListeners() {
    // Open the app in editor when clicked
    this.element.addEventListener('click', (e) => {
      // Prevent click if we're clicking on an action button
      if (e.target.closest('.app-action-btn')) {
        return;
      }
      
      window.location.href = `editor.html?id=${this.app.id}`;
    });

    // Edit button
    const editBtn = this.element.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `editor.html?id=${this.app.id}`;
    });

    // Delete button
    const deleteBtn = this.element.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (confirm(`Are you sure you want to delete "${this.app.name}"?`)) {
        // Get apps from localStorage
        const apps = JSON.parse(localStorage.getItem('apps') || '[]');
        
        // Filter out the app to delete
        const updatedApps = apps.filter(app => app.id !== this.app.id);
        
        // Save back to localStorage
        localStorage.setItem('apps', JSON.stringify(updatedApps));
        
        // Remove from DOM
        this.element.remove();
        
        // If no apps left, show empty state
        if (updatedApps.length === 0) {
          const appGrid = document.querySelector('.app-grid');
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-state';
          emptyState.innerHTML = `
            <i class="material-icons">phone_android</i>
            <h2 class="empty-state-title">No apps yet</h2>
            <p class="empty-state-text">Create your first app to get started</p>
          `;
          
          appGrid.innerHTML = '';
          appGrid.appendChild(emptyState);
        }
      }
    });
  }
}

export default AppCard; 