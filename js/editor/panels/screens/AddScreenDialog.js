class AddScreenDialog {
  constructor(screenManager) {
    this.screenManager = screenManager;
    this.editorView = screenManager.editorView;
  }
  
  show() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <h2 class="dialog-title">Add New Screen</h2>
        <div class="dialog-content">
          <div class="form-group">
            <label for="screen-name">Screen Name</label>
            <input type="text" id="screen-name" placeholder="Screen Name">
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn">Cancel</button>
          <button class="dialog-btn create-btn primary">Create</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    this.setupEventListeners(dialog);
  }
  
  setupEventListeners(dialog) {
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const createBtn = dialog.querySelector('.create-btn');
    const nameInput = dialog.querySelector('#screen-name');

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
    });

    createBtn.addEventListener('click', () => {
      this.createScreen(nameInput, dialog);
    });
    
    // Focus input
    nameInput.focus();

    // Handle enter key
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.createScreen(nameInput, dialog);
      }
    });

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }
  
  createScreen(nameInput, dialog) {
    const screenName = nameInput.value.trim();
    if (screenName) {
      const newScreen = this.editorView.appService.addScreen(this.editorView.currentApp.id, screenName);
      if (newScreen) {
        // Update UI
        const screensList = document.querySelector('.screens-list');
        if (screensList) {
          screensList.innerHTML = this.screenManager.renderScreensList();
          this.screenManager.setCurrentScreen(newScreen.id);
          this.editorView.setupEventListeners();
        }
      }
      dialog.remove();
    } else {
      nameInput.classList.add('error');
      nameInput.placeholder = 'Please enter a name';
    }
  }
}

export default AddScreenDialog; 