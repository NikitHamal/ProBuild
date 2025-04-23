import { 
  AddComponentCommand,
  DeleteComponentCommand,
  // UpdatePropertyCommand, // Now handled in specific handlers/commands
  // MoveComponentCommand // Now handled in specific handlers/commands
} from '../commands/ComponentCommands.js';

// Import the new handlers
import DragDropHandler from './handlers/DragDropHandler.js';
import ComponentRenderer from './handlers/ComponentRenderer.js';
import ComponentInteractionHandler from './handlers/ComponentInteractionHandler.js';
import ResizeHandler from './handlers/ResizeHandler.js';
import AlignmentOverlayHandler from './handlers/AlignmentOverlayHandler.js';

class ComponentManager {
  constructor(editorView) {
    this.editorView = editorView;

    // Instantiate handlers, passing references
    this.dragDropHandler = new DragDropHandler(editorView, this);
    this.componentRenderer = new ComponentRenderer(editorView, this);
    this.interactionHandler = new ComponentInteractionHandler(editorView, this);
    this.resizeHandler = new ResizeHandler(editorView, this);
    this.alignmentOverlayHandler = new AlignmentOverlayHandler(editorView, this);

    // Callbacks can be set on the interaction handler
    // this.onComponentSelected = null; // No longer needed here
  }

  /**
   * Initializes the component management system, setting up panels and handlers.
   */
  initComponentsPanel() {
    // Initialize handlers
    this.alignmentOverlayHandler.initOverlays(); // Ensure overlay divs exist
    this.dragDropHandler.initComponentDragFromSidebar();
    this.interactionHandler.initInteractionListeners();

    // Initial render
    this.renderComponentsPreview();
  }

  /**
   * Sets up event listeners specific to the Design tab view.
   * Delegates to specific handlers.
   */
  setupDesignTabEvents() {
      this.dragDropHandler.setupDesignTabEvents();
      // Interaction listeners might already be set globally or on the container
      // this.interactionHandler.initInteractionListeners(); // Check if needed here specifically
      this.renderComponentsPreview(); // Re-render when switching to design tab
  }

  // --- Core Component Data Management --- 

  /**
   * Finds a component by its ID within the current screen's component list.
   * This might need to be recursive if you implement nested layouts.
   * @param {string} componentId - The ID of the component to find.
   * @returns {object | null} The component object or null if not found.
   */
  findComponentById(componentId) {
      if (!this.editorView.currentScreen || !this.editorView.currentScreen.components) return null;
      // Simple linear search for now. Needs update for nested structures.
      return this.editorView.currentScreen.components.find(c => c.id === componentId);
      // TODO: Implement recursive search for nested components
  }

  /**
   * Adds a new component of a specific type to the current screen.
   * Generates default properties and an ID, then uses a command.
   * @param {string} componentType - The type of component (e.g., 'button', 'textview').
   * @param {number} [initialX=0] - Initial X position.
   * @param {number} [initialY=0] - Initial Y position.
   */
  addComponentToScreen(componentType, initialX = 0, initialY = 0) {
      let componentProps = {
          type: componentType,
          properties: {}
          // id will be generated below
      };

      const defaultProps = {
          width: 'wrap_content',
          height: 'wrap_content',
          x: Math.round(initialX),
          y: Math.round(initialY),
          margin: '',
          padding: '',
          bgColor: 'transparent',
          font: '',
          textSize: 14, // Common default
          textColor: '#000000', // Common default
          borderColor: 'transparent',
          borderRadius: '0px',
          boxShadow: 'none',
          opacity: 100 // Common default
      };

      // Apply type-specific defaults (Consider moving this to a separate factory/config file)
      switch (componentType) {
            // Layouts
            case 'linearlayout-h':
            case 'linearlayout-v':
                componentProps.properties = { ...defaultProps, width: 'match_parent', height: 100, bgColor: '#f0f0f0', padding: '4px', orientation: componentType.endsWith('-h') ? 'horizontal' : 'vertical', children: [] };
                break;
            case 'scrollview-h':
            case 'scrollview-v':
                componentProps.properties = { ...defaultProps, width: 'match_parent', height: 150, bgColor: '#e8e8e8', padding: '4px', orientation: componentType.endsWith('-h') ? 'horizontal' : 'vertical', children: [] };
                break;
            case 'cardview':
                componentProps.properties = { ...defaultProps, width: 150, height: 100, bgColor: '#ffffff', padding: '8px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)', children: [] };
                break;

            // Widgets
            case 'button':
                componentProps.properties = { ...defaultProps, text: 'Button', bgColor: '#E0E0E0', padding: '8px 16px', borderRadius: '4px' };
                break;
            case 'textview':
                componentProps.properties = { ...defaultProps, text: 'TextView' };
                break;
            case 'edittext':
                componentProps.properties = { ...defaultProps, text: '', hint: 'Enter text', hintColor: '#A0A0A0', width: 'match_parent', bgColor: '#FFFFFF', padding: '8px', borderColor: '#CCCCCC', borderRadius: '4px' };
                break;
            case 'imageview':
                componentProps.properties = { ...defaultProps, src: '', scaleType: 'fitCenter', width: 100, height: 100, bgColor: '#cccccc' };
                break;
            case 'checkbox':
                componentProps.properties = { ...defaultProps, text: 'CheckBox', checked: false };
                break;
            case 'radiobutton':
                componentProps.properties = { ...defaultProps, text: 'RadioButton', checked: false, radioGroup: '' };
                break;
            case 'switch':
                componentProps.properties = { ...defaultProps, text: 'Switch', checked: false };
                break;
            case 'progressbar':
                componentProps.properties = { ...defaultProps, progress: 50, max: 100, style: 'horizontal', width: 'match_parent', height: 4, indeterminate: false };
                break;
            case 'seekbar':
                componentProps.properties = { ...defaultProps, progress: 50, max: 100, width: 'match_parent', height: 'wrap_content' }; // Height wrap_content for seekbar usually
                break;
            case 'spinner':
                componentProps.properties = { ...defaultProps, items: 'Item 1,Item 2,Item 3', selectedIndex: 0, width: 'match_parent', padding: '4px 8px' }; // Default padding
                break;
            case 'listview':
                componentProps.properties = { ...defaultProps, items: '[]', layout: 'simple_list_item_1', width: 'match_parent', height: 200, bgColor: '#ffffff', borderColor: '#cccccc' };
                break;
            case 'webview':
                componentProps.properties = { ...defaultProps, url: 'https://example.com', width: 'match_parent', height: 300, bgColor: '#ffffff', borderColor: '#cccccc' };
                break;

            default:
                componentProps.properties = defaultProps;
                break;
        }

      // --- Generate Sequential ID --- 
      let baseName = componentType.replace(/-[hv]$/i, ''); // Remove -h or -v suffix
      baseName = baseName.toLowerCase().replace(/[^a-z0-9]/gi, ''); // Sanitize
      if (!baseName) baseName = 'component'; // Fallback
      
      const existingComponents = this.editorView.currentScreen?.components || [];
      let count = 0;
      const regex = new RegExp(`^${baseName}(\\d+)$`, 'i');
      existingComponents.forEach(comp => {
          if (comp.id && comp.id.startsWith(baseName)) {
              const match = comp.id.match(regex);
              if (match) {
                  count = Math.max(count, parseInt(match[1], 10));
              }
          }
      });
      
      const newId = `${baseName}${count + 1}`;
      componentProps.id = newId; // Assign the generated ID
      console.log(`Generated component ID: ${newId}`);
      // --- End ID Generation ---

      // Use AddComponentCommand
      const command = new AddComponentCommand(this.editorView, componentProps);
      this.editorView.undoRedoManager.executeCommand(command);
      
      // Selection and rendering are handled by the command execution or subsequent updates
      // If immediate selection is needed:
      // if (command.addedComponentId) {
      //     this.interactionHandler.selectComponent(command.addedComponentId);
      // }
  }

  // --- Delegation Methods --- 
  // These methods delegate tasks to the appropriate handlers.

  /**
   * Renders the components preview by delegating to the ComponentRenderer.
   */
  renderComponentsPreview() {
    this.componentRenderer.renderComponentsPreview();
  }

  /**
   * Updates the visual appearance of a specific component by delegating.
   * @param {string} componentId - The ID of the component to update.
   * @param {object} properties - The properties that have changed.
   */
  updateComponentVisuals(componentId, properties) {
    this.componentRenderer.updateComponentVisuals(componentId, properties);
  }

  /**
   * Selects a component by delegating to the InteractionHandler.
   * @param {string} componentId - The ID of the component.
   * @param {boolean} [showPanel=true] - Whether to show the property panel.
   */
  selectComponent(componentId, showPanel = true) {
    this.interactionHandler.selectComponent(componentId, showPanel);
  }

  /**
   * Deselects the current component by delegating to the InteractionHandler.
   */
  deselectComponent() {
    this.interactionHandler.deselectComponent();
  }

  /**
   * Adds resize handles to an element (potentially called by the renderer).
   * @param {HTMLElement} element - The component's DOM element.
   */
  addResizeHandles(element) {
      this.resizeHandler.addResizeHandles(element);
  }

  /**
   * Sets the callback for when a component is selected.
   * @param {Function} callback - The function to call.
   */
   setOnComponentSelectedCallback(callback) {
       this.interactionHandler.setOnComponentSelectedCallback(callback);
   }

   // --- Getters for handler states (if needed by external modules) ---
   get isDraggingComponent() {
       return this.interactionHandler.isDraggingComponent;
   }

   get isResizingComponent() {
       return this.resizeHandler.isResizingComponent;
   }

  /**
   * Deletes a component by ID.
   * @param {string} componentId - The ID of the component to delete.
   * @returns {boolean} Whether the deletion was successful.
   */
  deleteComponent(componentId) {
    console.log(`ComponentManager: Attempting to delete component ${componentId}`);
    const component = this.findComponentById(componentId);
    if (!component) {
      console.warn(`Cannot delete component: ID ${componentId} not found.`);
      return false;
    }
    
    console.log(`ComponentManager: Deleting component ${componentId} of type ${component.type}`);
    
    try {
      // For layout components, ensure we properly sync with code tab
      const isLayout = component.type.startsWith('linearlayout') || 
                      component.type.startsWith('scrollview') || 
                      component.type === 'cardview';
      
      if (isLayout) {
        console.log(`ComponentManager: Deleting layout component ${componentId}`);
      }
      
      // Create the delete command
      const deleteCommand = new DeleteComponentCommand(this.editorView, componentId);
      const result = this.editorView.undoRedoManager.executeCommand(deleteCommand);
      
      // If this was the selected component, update selection state
      if (this.editorView.selectedComponent?.id === componentId) {
        this.interactionHandler.deselectComponent();
      }
      
      // Clear any overlays
      this.alignmentOverlayHandler.clearAlignmentGuides();
      this.alignmentOverlayHandler.clearDimensionOverlay();
      
      // Re-render preview after deletion
      if (result) {
        // Small delay to ensure clean re-render
        setTimeout(() => {
          this.renderComponentsPreview();
          
          // If we're in code tab, request a code refresh
          if (this.editorView.activeTab === 'code' && this.editorView.codeManager) {
            // Ask code manager to refresh files
            this.editorView.codeManager.fileManager.generateCodeForAllFiles();
            
            // Update editor content if needed
            if (this.editorView.codeManager.uiManager) {
              this.editorView.codeManager.uiManager.updateEditorContent();
            }
          }
        }, 50);
      }
      
      return result;
    } catch (error) {
      console.error("Error deleting component:", error);
      // If an error occurs, try a direct deletion as fallback
      try {
        const app = this.editorView.currentApp;
        const screen = this.editorView.currentScreen;
        
        if (app && screen) {
          const success = this.editorView.appService.deleteComponent(
            app.id,
            screen.id,
            componentId
          );
          
          if (success) {
            console.log("Component deleted using direct deletion");
            // If this was the selected component, update selection state
            if (this.editorView.selectedComponent?.id === componentId) {
              this.interactionHandler.deselectComponent();
            }
            
            // Re-render preview after deletion
            setTimeout(() => {
              this.renderComponentsPreview();
              
              // Also notify code manager
              if (this.editorView.codeManager && this.editorView.codeManager.fileManager) {
                // Mark files as needing update
                this.editorView.codeManager.fileManager.markFileAsDirty(componentId, 'layout');
                this.editorView.codeManager.fileManager.markFileAsDirty(componentId, 'main');
                
                // Force regeneration and save
                const affectedFiles = ['layout', 'main'];
                affectedFiles.forEach(fileId => {
                  const newContent = this.editorView.codeManager.fileManager.generateFileContent(fileId);
                  this.editorView.codeManager.fileManager.updateFileContent(fileId, newContent);
                });
                
                this.editorView.codeManager.fileManager.triggerAutoSave(true);
              }
            }, 50);
            
            return true;
          }
        }
      } catch (fallbackError) {
        console.error("Fallback deletion also failed:", fallbackError);
      }
      
      return false;
    }
  }
}

export default ComponentManager; 