class EditorSidebarManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.activeSidebarTabId = 'project'; // Default
        this.projectPanel = null; // Cache element
        this.propertiesPanel = null; // Cache element
    }

    init() {
        this.projectPanel = document.getElementById('project-panel');
        this.propertiesPanel = document.getElementById('properties-panel');
        if (!this.projectPanel || !this.propertiesPanel) {
            console.error("Sidebar panels not found during SidebarManager init.");
            return;
        }
        this.renderProjectPanelContent(); // Initial render
        this.setupEventListeners();
        this.switchSidebarTab(this.activeSidebarTabId); // Set initial active state
    }

    setupEventListeners() {
        const sidebarTabsContainer = document.querySelector('.editor-sidebar .sidebar-tabs');
        if (sidebarTabsContainer) {
            sidebarTabsContainer.addEventListener('click', (e) => {
                const sidebarTabBtn = e.target.closest('.sidebar-tab');
                if (sidebarTabBtn) {
                    const newTabId = sidebarTabBtn.dataset.sidebarTab;
                    this.switchSidebarTab(newTabId);
                }
            });
        }
        
        // Initialize panels
        this.projectPanel = document.getElementById('project-panel');
        this.propertiesPanel = document.getElementById('properties-panel');
        
        if (this.projectPanel) {
            // Delegate click events for project panel
            this.projectPanel.addEventListener('click', (e) => {
                const screenItem = e.target.closest('.screen-item');
                const addScreenBtn = e.target.closest('.add-screen');
                const editAppBtn = e.target.closest('.edit-app-details');
                const editScreenBtn = e.target.closest('.edit-screen-btn');
                const deleteScreenBtn = e.target.closest('.delete-screen-btn');
                const manageLibrariesBtn = e.target.closest('.manage-libraries');

                if (screenItem && !editScreenBtn && !deleteScreenBtn) { // Click on screen item itself
                    const screenId = screenItem.dataset.screenId;
                    if (screenId && screenId !== this.editorView.currentScreen?.id) {
                        this.editorView.onScreenChanged(screenId);
                    }
                } else if (addScreenBtn) {
                    this.editorView.screenManager?.implementation?.showAddScreenDialog();
                } else if (editAppBtn) {
                    this.editorView.dialogManager?.showEditAppDetailsDialog();
                } else if (manageLibrariesBtn) {
                    // Show the library manager dialog
                    if (!this.editorView.libraryManager) {
                        // Lazy initialize the library manager if it doesn't exist
                        const LibraryManager = window.LibraryManager;
                        this.editorView.libraryManager = new LibraryManager(this.editorView);
                    }
                    this.editorView.libraryManager.showLibraryManagerDialog();
                } else if (editScreenBtn) {
                    const screenId = editScreenBtn.dataset.screenId;
                    const screen = this.editorView.currentApp?.screens.find(s => s.id === screenId);
                    if (screen) {
                        this.editorView.dialogManager?.showEditScreenDialog(screenId);
                    }
                } else if (deleteScreenBtn) {
                    const screenId = deleteScreenBtn.dataset.screenId;
                    const screen = this.editorView.currentApp?.screens.find(s => s.id === screenId);
                    if (screen) {
                        this.editorView.dialogManager?.showDeleteScreenDialog(screenId);
                    }
                }
            });
        }
    }

    switchSidebarTab(sidebarTabId) {
        console.log(`Switching sidebar tab to: ${sidebarTabId}`);
        this.activeSidebarTabId = sidebarTabId;

        // Update button active states
        document.querySelectorAll('.sidebar-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sidebarTab === sidebarTabId);
        });
        // Update panel visibility
        document.querySelectorAll('.editor-sidebar .sidebar-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${sidebarTabId}-panel`);
        });
    }

    // Re-renders the content of the Project panel (app name, screens list, buttons)
    renderProjectPanelContent() {
        if (!this.projectPanel || !this.editorView.currentApp) {
            console.warn("Cannot render project panel content: element or app data missing.");
            if(this.projectPanel) this.projectPanel.innerHTML = '<div class="error-message">App data missing.</div>';
            return;
        }

        console.log("Rendering project panel content");
        const currentScreenId = this.editorView.currentScreen?.id;
        const app = this.editorView.currentApp;
        const screens = app.screens || [];

        const screensHtml = screens.map(screen => {
            const isActive = screen.id === currentScreenId;
            const isMainActivity = screen.name === 'MainActivity'; // Assuming MainActivity cannot be edited/deleted
            const canDelete = screens.length > 1 && !isMainActivity;
            
            return `
              <div class="sidebar-item screen-item ${isActive ? 'active' : ''}" data-screen-id="${screen.id}">
                <div class="screen-item-info">
                  <i class="material-icons">phone_android</i>
                  <span>${screen.name}</span>
                </div>
                <div class="screen-item-actions">
                  ${!isMainActivity ? `
                  <button class="screen-action-btn edit-screen-btn" data-screen-id="${screen.id}" title="Edit Screen Name">
                    <i class="material-icons">edit</i>
                  </button>
                  ` : ''}
                  ${canDelete ? 
                    `<button class="screen-action-btn delete-screen-btn" data-screen-id="${screen.id}" title="Delete Screen">
                      <i class="material-icons">delete</i>
                    </button>` : 
                    ''
                  }
                </div>
              </div>
            `;
          }).join('');

        this.projectPanel.innerHTML = `
            <div class="sidebar-section">
              <div class="sidebar-title">PROJECT</div>
              <div class="sidebar-item active app-name-item"><i class="material-icons">phone_android</i><span>${app.name}</span></div>
              <div class="sidebar-item edit-app-details"><i class="material-icons">settings</i><span>App Settings</span></div>
              <div class="sidebar-item manage-libraries"><i class="material-icons">extension</i><span>Libraries & Dependencies</span></div>
            </div>
            <div class="sidebar-section">
              <div class="sidebar-title">SCREENS</div>
              <div class="screens-list">
                ${screensHtml}
              </div>
              <div class="sidebar-item add-screen"><i class="material-icons">add</i><span>Add Screen</span></div>
            </div>
        `;
    }

    // Call this method when the app data (like screens list or app name) changes
    refreshProjectPanel() {
        this.renderProjectPanelContent();
    }
    
     // Call this when a screen is selected to update the active state
     updateActiveScreen(screenId) {
         if (!this.projectPanel) return;
         this.projectPanel.querySelectorAll('.screen-item').forEach(item => {
             item.classList.toggle('active', item.dataset.screenId === screenId);
         });
     }
}

export default EditorSidebarManager; 