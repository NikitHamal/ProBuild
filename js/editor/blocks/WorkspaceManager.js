import NotificationManager from '../utils/NotificationManager.js';

class WorkspaceManager {
    constructor(blocksManager) {
        this.blocksManager = blocksManager; 
        this.editorView = blocksManager.editorView;
        this.notificationManager = new NotificationManager();
        this.workspace = null; // Holds the Blockly workspace instance
    }

    initialize(blocklyDiv, toolboxXml, dropdownHelper) {
        if (!blocklyDiv) {
            console.error("Blockly container div not found for initialization!");
            return null;
        }
        
        // Check if Blockly is loaded properly
        if (typeof Blockly === 'undefined') {
            console.error("Blockly not loaded! Make sure the script tags are properly included.");
            this.notificationManager.showNotification('Blockly library not loaded correctly.', 'error');
            return null;
        }
        
        if (this.workspace) {
            console.warn("Disposing existing Blockly workspace before re-initialization.");
            this.dispose();
        }

        try {
            // Ensure JavaScript generators are ready (idempotent)
            if (typeof Blockly !== 'undefined' && typeof Blockly.JavaScript !== 'undefined') {
                 Object.keys(Blockly.Blocks).forEach(blockType => {
                    if (!Blockly.JavaScript[blockType]) {
                        console.warn(`Creating placeholder JS generator for: ${blockType}`);
                        Blockly.JavaScript[blockType] = function(block) {
                            return `// Missing generator for ${blockType}\n`;
                        };
                    }
                 });
            } else {
                throw new Error('Blockly or Blockly.JavaScript not loaded!');
            }

            // Verify the DOM element is attached to the document
            if (!document.body.contains(blocklyDiv)) {
                console.error("Blockly div exists but is not attached to the document!");
                this.notificationManager.showNotification('Error: Blockly container not in document.', 'error');
                return null;
            }

            console.log("Initializing Blockly workspace with dimensions:", 
                        `Width: ${blocklyDiv.offsetWidth}px, Height: ${blocklyDiv.offsetHeight}px`);

            // Override default Blockly dialogs
            this.overrideDialogs();

            // Inject Blockly workspace
            this.workspace = Blockly.inject(blocklyDiv, {
                toolbox: toolboxXml,
                renderer: 'geras',
                theme: Blockly.Themes.Zelos,
                grid: {
                    spacing: 25,
                    length: 3,
                    colour: '#ccc',
                    snap: true
                },
                zoom: {
                    controls: true,
                    wheel: true,
                    startScale: 1.0,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2
                },
                trashcan: true
            });

            // Initialize JavaScript Generator for this Workspace
            Blockly.JavaScript.init(this.workspace);

            // Load initial state
            this.loadState();

            // Add listener for changes
            this.workspace.addChangeListener((event) => this.onWorkspaceChange(event));
            
            console.log("Blockly workspace initialized successfully.");
            return this.workspace;

        } catch (e) {
            console.error("Error initializing Blockly workspace:", e);
            this.notificationManager.showNotification("Failed to initialize blocks editor.", "error");
            return null;
        }
    }
    
    getWorkspace() {
        return this.workspace;
    }

    dispose() {
        if (this.workspace) {
            this.workspace.dispose();
            this.workspace = null;
            console.log("Blockly workspace disposed.");
        }
    }

    overrideDialogs() {
        const dialogManager = this.editorView.dialogManager;
        if (!dialogManager) {
            console.warn("DialogManager not found, cannot override Blockly dialogs.");
            return;
        }
        try {
            Blockly.dialog.setPrompt((message, defaultValue, callback) => {
                dialogManager.showPromptDialog('Blockly Prompt', message, defaultValue, callback);
            });
            Blockly.dialog.setConfirm((message, callback) => {
                dialogManager.showConfirmDialog('Blockly Confirm', message, callback);
            });
            Blockly.dialog.setAlert((message, callback) => {
                dialogManager.showConfirmDialog('Blockly Alert', message, () => { if (callback) callback(); });
            });
        } catch(e) {
            console.error("Error overriding Blockly dialogs:", e);
            // Fallback to default dialogs if override fails
            Blockly.dialog.setPrompt = window.prompt;
            Blockly.dialog.setConfirm = window.confirm;
            Blockly.dialog.setAlert = window.alert;
        }
    }

    onWorkspaceChange(event) {
        // Auto-save or mark as dirty on significant changes
        if (event.type !== Blockly.Events.UI) { // Ignore UI events
            // Example: Save on block move/create/delete/change
            if (event.type === Blockly.Events.BLOCK_MOVE ||
                event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_DELETE ||
                event.type === Blockly.Events.BLOCK_CHANGE) {
                
                this.saveState(); // Auto-save blocks
                
                // Trigger code update in CodeManager via BlocksManager
                if (this.blocksManager) {
                    this.blocksManager.triggerCodeUpdate();
                }
            }
        }
    }

    saveState() {
        if (!this.workspace) return;
        // Get currentScreen DIRECTLY from EditorView
        const currentScreen = this.editorView?.currentScreen;
        if (!currentScreen) {
            console.warn("WorkspaceManager.saveState: Cannot save blocks, editorView.currentScreen is missing.");
            return;
        }

        try {
            const workspaceState = Blockly.serialization.workspaces.save(this.workspace);
            // Store state directly onto the screen object in the main app data model
            currentScreen.blocksState = workspaceState; 
            // console.log(`Blocks state saved to currentScreen object: ${currentScreen.name}`);
             // No direct localStorage.setItem here - EditorView.saveApp handles persistence
        } catch (e) {
            console.error("Error serializing Blockly workspace state:", e);
            this.notificationManager.showNotification('Error preparing blocks for saving!', 'error');
        }
    }

    loadState() {
        if (!this.workspace) return;
        // Get currentScreen DIRECTLY from EditorView
        const currentScreen = this.editorView?.currentScreen;
        if (!currentScreen) {
            console.warn("WorkspaceManager.loadState: Cannot load blocks, editorView.currentScreen is missing.");
            return;
        }

        // Retrieve state from the screen object in the main app data model
        const savedState = currentScreen.blocksState;

        if (savedState) {
            try {
                // Blockly.serialization.workspaces.load clears the workspace first
                Blockly.serialization.workspaces.load(savedState, this.workspace);
                // console.log(`Blocks state loaded from currentScreen object: ${currentScreen.name}`);
            } catch (e) {
                console.error("Error loading Blockly workspace state from screen object:", e);
                this.notificationManager.showNotification('Could not load saved blocks for this screen.', 'error');
                // Clear corrupted state from the model (optional, but recommended)
                delete currentScreen.blocksState;
                this.workspace.clear(); // Clear the workspace
                // Optionally try loading defaults or leave it empty
                // this.loadDefaultState(); 
            }
        } else {
            // No saved state found on the screen object, clear workspace 
            // (load might have left old blocks)
            this.workspace.clear();
            // console.log(`No saved blocks found on screen object ${currentScreen.name}. Workspace cleared.`);
            // Optionally load defaults
            // this.loadDefaultState();
        }
    }

    loadDefaultState() {
        if (!this.workspace) return;
        // Default blocks are intentionally not loaded per previous request
        const topBlocks = this.workspace.getTopBlocks(false);
        if (topBlocks.length === 0) {
             console.log("Workspace is empty, default blocks are intentionally not loaded.");
             // If you wanted defaults back, add them here using this.workspace.newBlock(...)
        }
    }

    updateScreenReferences(screenId, oldName, newName) {
        if (!this.workspace) return;
        // TODO: Implement logic to find and update blocks referencing screen names if needed
        console.warn("updateScreenReferences not fully implemented.");
        // Example placeholder:
        // const blocks = this.workspace.getAllBlocks();
        // blocks.forEach(block => { ... });
        // this.saveState(); 
    }

    updateComponentIdReferences(oldId, newId) {
        if (!this.workspace) return;
        
        const allBlocks = this.workspace.getAllBlocks(false); // Get all blocks
        let changed = false;

        allBlocks.forEach(block => {
            if (!block.isDisposed() && block.isEnabled()) { // Check if block is valid
                const fields = block.inputList.flatMap(input => input.fieldRow);
                
                fields.forEach(field => {
                    // Check for dropdown fields that might hold the component ID
                    if (field instanceof Blockly.FieldDropdown && typeof field.getValue === 'function') {
                         if (field.getValue() === oldId) {
                            try {
                                field.setValue(newId); // Update the field value
                                changed = true;
                            } catch(e) {
                                console.warn(`Error updating component ID in block ${block.type}:`, e);
                            }
                        }
                    }
                    // Add checks for other field types if necessary (e.g., text inputs)
                });
            }
        });
        
        if (changed) {
            console.log(`Updated component references in blocks from ${oldId} to ${newId}`);
            this.workspace.render(); // Re-render if changes were made
            this.saveState(); // Save changes immediately
        }
    }
}

export default WorkspaceManager; 