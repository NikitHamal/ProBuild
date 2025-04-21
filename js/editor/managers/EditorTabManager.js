class EditorTabManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.activeTabId = 'design'; // Default active tab
        this.editorPanel = null; // Cache element
    }

    init() {
        this.editorPanel = document.getElementById('editor-panel');
        if (!this.editorPanel) {
             console.error("Editor panel (#editor-panel) not found during TabManager init.");
             return;
        }
        this.setupEventListeners();
        this.switchTab(this.activeTabId); // Activate the initial tab
    }

    setupEventListeners() {
        const editorTabsContainer = document.querySelector('.editor-tabs');
        if (editorTabsContainer) {
             // Use event delegation on the container
            editorTabsContainer.addEventListener('click', (e) => {
                const tabElement = e.target.closest('.editor-tab');
                if (tabElement && tabElement.dataset.tab) {
                     e.preventDefault();
                     e.stopPropagation();
                     this.switchTab(tabElement.dataset.tab);
                }
            });
        } else {
            console.error("Editor tabs container (.editor-tabs) not found.");
        }
    }

    switchTab(tabId) {
        // Save state of the *previous* tab if necessary (e.g., save blocks before leaving)
        if (this.activeTabId === 'blocks') {
             console.log("Saving blocks state before switching tabs...");
             this.editorView.blocksManager?.saveBlocks();
        }
        // Add similar checks for other tabs if they need specific saving actions before switching away

        console.log(`Switching FROM tab: ${this.activeTabId} TO tab: ${tabId}`); // Log previous tab too
        this.activeTabId = tabId;
        this.editorView.activeTab = tabId; // Keep EditorView informed

        // Update tab UI (active class)
        document.querySelectorAll('.editor-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabId);
        });

        if (!this.editorPanel) {
            console.error("Editor panel not available to switch tab content.");
            return;
        }

        // Render the specific content for the tab
        this._renderTabContent(tabId);

        // Handle post-render initialization and property panel visibility
        this._handleTabSwitchSideEffects(tabId);
        
        console.log(`Switched to ${tabId} tab successfully.`);
    }

    _renderTabContent(tabId) {
        let content = '';
        switch (tabId) {
            case 'design':
                // Render design canvas structure
                content = `
                  <div class="canvas-container">
                    <div class="phone-preview"> 
                      <div class="phone-status-bar"></div>
                      <div class="phone-content" id="preview-container">
                        <div id="alignment-guides"></div> 
                        <div id="dimension-overlay"></div> 
                        <!-- Components will be rendered here by ComponentManager -->
                      </div>
                    </div>
                  </div>
                `;
                break;
            case 'blocks':
                content = this.editorView.blocksManager?.renderBlocksTab() || '<div class="error-message">Blocks Manager not available.</div>';
                break;
            case 'code':
                content = this.editorView.codeManager?.renderCodeTab() || '<div class="error-message">Code Manager not available.</div>';
                break;
            default:
                content = '<div>Tab content not found</div>';
                break;
        }
        this.editorPanel.innerHTML = content;
    }

    _handleTabSwitchSideEffects(tabId) {
        let hidePropertyPanel = true; 

        // Specific actions needed AFTER the content is rendered
        switch (tabId) {
            case 'design':
                this.editorView.componentManager?.renderComponentsPreview(); // Render components into the preview container
                this.editorView.devicePreviewManager?.updateDevicePreviewSize(); // Ensure preview size is correct
                hidePropertyPanel = false; // Show property panel (conditionally)
                break;
            case 'blocks':
                if (this.editorView.blocksManager && typeof this.editorView.blocksManager.initializeBlockly === 'function') {
                    this.editorView.blocksManager.initializeBlockly();
                } else {
                    console.error("Cannot initialize Blockly, BlocksManager or initializeBlockly missing.");
                }
                hidePropertyPanel = true;
                break;
            case 'code':
                 // Ensure Blocks Workspace is Ready first
                if (this.editorView.blocksManager && typeof this.editorView.blocksManager.ensureWorkspaceReady === 'function') {
                    this.editorView.blocksManager.ensureWorkspaceReady();
                } else {
                    console.error("Cannot ensure blocks workspace ready, BlocksManager or method missing.");
                }
                
                const generatedCode = this.editorView.blocksManager?.getGeneratedCode();
                
                if (this.editorView.codeManager) {
                    this.editorView.codeManager.initializeEditorAndListeners();
                    this.editorView.codeManager.updateCodeFromBlocks(generatedCode);
                } else {
                    console.error("CodeManager not available for initialization or update.");
                }
                hidePropertyPanel = true;
                break;
             default:
                 hidePropertyPanel = true;
                 break;
        }

        // Update Property Panel Visibility (delegate to PropertyPanel or EditorView)
        this.editorView.updatePropertyPanelVisibility(hidePropertyPanel);
    }
    
    // Called by EditorView when the screen changes
    handleScreenChange() {
        console.log(`TabManager handling screen change for active tab: ${this.activeTabId}`);
         // Re-render content or update managers based on the currently active tab
        switch (this.activeTabId) {
            case 'design':
                this.editorView.componentManager?.renderComponentsPreview();
                break;
            case 'blocks':
                this.editorView.blocksManager?.changeScreen(this.editorView.currentScreen.id);
                break;
            case 'code':
                this.editorView.codeManager?.changeScreen(this.editorView.currentScreen.id);
                 // Optionally regenerate and display code for the new screen immediately
                 // Or wait for user to switch back to tab? For now, let changeScreen handle it.
                break;
        }
    }
}

export default EditorTabManager; 