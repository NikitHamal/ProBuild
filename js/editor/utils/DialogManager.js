class DialogManager {
  constructor(editorView) {
    this.editorView = editorView;
  }
  
  showEditAppDetailsDialog() {
    const app = this.editorView.currentApp;
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Edit App Details</h2>
        <div class="dialog-content">
          <div class="form-group">
            <label for="app-name">App Name</label>
            <input type="text" id="app-name" value="${app.name}" placeholder="App Name">
          </div>
          <div class="form-group">
            <label for="package-name">Package Name</label>
            <input type="text" id="package-name" value="${app.packageName}" placeholder="com.example.app">
          </div>
          <div class="form-group">
            <label for="project-name">Project Name</label>
            <input type="text" id="project-name" value="${app.projectName}" placeholder="Project Name">
          </div>
          
          <div class="version-fields">
            <div class="form-group">
              <label for="version-code">Version Code</label>
              <input type="number" id="version-code" value="${app.versionCode}" min="1">
            </div>
            <div class="form-group">
              <label for="version-name">Version Name</label>
              <input type="text" id="version-name" value="${app.versionName}" placeholder="1.0.0">
            </div>
          </div>
          
          <div class="form-group">
            <label for="min-sdk">Minimum SDK</label>
            <select id="min-sdk">
              <option value="21" ${app.minSdk === "21" ? 'selected' : ''}>Android 5.0 (API 21)</option>
              <option value="23" ${app.minSdk === "23" ? 'selected' : ''}>Android 6.0 (API 23)</option>
              <option value="26" ${app.minSdk === "26" ? 'selected' : ''}>Android 8.0 (API 26)</option>
              <option value="29" ${app.minSdk === "29" ? 'selected' : ''}>Android 10.0 (API 29)</option>
              <option value="31" ${app.minSdk === "31" ? 'selected' : ''}>Android 12.0 (API 31)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Theme Color</label>
            <div class="color-selector">
              <div class="color-option colorAccent ${app.themeColor === 'colorAccent' ? 'selected' : ''}" data-color="colorAccent">
                <div class="color-tooltip">Accent Color</div>
              </div>
              <div class="color-option colorPrimary ${app.themeColor === 'colorPrimary' ? 'selected' : ''}" data-color="colorPrimary">
                <div class="color-tooltip">Primary Color</div>
              </div>
              <div class="color-option colorPrimaryDark ${app.themeColor === 'colorPrimaryDark' ? 'selected' : ''}" data-color="colorPrimaryDark">
                <div class="color-tooltip">Primary Dark</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn save-btn primary">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Handle dialog actions
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const saveBtn = dialog.querySelector('.save-btn');
    
    // Color selection
    const colorOptions = dialog.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
      });
    });

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    saveBtn.addEventListener('click', () => {
      // Get values from form
      const appName = dialog.querySelector('#app-name').value.trim();
      const packageName = dialog.querySelector('#package-name').value.trim();
      const projectName = dialog.querySelector('#project-name').value.trim();
      const versionCode = dialog.querySelector('#version-code').value;
      const versionName = dialog.querySelector('#version-name').value.trim();
      const minSdk = dialog.querySelector('#min-sdk').value;
      const selectedColor = dialog.querySelector('.color-option.selected');
      const themeColor = selectedColor ? selectedColor.dataset.color : 'colorAccent';
      
      if (!appName || !packageName || !projectName || !versionName) {
        // Simple validation
        if (!appName) dialog.querySelector('#app-name').classList.add('error');
        if (!packageName) dialog.querySelector('#package-name').classList.add('error');
        if (!projectName) dialog.querySelector('#project-name').classList.add('error');
        if (!versionName) dialog.querySelector('#version-name').classList.add('error');
        return;
      }
      
      // Update app properties
      this.editorView.currentApp.name = appName;
      this.editorView.currentApp.packageName = packageName;
      this.editorView.currentApp.projectName = projectName;
      this.editorView.currentApp.versionCode = versionCode;
      this.editorView.currentApp.versionName = versionName;
      this.editorView.currentApp.minSdk = minSdk;
      this.editorView.currentApp.themeColor = themeColor;
      
      // Save changes
      if (this.editorView.appService.updateApp(this.editorView.currentApp)) {
        // Update UI
        const projectTitle = document.querySelector('.sidebar-section .sidebar-item.active span');
        if (projectTitle) {
          projectTitle.textContent = appName;
        }
        
        // Show success notification
        this.editorView.notificationManager.showNotification('App details updated successfully', 'success');
      } else {
        // Show error notification
        this.editorView.notificationManager.showNotification('Failed to update app details', 'error');
      }
      
      dialog.remove();
    });

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }
}

export default DialogManager; 