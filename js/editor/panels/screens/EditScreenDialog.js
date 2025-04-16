class EditScreenDialog {
  constructor(screenManager) {
    this.screenManager = screenManager;
    this.editorView = screenManager.editorView;
  }
  
  show(screenId) {
    const screen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (!screen) return;
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Edit Screen</h2>
        <div class="dialog-content">
          <div class="form-group">
            <label for="screen-name">Screen Name</label>
            <input type="text" id="screen-name" placeholder="Screen Name" value="${screen.name}">
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn save-btn primary">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    this.setupEventListeners(dialog, screen);
  }
  
  setupEventListeners(dialog, screen) {
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const saveBtn = dialog.querySelector('.save-btn');
    const nameInput = dialog.querySelector('#screen-name');

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    saveBtn.addEventListener('click', () => {
      this.updateScreen(nameInput, dialog, screen);
    });
    
    // Focus input and select all text
    nameInput.focus();
    nameInput.select();

    // Handle enter key
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.updateScreen(nameInput, dialog, screen);
      }
    });

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }
  
  updateScreen(nameInput, dialog, screen) {
    const screenName = nameInput.value.trim();
    if (screenName) {
      // Update screen name
      screen.name = screenName;
      
      // Save app
      const result = this.editorView.appService.updateApp(this.editorView.currentApp);
      
      if (result) {
        // Update UI
        this.screenManager.renderScreensList();
        
        // Update screen title if it's the current screen
        if (screen.id === this.editorView.currentScreen.id) {
          const screenTitle = document.querySelector('.editor-title');
          if (screenTitle) {
            screenTitle.innerHTML = `<i class="material-icons">edit</i> ${screen.name}`;
          }
        }
        
        dialog.remove();
      } else {
        alert('Failed to update screen');
      }
    } else {
      nameInput.classList.add('error');
      nameInput.placeholder = 'Please enter a name';
    }
  }
}

export default EditScreenDialog; 