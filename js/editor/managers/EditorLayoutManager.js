class EditorLayoutManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.componentSearchInput = null; // Cache element
    }

    init() {
        // Called after initial render to setup specific listeners for layout elements
        this.setupLayoutEventListeners();
    }

    renderInitialLayout() {
        if (!this.editorView.currentApp || !this.editorView.currentScreen) {
             console.error("Cannot render layout: currentApp or currentScreen is missing.");
             // Maybe redirect or show error message
             document.body.innerHTML = '<div class="error-message">Error loading editor. App data missing.</div>';
             return;
        }
        
        console.log("Rendering initial editor layout...");
        
        // Build the main structure
        const layoutHtml = `
          <div class="editor-container">
            ${this._renderComponentsSidebar()}
            <div class="editor-workspace">
              ${this._renderEditorHeader()}
              ${this._renderEditorWorkspaceContent()}
            </div>
            ${this._renderEditorSidebar()}
          </div>
        `;
        
        document.body.innerHTML = layoutHtml;

         // Invalidate caches in other managers that might rely on DOM elements just created
        this.editorView.devicePreviewManager?.invalidateCache();
        // Add other managers as needed

         console.log("Initial editor layout rendered.");
         
        // Call init for managers that need to run setup *after* the main layout is in the DOM
        this.init(); // Setup layout-specific listeners
        this.editorView.sidebarManager?.init();
        this.editorView.tabManager?.init();
        this.editorView.devicePreviewManager?.init(); 
        this.editorView.undoRedoManager?.init(); 
        this.editorView.componentManager?.setupDesignTabEvents(); // Correct method call
        
        // Apply initial settings that depend on the rendered layout
        // this.editorView.devicePreviewManager?.updateDevicePreviewSize(); // Now called in DevicePreviewManager.init()
        // this.editorView.tabManager?.switchTab(this.editorView.activeTab || 'design'); // Now called in EditorView.init()
        // this.editorView.undoRedoManager?.updateButtons(); // Now called in UndoRedoManager.init()
    }

    _renderComponentsSidebar() {
        console.log("Rendering components sidebar");
        // Added search input
        return `
          <div class="components-sidebar">
            <div class="sidebar-section" style="padding: 8px;">
              <input type="search" id="component-search" placeholder="Search components..." class="property-input" style="width: 100%; font-size: 0.9rem; padding: 4px 6px;">
            </div>
            <div class="components-list">
              <div class="sidebar-title" style="padding: 8px 12px;">Layouts</div>
              <div class="component-item" data-type="linearlayout-h" draggable="true"><i class="material-icons">view_week</i><div class="component-name">LinearLayout (H)</div></div>
              <div class="component-item" data-type="linearlayout-v" draggable="true"><i class="material-icons">view_day</i><div class="component-name">LinearLayout (V)</div></div>
              <div class="component-item" data-type="scrollview-h" draggable="true"><i class="material-icons">swap_horiz</i><div class="component-name">ScrollView (H)</div></div>
              <div class="component-item" data-type="scrollview-v" draggable="true"><i class="material-icons">swap_vert</i><div class="component-name">ScrollView (V)</div></div>
              <div class="component-item" data-type="cardview" draggable="true"><i class="material-icons">crop_square</i><div class="component-name">CardView</div></div>
              
              <div class="sidebar-title" style="padding: 8px 12px; margin-top: 10px;">Widgets</div>
              <div class="component-item" data-type="textview" draggable="true"><i class="material-icons">text_fields</i><div class="component-name">TextView</div></div>
              <div class="component-item" data-type="button" draggable="true"><i class="material-icons">smart_button</i><div class="component-name">Button</div></div>
              <div class="component-item" data-type="edittext" draggable="true"><i class="material-icons">edit</i><div class="component-name">EditText</div></div>
              <div class="component-item" data-type="imageview" draggable="true"><i class="material-icons">image</i><div class="component-name">ImageView</div></div>
              <div class="component-item" data-type="checkbox" draggable="true"><i class="material-icons">check_box</i><div class="component-name">CheckBox</div></div>
              <div class="component-item" data-type="radiobutton" draggable="true"><i class="material-icons">radio_button_checked</i><div class="component-name">RadioButton</div></div>
              <div class="component-item" data-type="switch" draggable="true"><i class="material-icons">toggle_on</i><div class="component-name">Switch</div></div>
              <div class="component-item" data-type="progressbar" draggable="true"><i class="material-icons">linear_scale</i><div class="component-name">ProgressBar</div></div>
              <div class="component-item" data-type="seekbar" draggable="true"><i class="material-icons">tune</i><div class="component-name">SeekBar</div></div>
              <div class="component-item" data-type="spinner" draggable="true"><i class="material-icons">arrow_drop_down_circle</i><div class="component-name">Spinner</div></div>
              <div class="component-item" data-type="listview" draggable="true"><i class="material-icons">list</i><div class="component-name">ListView</div></div>
              <div class="component-item" data-type="webview" draggable="true"><i class="material-icons">web</i><div class="component-name">WebView</div></div>
              
              <div class="sidebar-title" style="padding: 8px 12px; margin-top: 10px;">Advanced Widgets</div>
              <div class="component-item" data-type="floatingactionbutton" draggable="true"><i class="material-icons">add_circle</i><div class="component-name">FloatingActionButton</div></div>
              <div class="component-item" data-type="togglebutton" draggable="true"><i class="material-icons">toggle_off</i><div class="component-name">ToggleButton</div></div>
              <div class="component-item" data-type="ratingbar" draggable="true"><i class="material-icons">star_rate</i><div class="component-name">RatingBar</div></div>
              <div class="component-item" data-type="videoview" draggable="true"><i class="material-icons">videocam</i><div class="component-name">VideoView</div></div>
              <div class="component-item" data-type="datepicker" draggable="true"><i class="material-icons">date_range</i><div class="component-name">DatePicker</div></div>
              <div class="component-item" data-type="timepicker" draggable="true"><i class="material-icons">access_time</i><div class="component-name">TimePicker</div></div>
              <div class="component-item" data-type="chip" draggable="true"><i class="material-icons">label</i><div class="component-name">Chip</div></div>
              <div class="component-item" data-type="chipgroup" draggable="true"><i class="material-icons">label_important</i><div class="component-name">ChipGroup</div></div>
              <div class="component-item" data-type="slider" draggable="true"><i class="material-icons">tune</i><div class="component-name">Slider</div></div>
              
              <div class="sidebar-title" style="padding: 8px 12px; margin-top: 10px;">Material Design</div>
              <div class="component-item" data-type="constraintlayout" draggable="true"><i class="material-icons">dashboard</i><div class="component-name">ConstraintLayout</div></div>
              <div class="component-item" data-type="recyclerview" draggable="true"><i class="material-icons">view_list</i><div class="component-name">RecyclerView</div></div>
              <div class="component-item" data-type="tablayout" draggable="true"><i class="material-icons">tab</i><div class="component-name">TabLayout</div></div>
              <div class="component-item" data-type="bottomnavigation" draggable="true"><i class="material-icons">menu</i><div class="component-name">BottomNavigation</div></div>
              <div class="component-item" data-type="toolbar" draggable="true"><i class="material-icons">web_asset</i><div class="component-name">Toolbar</div></div>
              <div class="component-item" data-type="drawerlayout" draggable="true"><i class="material-icons">menu_open</i><div class="component-name">DrawerLayout</div></div>
            </div>
          </div>
        `;
    }

    _renderEditorHeader() {
        console.log("Rendering editor header");
        const screenName = this.editorView.currentScreen?.name || 'Loading...';

        // Access managers via editorView
        const buildManager = this.editorView.buildWorkflowManager;
        const previewManager = this.editorView.previewManager;

        return `
          <div class="editor-header">
            <div class="editor-title">
              <i class="material-icons">edit</i>
              <span id="current-screen-title">${screenName}</span>
            </div>
            <div class="editor-actions">
              <button id="undo-btn" class="editor-action-btn" title="Undo" disabled><i class="material-icons">undo</i></button>
              <button id="redo-btn" class="editor-action-btn" title="Redo" disabled><i class="material-icons">redo</i></button>
              <button id="save-app-btn" class="editor-action-btn primary"><i class="material-icons">save</i>Save</button>
              <button id="preview-app-btn" class="editor-action-btn" style="background-color: #2196F3; color: white;"><i class="material-icons">visibility</i>Preview</button>
              <button id="build-app-btn" class="editor-action-btn" style="background-color: #4CAF50; color: white;"><i class="material-icons">build</i>Build</button>
            </div>
          </div>
        `;
    }

    _renderEditorWorkspaceContent() {
        console.log("Rendering editor workspace content structure");
        // Render the container, TabManager will fill it
        return `
          <div class="editor-content">
            <div class="editor-main">
              <div class="editor-tabs">
                <div class="editor-tab active" data-tab="design">Design</div>
                <div class="editor-tab" data-tab="blocks">Blocks</div>
                <div class="editor-tab" data-tab="code">Code</div>
              </div>
              <div class="editor-panel" id="editor-panel">
                <!-- Content will be loaded by TabManager -->
              </div>
            </div>
          </div>
        `;
    }

    _renderEditorSidebar() {
        console.log("Rendering editor sidebar structure");
        // SidebarManager will handle populating the dynamic parts and events
         return `
            <div class="editor-sidebar">
              <div class="sidebar-tabs">
                <div class="sidebar-tab active" data-sidebar-tab="project">PROJECT</div>
                <div class="sidebar-tab" data-sidebar-tab="properties">PROPERTIES</div>
              </div>
              
              <div class="sidebar-panel active" id="project-panel">
                <!-- Content managed by EditorSidebarManager -->
              </div>
              
              <div class="sidebar-panel" id="properties-panel">
                ${this.editorView.propertyPanel.renderSidebarPropertyPanel()}
              </div>
            </div>
        `;
    }

    setupLayoutEventListeners() {
        console.log("Setting up layout event listeners");
        // Component search
        this.componentSearchInput = document.getElementById('component-search');
        if (this.componentSearchInput) {
            this.componentSearchInput.addEventListener('input', (e) => {
                this.handleComponentSearch(e);
            });
        }

        // --- Header Button Listeners ---
        const saveAppBtn = document.getElementById('save-app-btn');
        if (saveAppBtn) {
            saveAppBtn.addEventListener('click', () => {
                this.editorView.saveApp(); // Delegate to main EditorView method
            });
        }

        const previewAppBtn = document.getElementById('preview-app-btn');
        if (previewAppBtn) {
            previewAppBtn.addEventListener('click', () => {
                this.editorView.previewManager?.launchAppPreview();
            });
        }

        const buildAppBtn = document.getElementById('build-app-btn');
        if (buildAppBtn) {
            buildAppBtn.addEventListener('click', () => {
                this.editorView.buildWorkflowManager?.startBuildProcess();
            });
        }
        
        // Note: Undo/Redo button listeners are in UndoRedoManager
        // Note: Device selector listener is in DevicePreviewManager
    }

    handleComponentSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const componentItems = document.querySelectorAll('.components-list .component-item');
        componentItems.forEach(item => {
            const nameElement = item.querySelector('.component-name');
            const componentName = nameElement ? nameElement.textContent.toLowerCase() : '';
            item.style.display = componentName.includes(searchTerm) ? '' : 'none';
        });
    }

    updateScreenTitle(screenName) {
        const titleElement = document.getElementById('current-screen-title');
        if (titleElement) {
            titleElement.textContent = screenName;
        } else {
             console.warn('Screen title element (#current-screen-title) not found for update.');
        }
    }
}

export default EditorLayoutManager; 