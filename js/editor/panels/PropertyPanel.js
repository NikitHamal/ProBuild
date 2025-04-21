// Command import might not be needed here if handled solely by EventHandler
// import { UpdatePropertyCommand } from '../commands/ComponentCommands.js'; 
import ComponentIdManager from '../utils/ComponentIdManager.js';
import PropertyPanelRenderer from './modules/PropertyPanelRenderer.js';
import PropertyPanelUpdater from './modules/PropertyPanelUpdater.js';
import PropertyPanelEventHandler from './modules/PropertyPanelEventHandler.js';
import PropertyValueUtils from './modules/PropertyValueUtils.js';

class PropertyPanel {
  constructor(editorView) {
    this.editorView = editorView;
    // Instantiate necessary managers and handlers
    this.componentIdManager = new ComponentIdManager(editorView);
    // Defer instantiation until the panel element exists
    this.updater = null; 
    this.eventHandler = null;

    this.panelElement = null; // Reference to the main panel DOM element
  }

  /**
   * Renders the property panel into the sidebar.
   * Returns the HTML string to be inserted.
   */
  renderSidebarPropertyPanel() {
    // Delegate rendering to the Renderer module
    return PropertyPanelRenderer.renderSidebarPropertyPanel();
  }

  /**
   * Method called after the panel HTML is added to the DOM.
   * Caches the panel element and sets up initial state and handlers.
   */
  initializePanel() {
     this.panelElement = document.getElementById('property-panel');
     if (!this.panelElement) {
        console.error("Property panel element not found after rendering!");
        return;
     }
     // Now instantiate handlers that need the panel element
     this.updater = new PropertyPanelUpdater(this.editorView); 
     this.eventHandler = new PropertyPanelEventHandler(this.editorView, this.componentIdManager);
     
     // Initial state: hide properties, show message
     this.updater.hidePanelUI(); 
     PropertyValueUtils.loadGoogleFonts(); // Load fonts once
  }

  /**
   * Shows the property panel UI, updates it for the selected component,
   * and sets up event listeners.
   */
  showPropertyPanel() {
    // Ensure handlers are initialized
    if (!this.updater || !this.eventHandler) {
        this.initializePanel();
        if (!this.updater || !this.eventHandler) { // Check again after init attempt
             console.error("Panel handlers could not be initialized.");
             return;
        }
    }
    
    if (!this.editorView.selectedComponent) {
      this.hidePropertyPanel(); // Ensure it's hidden if no component selected
      return;
    }
    
    this.editorView.propertyPanelVisible = true;
    
    // Delegate UI updates to the Updater
    this.updater.updatePanelForSelectedComponent();

    // Delegate event setup to the EventHandler
    // This should be called *after* the panel is populated
    this.eventHandler.setupAllEventHandlers();
    
    // Ensure panel UI state reflects selection
    this.updater.showPanelUI(); 
  }

  /**
   * Hides the property panel UI (shows the "no component selected" message).
   */
  hidePropertyPanel() {
    this.editorView.propertyPanelVisible = false;
    
    // Delegate hiding to the Updater
    if (this.updater) {
        this.updater.hidePanelUI();
    }
  }

  /**
   * Updates the property panel values without setting up new events.
   * Useful after undo/redo or programmatic changes.
   */
  updatePropertyValues() {
      if (this.updater) {
          this.updater.updatePanelForSelectedComponent();
      }
  }

  /**
   * Clears the panel by hiding the property groups and showing the default message.
   */
  clearPanel() {
      if (this.updater) {
          this.updater.clearPanel();
      }
  }

  /**
   * Updates a component's preview in real-time when a property changes.
   * This remains in the main class as it directly manipulates the preview DOM, 
   * potentially outside the scope of the panel itself.
   * 
   * @param {string} componentId - The ID of the component to update
   * @param {string} propertyName - The simple name of the property that changed (e.g., 'text', 'bgColor')
   * @param {any} newValue - The new value of the property
   */
  updateComponentPreview(componentId, propertyName, newValue) {
    const componentElement = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
    if (!componentElement || !this.editorView.selectedComponent) return;

    const componentType = this.editorView.selectedComponent.type;
    
    // Apply the property change directly to the DOM for immediate feedback
    switch (propertyName) {
      case 'x':
        componentElement.style.left = `${newValue}px`;
        break;
      case 'y':
        componentElement.style.top = `${newValue}px`;
        break;
      case 'width':
        if (newValue === 'match_parent') {
          componentElement.style.width = '100%'; // Or calculate based on parent
        } else if (newValue === 'wrap_content') {
          componentElement.style.width = 'auto';
        } else {
          componentElement.style.width = newValue; // Assumes newValue includes 'px'
        }
        // Trigger potential layout adjustments in parent (if applicable)
        // This might require a more sophisticated layout engine
        break;
      case 'height':
        if (newValue === 'match_parent') {
          componentElement.style.height = '100%'; // Or calculate based on parent
        } else if (newValue === 'wrap_content') {
          componentElement.style.height = 'auto';
        } else {
          componentElement.style.height = newValue; // Assumes newValue includes 'px'
        }
         // Trigger potential layout adjustments in parent (if applicable)
        break;
      case 'bgColor':
        componentElement.style.backgroundColor = newValue;
        break;
      case 'opacity':
        componentElement.style.opacity = (newValue !== null && newValue !== undefined ? newValue : 100) / 100;
        break;
      case 'margin':
        componentElement.style.margin = newValue || '0';
        break;
      case 'padding':
        componentElement.style.padding = newValue || '0';
        break;
      case 'font':
        componentElement.style.fontFamily = newValue || 'inherit'; // Apply font family
        break;
      case 'borderRadius':
        componentElement.style.borderRadius = newValue || '0px';
        break;
      case 'borderColor':
        componentElement.style.borderColor = newValue === 'transparent' ? 'rgba(0,0,0,0)' : newValue || 'transparent';
        // Add/remove border style based on color
        if (newValue && newValue !== 'transparent' && newValue !== '#000000') { // Avoid adding border for default black if no border intended
             componentElement.style.borderWidth = componentElement.style.borderWidth || '1px'; // Keep existing width or default to 1px
             componentElement.style.borderStyle = 'solid';
        } else if (newValue === 'transparent' || !newValue) {
             componentElement.style.borderStyle = 'none';
             componentElement.style.borderWidth = '0';
        }
        break;
      case 'boxShadow':
        componentElement.style.boxShadow = newValue || 'none';
        break;
      case 'text':
        // Find the appropriate element to update text content
        let textTarget = componentElement;
        if (['button', 'checkbox', 'radiobutton', 'switch'].includes(componentType)) {
            // Checkbox/Radio/Switch might have a label or span
            const label = componentElement.querySelector('label') || componentElement.querySelector('span');
            // Attempt to find a text node directly associated with the label/span or component itself
            const textNode = Array.from((label || componentElement).childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
            );
            if (textNode) {
                textNode.textContent = newValue || '';
            } else if (label) {
                 // If no direct text node, set textContent of the label/span (might replace icons)
                 label.textContent = newValue || '';
            } else {
                 // Fallback: Set textContent of the main element if no better target found
          componentElement.textContent = newValue || '';
            }
        } else if (componentType === 'edittext') {
             // EditText uses input/textarea value
             const input = componentElement.querySelector('input') || componentElement.querySelector('textarea');
             if (input) input.value = newValue || '';
        } else if (componentType === 'textview') {
             // TextView simply sets textContent
             componentElement.textContent = newValue || '';
        }
        break;
      case 'textSize':
        componentElement.style.fontSize = newValue ? `${newValue}px` : 'inherit';
        break;
      case 'textColor':
        componentElement.style.color = newValue || 'inherit';
        break;
       case 'hint': // Update placeholder for EditText
         if (componentType === 'edittext') {
             const input = componentElement.querySelector('input') || componentElement.querySelector('textarea');
             if (input) input.placeholder = newValue || '';
         }
         break;
       case 'hintColor': // Update placeholder color (Note: Requires ::placeholder CSS)
           // This is often better handled via CSS rules updated on the component or a class
           // Direct style manipulation of placeholder color is less reliable
           // console.warn('Hint color preview update requires CSS manipulation.');
           // Example (less ideal): componentElement.style.setProperty('--placeholder-color', newValue);
           break;
       case 'src': // Update src for ImageView
         if (componentType === 'imageview') {
             const img = componentElement.querySelector('img');
             if (img) img.src = newValue || '';
         }
         break;
       case 'scaleType': // Update object-fit for ImageView
         if (componentType === 'imageview') {
             const img = componentElement.querySelector('img');
             // Map Android scaleType to CSS object-fit/object-position
             let objectFit = 'contain'; // Default
             let objectPosition = 'center center';
             switch(newValue) {
                 case 'fitXY': 
                 case 'fill': 
                     objectFit = 'fill'; 
                     break;
                 case 'center': 
                     objectFit = 'none'; 
                     break;
                 case 'centerCrop': 
                 case 'cover':
                     objectFit = 'cover'; 
                     break;
                 case 'centerInside': 
                     objectFit = 'contain'; // CSS contain is similar
                     break;
                 case 'fitStart': 
                     objectFit = 'contain'; 
                     objectPosition = 'left center'; 
                     break;
                 case 'fitEnd': 
                     objectFit = 'contain'; 
                     objectPosition = 'right center'; 
                     break;
                 case 'fitCenter':
                 default:
                     objectFit = 'contain';
                     break;
             }
             if (img) {
                 img.style.objectFit = objectFit;
                 img.style.objectPosition = objectPosition;
             }
         }
         break;
      case 'checked': // Update checked state for checkable inputs
         if (['checkbox', 'radiobutton', 'switch'].includes(componentType)) {
             const input = componentElement.querySelector('input');
             if (input) input.checked = !!newValue;
             // Potentially update visual state for custom switches here
         }
         break;
      // Add more cases as needed for other properties that need immediate visual feedback
      // For properties like orientation, items, url, progress, max etc., 
      // a full re-render might be simpler or necessary, which is handled by the command execution.
    }
     // If wrap_content is involved, might need to recalculate size
     if ((propertyName === 'width' || propertyName === 'height') && (newValue === 'wrap_content')) {
        // Potentially trigger a size recalculation, maybe debounced
        // console.log('Wrap content change, might need size recalc');
     } else if (['text', 'textSize', 'font'].includes(propertyName)) {
         // If text content or styling changes, check if size needs recalculation for wrap_content
        const props = this.editorView.selectedComponent.properties;
        if (props.width === 'wrap_content' || props.height === 'wrap_content') {
             // console.log('Text/font change with wrap_content, might need size recalc');
        }
    }
  }
}

export default PropertyPanel; 