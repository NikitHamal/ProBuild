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

  showEditScreenDialog(screenId) {
    const app = this.editorView.currentApp;
    const screen = app.screens.find(s => s.id === screenId);
    
    if (!screen) {
      this.editorView.notificationManager.showNotification('Screen not found', 'error');
      return;
    }

    // Prevent editing MainActivity
    if (screen.name === 'MainActivity') {
      this.editorView.notificationManager.showNotification('MainActivity cannot be renamed.', 'warning');
      return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Edit Screen</h2>
        <div class="dialog-content">
          <div class="form-group">
            <label for="screen-name">Screen Name</label>
            <input type="text" id="screen-name" placeholder="Screen Name" value="${screen.name}">
            <div class="form-help">Activity name must follow Java class naming conventions.</div>
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
    const nameInput = dialog.querySelector('#screen-name');
    
    // Focus and select all text in the input
    nameInput.focus();
    nameInput.select();
    
    // Make enter key save the screen
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveScreen();
      }
    });

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    const saveScreen = () => {
      const screenName = nameInput.value.trim();
      
      if (!screenName) {
        nameInput.classList.add('error');
        nameInput.placeholder = 'Screen name cannot be empty';
        return;
      }
      
      // Validate Java class name (starts with letter, contains only letters, numbers, and underscore)
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(screenName)) {
        nameInput.classList.add('error');
        nameInput.value = '';
        nameInput.placeholder = 'Invalid Java class name format';
        return;
      }
      
      // Check for duplicate screen names
      const isDuplicate = app.screens.some(s => s.id !== screen.id && s.name === screenName);
      if (isDuplicate) {
        nameInput.classList.add('error');
        nameInput.value = '';
        nameInput.placeholder = 'A screen with this name already exists';
        return;
      }
      
      // Store the old screen name for reference updates
      const oldScreenName = screen.name;
      
      // Update screen name
      screen.name = screenName;
      
      // Save app
      const success = this.editorView.appService.updateApp(app);
      
      if (success) {
        // Update UI if this is the current screen
        if (this.editorView.currentScreen.id === screen.id) {
          // Update the editor title
          const editorTitle = document.querySelector('.editor-title');
          if (editorTitle) {
            editorTitle.innerHTML = `<i class="material-icons">edit</i> ${screenName}`;
          }
          
          // Update the current screen object
          this.editorView.currentScreen.name = screenName;
        }
        
        // Re-render sidebar
        const sidebarScreens = document.querySelector('.screens-list');
        if (sidebarScreens) {
          sidebarScreens.innerHTML = this.editorView.currentApp.screens.map(s => {
            const isActive = s.id === this.editorView.currentScreen.id;
            return `
              <div class="sidebar-item screen-item ${isActive ? 'active' : ''}" data-screen-id="${s.id}">
                <div class="screen-item-info">
                  <i class="material-icons">phone_android</i>
                  <span>${s.name}</span>
                </div>
                <div class="screen-item-actions">
                  <button class="screen-action-btn edit-screen-btn" data-screen-id="${s.id}" title="Edit Screen">
                    <i class="material-icons">edit</i>
                  </button>
                  ${this.editorView.currentApp.screens.length > 1 ? 
                    `<button class="screen-action-btn delete-screen-btn" data-screen-id="${s.id}" title="Delete Screen">
                      <i class="material-icons">delete</i>
                    </button>` : 
                    ''
                  }
                </div>
              </div>
            `;
          }).join('');
        }

        // Update block manager and code manager references to this screen
        if (this.editorView.blocksManager) {
          this.editorView.blocksManager.updateScreenReferences(screen.id, oldScreenName, screenName);
        }
        
        if (this.editorView.codeManager) {
          this.editorView.codeManager.updateScreenReferences(screen.id, oldScreenName, screenName);
        }
        
        // Set up event listeners again for the new screen items
        this.editorView.setupEventListeners();
        
        // Show success notification
        this.editorView.notificationManager.showNotification(`Screen renamed to ${screenName}`, 'success');
      } else {
        this.editorView.notificationManager.showNotification('Failed to rename screen', 'error');
      }
      
      dialog.remove();
    };

    saveBtn.addEventListener('click', saveScreen);

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  showDeleteScreenDialog(screenId) {
    const app = this.editorView.currentApp;
    const screen = app.screens.find(s => s.id === screenId);
    
    if (!screen) {
      this.editorView.notificationManager.showNotification('Screen not found', 'error');
      return;
    }

    // Prevent deleting MainActivity
    if (screen.name === 'MainActivity') {
      this.editorView.notificationManager.showNotification('MainActivity cannot be deleted.', 'warning');
      return;
    }
    
    // Don't allow deleting the only screen
    if (app.screens.length <= 1) {
      this.editorView.notificationManager.showNotification('Cannot delete the only screen', 'error');
      return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Delete Screen</h2>
        <div class="dialog-content">
          <p>Are you sure you want to delete the screen "${screen.name}"?</p>
          <p class="warning"><i class="material-icons">warning</i> This action cannot be undone.</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn delete-btn danger">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Handle dialog actions
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const deleteBtn = dialog.querySelector('.delete-btn');

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    deleteBtn.addEventListener('click', () => {
      // Store a reference to the screen name for notifications
      const screenName = screen.name;
      
      // Check if this is the current screen
      const isCurrentScreen = this.editorView.currentScreen.id === screenId;
      
      // Find a new screen to switch to if this is the current screen
      let newScreenId = null;
      if (isCurrentScreen) {
        const otherScreen = app.screens.find(s => s.id !== screenId);
        if (otherScreen) {
          newScreenId = otherScreen.id;
        }
      }
      
      // Delete the screen
      const success = this.editorView.appService.deleteScreen(app.id, screenId);
      
      if (success) {
        // If this was the current screen, switch to another screen
        if (isCurrentScreen && newScreenId) {
          this.editorView.onScreenChanged(newScreenId);
        }
        
        // Re-render sidebar
        const sidebarScreens = document.querySelector('.screens-list');
        if (sidebarScreens) {
          sidebarScreens.innerHTML = this.editorView.currentApp.screens.map(s => {
            const isActive = s.id === this.editorView.currentScreen.id;
            return `
              <div class="sidebar-item screen-item ${isActive ? 'active' : ''}" data-screen-id="${s.id}">
                <div class="screen-item-info">
                  <i class="material-icons">phone_android</i>
                  <span>${s.name}</span>
                </div>
                <div class="screen-item-actions">
                  <button class="screen-action-btn edit-screen-btn" data-screen-id="${s.id}" title="Edit Screen">
                    <i class="material-icons">edit</i>
                  </button>
                  ${this.editorView.currentApp.screens.length > 1 ? 
                    `<button class="screen-action-btn delete-screen-btn" data-screen-id="${s.id}" title="Delete Screen">
                      <i class="material-icons">delete</i>
                    </button>` : 
                    ''
                  }
                </div>
              </div>
            `;
          }).join('');
        }
        
        // Set up event listeners again for the new screen items
        this.editorView.setupEventListeners();
        
        // Show success notification
        this.editorView.notificationManager.showNotification(`Screen ${screenName} deleted`, 'success');
      } else {
        this.editorView.notificationManager.showNotification('Failed to delete screen', 'error');
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

  // --- Generic Dialogs for Blockly --- 

  showPromptDialog(title, message, defaultValue, callback) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog" style="max-width: 400px;">
        <h2 class="dialog-title">${title}</h2>
        <div class="dialog-content">
          <p>${message}</p>
          <div class="form-group" style="margin-top: 16px;">
            <input type="text" id="prompt-input" value="${defaultValue}" placeholder="Enter value...">
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn ok-btn primary">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const cancelBtn = dialog.querySelector('.cancel-btn');
    const okBtn = dialog.querySelector('.ok-btn');
    const input = dialog.querySelector('#prompt-input');
    
    // Focus and select
    input.focus();
    input.select();

    const closeDialog = (value) => {
      dialog.remove();
      callback(value); // Pass null if cancelled
    };

    cancelBtn.addEventListener('click', () => closeDialog(null));
    okBtn.addEventListener('click', () => closeDialog(input.value));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        closeDialog(input.value);
      }
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog(null); // Cancel on click outside
      }
    });
  }

  showConfirmDialog(title, message, callback) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog" style="max-width: 400px;">
        <h2 class="dialog-title">${title}</h2>
        <div class="dialog-content">
          <p>${message}</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn ok-btn primary">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const cancelBtn = dialog.querySelector('.cancel-btn');
    const okBtn = dialog.querySelector('.ok-btn');

    const closeDialog = (value) => {
      dialog.remove();
      callback(value); // Pass false if cancelled, true if OK
    };

    cancelBtn.addEventListener('click', () => closeDialog(false));
    okBtn.addEventListener('click', () => closeDialog(true));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog(false); // Cancel on click outside
      }
    });
  }
}

export default DialogManager; 