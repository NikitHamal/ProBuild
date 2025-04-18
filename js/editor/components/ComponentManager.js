import { 
  AddComponentCommand,
  DeleteComponentCommand,
  UpdatePropertyCommand,
  MoveComponentCommand
} from '../commands/ComponentCommands.js';

class ComponentManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.isDraggingComponent = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.draggedComponentStartX = 0;
    this.draggedComponentStartY = 0;
    this.onComponentSelected = null; // New callback that can be set by EditorView
  }

  handleKeyDown(e) {
    if (!this.editorView.selectedComponent) return; 
    
    const targetTagName = e.target.tagName.toUpperCase();
    const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'SELECT';

    let needsUpdate = false;
    const step = e.shiftKey ? 10 : 1;
    // Store the original position for undo
    const originalPosition = { 
      x: this.editorView.selectedComponent.properties.x, 
      y: this.editorView.selectedComponent.properties.y 
    };

    switch (e.key) {
      case 'ArrowUp':
        if (isInputFocused) return; 
        e.preventDefault();
        this.editorView.selectedComponent.properties.y -= step;
        needsUpdate = true;
        break;
      case 'ArrowDown':
        if (isInputFocused) return; 
        e.preventDefault();
        this.editorView.selectedComponent.properties.y += step;
        needsUpdate = true;
        break;
      case 'ArrowLeft':
        if (!isInputFocused) e.preventDefault(); 
        else return; 
        this.editorView.selectedComponent.properties.x -= step;
        needsUpdate = true;
        break;
      case 'ArrowRight':
        if (!isInputFocused) e.preventDefault(); 
        else return;
        this.editorView.selectedComponent.properties.x += step;
        needsUpdate = true;
        break;
      case 'Delete':
      case 'Backspace': 
        if (isInputFocused) return; 
        e.preventDefault();
        
        // Use DeleteComponentCommand instead of direct deletion
        const componentId = this.editorView.selectedComponent.id;
        const deleteCommand = new DeleteComponentCommand(this.editorView, componentId);
        this.editorView.executeCommand(deleteCommand);
        
        this.editorView.propertyPanel.hidePropertyPanel();
        return; // Skip the code below since we're using a command
    }

    if (needsUpdate) {
      this.editorView.selectedComponent.properties.x = Math.max(0, this.editorView.selectedComponent.properties.x);
      this.editorView.selectedComponent.properties.y = Math.max(0, this.editorView.selectedComponent.properties.y);
      
      // Create a MoveComponentCommand for position changes
      const componentId = this.editorView.selectedComponent.id;
      const newPosition = { 
        x: this.editorView.selectedComponent.properties.x, 
        y: this.editorView.selectedComponent.properties.y 
      };
      
      // Only create a command if the position actually changed
      if (originalPosition.x !== newPosition.x || originalPosition.y !== newPosition.y) {
        const moveCommand = new MoveComponentCommand(this.editorView, componentId, newPosition);
        this.editorView.executeCommand(moveCommand);
      }
      
      this.editorView.propertyPanel.updatePropertyEditor();
    }
  }

  setupDesignTabEvents() {
    // Component Drag FROM sidebar
    document.querySelectorAll('.components-sidebar .component-item').forEach(item => {
      item.addEventListener('dragstart', this.handleDragStart.bind(this));
    });

    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      previewContainer.addEventListener('dragover', this.handleDragOver.bind(this));
      previewContainer.addEventListener('drop', this.handleDrop.bind(this));
      
      // Add click listener for deselection
      previewContainer.addEventListener('click', (e) => {
        // If the direct click target is the container itself (the background)
        if (e.target === previewContainer) {
          this.deselectComponent();
        }
      });
    }

    this.renderComponentsPreview();
  }

  handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.closest('.component-item').dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
  }

  handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'copy';
  }

  handleDrop(e) {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('text/plain');
    const previewContainer = e.target.closest('.phone-content'); 
    if (!componentType || !previewContainer) return;

    const rect = previewContainer.getBoundingClientRect();
    // Calculate drop position relative to the container, accounting for scroll
    const x = e.clientX - rect.left + previewContainer.scrollLeft;
    const y = e.clientY - rect.top + previewContainer.scrollTop;

    // Adjust slightly so the component top-left is near the cursor, not centered on it
    const adjustedX = Math.max(0, x - 10); 
    const adjustedY = Math.max(0, y - 10);

    this.addComponentToScreen(componentType, adjustedX, adjustedY);
  }

  renderComponentsPreview() {
    // Get the preview container
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    
    // Clear existing preview
    previewContainer.innerHTML = '';
    
    // Add alignment guides and overlay containers
    const alignmentGuides = document.createElement('div');
    alignmentGuides.id = 'alignment-guides';
    previewContainer.appendChild(alignmentGuides);
    
    const dimensionOverlay = document.createElement('div');
    dimensionOverlay.id = 'dimension-overlay';
    previewContainer.appendChild(dimensionOverlay);
    
    // Only proceed if a screen is selected
    if (!this.editorView.currentScreen) return;
    
    // Show empty message if no components
    if (this.editorView.currentScreen.components.length === 0) {
      previewContainer.innerHTML += `<div class="empty-preview"><p>Drag and drop components here</p></div>`;
      return;
    }
    
    // Render each component
    this.editorView.currentScreen.components.forEach(component => {
      const componentElement = this.createComponentElement(component);
      if (componentElement) {
        // Set position based on properties
        componentElement.style.position = 'absolute';
        componentElement.style.left = `${parseInt(component.properties.x, 10) || 0}px`;
        componentElement.style.top = `${parseInt(component.properties.y, 10) || 0}px`;
        
        // Add to preview container
        previewContainer.appendChild(componentElement);
        
        // If this was the selected component, reselect it
        if (this.editorView.selectedComponent && this.editorView.selectedComponent.id === component.id) {
          componentElement.classList.add('selected');
          // Update property panel if visible
          if (this.editorView.propertyPanelVisible) {
            this.editorView.propertyPanel.updatePropertyValues();
          }
        }
      }
    });
  }

  createComponentElement(component) {
    const element = document.createElement('div');
    element.className = `preview-component preview-${component.type}`;
    element.dataset.componentId = component.id;
    const props = component.properties;

    // Apply common styles first
    if (props.width === 'match_parent') element.style.width = '100%';
    else if (props.width === 'wrap_content') element.style.width = 'auto';
    else if (props.width !== undefined) element.style.width = `${props.width}px`;
    
    if (props.height === 'match_parent') element.style.height = '100%';
    else if (props.height === 'wrap_content') element.style.height = 'auto';
    else if (props.height !== undefined) element.style.height = `${props.height}px`;

    element.style.position = 'absolute'; 
    element.style.left = `${props.x || 0}px`; 
    element.style.top = `${props.y || 0}px`;
    if (props.margin) element.style.margin = props.margin;
    if (props.padding) element.style.padding = props.padding;
    element.style.backgroundColor = props.bgColor || 'transparent';
    element.style.opacity = (props.opacity || 100) / 100;
    if (props.font) element.style.fontFamily = props.font;
    element.style.fontSize = `${props.textSize || 14}px`;
    element.style.color = props.textColor || '#000000';
    element.style.borderColor = props.borderColor || 'transparent';
    element.style.borderWidth = props.borderColor && props.borderColor !== 'transparent' ? '1px' : '0'; 
    element.style.borderStyle = props.borderColor && props.borderColor !== 'transparent' ? 'solid' : 'none';
    element.style.borderRadius = props.borderRadius || '0px';
    element.style.boxShadow = props.boxShadow || 'none';
    
    // Component-specific rendering
    element.innerHTML = ''; // Clear default
    element.style.display = 'flex'; // Use flex for internal alignment often
    element.style.alignItems = 'center'; // Default alignment
    element.style.justifyContent = 'flex-start'; // Default alignment

    switch (component.type) {
      // Layouts
      case 'linearlayout-h':
      case 'scrollview-h':
        element.style.flexDirection = 'row';
        element.style.justifyContent = 'flex-start';
        element.style.alignItems = 'flex-start'; // Align children top
        element.innerHTML = `<!-- H Layout -->`; // Placeholder
        break;
      case 'linearlayout-v':
      case 'scrollview-v':
        element.style.flexDirection = 'column';
        element.style.justifyContent = 'flex-start';
        element.style.alignItems = 'flex-start'; // Align children left
        element.innerHTML = `<!-- V Layout -->`; // Placeholder
        break;
      case 'cardview':
         element.style.justifyContent = 'center'; // Center placeholder
         element.innerHTML = `<!-- Card -->`; // Placeholder
        break;

      // Widgets
      case 'button':
        element.textContent = props.text || 'Button';
        element.style.textAlign = 'center';
        element.style.cursor = 'pointer';
        element.style.justifyContent = 'center'; // Center text
        element.style.backgroundColor = props.bgColor || '#E0E0E0';
        break;
      case 'textview':
        element.textContent = props.text || 'TextView';
        break;
      case 'edittext':
        if (props.text) {
            element.textContent = props.text;
            element.style.color = props.textColor || '#000000';
        } else {
            element.textContent = props.hint || 'Enter text';
            element.style.color = props.hintColor || '#A0A0A0';
        }
        break;
      case 'imageview':
        element.style.justifyContent = 'center'; // Center placeholder
        if (props.src) {
            const img = document.createElement('img');
            img.src = props.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = props.scaleType || 'contain'; // Use scaleType
            element.appendChild(img);
        } else {
             element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">image</i>'; // Placeholder icon
        }
        break;
      case 'checkbox':
      case 'radiobutton':
        const checkInput = document.createElement('input');
        checkInput.type = component.type === 'checkbox' ? 'checkbox' : 'radio';
        checkInput.checked = props.checked || false;
        checkInput.disabled = true; // Preview only
        checkInput.style.marginRight = '5px';
        element.appendChild(checkInput);
        element.appendChild(document.createTextNode(props.text || component.type));
        break;
      case 'switch':
        element.innerHTML = `<span style="margin-right: 5px;">${props.text || 'Switch'}</span>`;
        const switchToggle = document.createElement('div');
        switchToggle.style.width = '34px';
        switchToggle.style.height = '14px';
        switchToggle.style.borderRadius = '7px';
        switchToggle.style.backgroundColor = props.checked ? '#a5d6a7' : '#ccc'; // Greenish if checked
        switchToggle.style.position = 'relative';
        switchToggle.style.transition = 'background-color 0.2s';
        const switchThumb = document.createElement('div');
        switchThumb.style.width = '20px';
        switchThumb.style.height = '20px';
        switchThumb.style.borderRadius = '50%';
        switchThumb.style.backgroundColor = props.checked ? '#4caf50' : '#f1f1f1';
        switchThumb.style.position = 'absolute';
        switchThumb.style.top = '-3px';
        switchThumb.style.left = props.checked ? '17px' : '-3px';
        switchThumb.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        switchThumb.style.transition = 'left 0.2s, background-color 0.2s';
        switchToggle.appendChild(switchThumb);
        element.appendChild(switchToggle);
        break;
      case 'progressbar':
        element.style.padding = '0'; // No padding for progressbar itself
        const progressBg = document.createElement('div');
        progressBg.style.width = '100%';
        progressBg.style.height = '100%';
        progressBg.style.backgroundColor = '#e0e0e0';
        progressBg.style.borderRadius = 'inherit'; // Inherit from parent
        progressBg.style.overflow = 'hidden';
        const progressBar = document.createElement('div');
        progressBar.style.width = `${Math.min(100, Math.max(0, props.progress || 0))}%`;
        progressBar.style.height = '100%';
        progressBar.style.backgroundColor = props.progressColor || '#2196F3'; // Use a progress color property later if needed
        progressBg.appendChild(progressBar);
        element.appendChild(progressBg);
        break;
      case 'seekbar':
        element.style.padding = '0'; // No padding
        const track = document.createElement('div');
        track.style.width = '100%';
        track.style.height = '4px';
        track.style.backgroundColor = '#ccc';
        track.style.position = 'relative';
        track.style.borderRadius = '2px';
        const thumb = document.createElement('div');
        thumb.style.width = '14px';
        thumb.style.height = '14px';
        thumb.style.borderRadius = '50%';
        thumb.style.backgroundColor = '#2196F3';
        thumb.style.position = 'absolute';
        thumb.style.top = '50%';
        const progressPercent = Math.min(100, Math.max(0, props.progress || 0));
        thumb.style.left = `calc(${progressPercent}% - 7px)`; // Center thumb
        thumb.style.transform = 'translateY(-50%)';
        track.appendChild(thumb);
        element.appendChild(track);
        break;
      case 'spinner':
        element.innerHTML = `<span>${(props.items || '').split(',')[0] || 'Select'}</span><i class="material-icons" style="margin-left: auto;">arrow_drop_down</i>`;
        element.style.justifyContent = 'space-between';
        element.style.border = '1px solid #ccc'; // Mimic spinner border
        element.style.padding = props.padding || '4px 8px'; // Add default padding
        break;
      case 'listview':
        element.innerHTML = '<!-- ListView -->'; // Placeholder
        // Keep border from common styles
        break;
       case 'webview':
        element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">web</i>'; // Placeholder icon
        element.style.justifyContent = 'center';
        // Keep border from common styles
        break;
      default:
        element.textContent = component.type; // Fallback
    }
    
    // Mouse/Touch Events
    element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; 
        e.preventDefault();
        this.handleComponentMouseDown(e, component);
    });
    element.addEventListener('click', (e) => {
      if (!this.isDraggingComponent) {
        e.stopPropagation(); // Prevent triggering the container click listener
        // Always select the component AND show the panel on left click
        this.selectComponent(component.id, true); 
      }
    });
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        e.stopPropagation(); // Prevent triggering the container click listener
        // Do nothing else on right-click
    });
    
    return element;
  }

  handleComponentMouseDown(e, component) {
    if (e.button !== 0) return; 
    this.selectComponent(component.id, false);
    this.isDraggingComponent = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.draggedComponentStartX = component.properties.x || 0;
    this.draggedComponentStartY = component.properties.y || 0;

    // Show dimensions overlay on drag start
    this.updateDimensionOverlay(this.editorView.selectedComponent); 

    this.boundHandleMouseMove = this.handleComponentMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleComponentMouseUp.bind(this);
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  }

  handleComponentMouseMove(e) {
    if (!this.isDraggingComponent || !this.editorView.selectedComponent) return;

    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    const containerRect = previewContainer.getBoundingClientRect();

    // Calculate potential new raw position based on mouse delta
    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;
    let newX = this.draggedComponentStartX + deltaX;
    let newY = this.draggedComponentStartY + deltaY;

    // Get the dragged element and its dimensions
    const draggedElement = document.querySelector(`.preview-component[data-component-id="${this.editorView.selectedComponent.id}"]`);
    if (!draggedElement) return;
    const draggedRect = draggedElement.getBoundingClientRect(); // Use client rect for dimensions
    const draggedWidth = draggedRect.width;
    const draggedHeight = draggedRect.height;

    // --- Alignment Logic --- 
    const snapThreshold = 5;
    let activeSnapLines = [];
    let snapOffsetX = 0;
    let snapOffsetY = 0;

    // Targets: Container edges and center
    const containerCenterX = previewContainer.clientWidth / 2;
    const containerCenterY = previewContainer.clientHeight / 2;
    const targets = [
        // Container vertical
        { type: 'v', edge: 'left', pos: 0 },
        { type: 'v', edge: 'center', pos: containerCenterX },
        { type: 'v', edge: 'right', pos: previewContainer.clientWidth },
        // Container horizontal
        { type: 'h', edge: 'top', pos: 0 },
        { type: 'h', edge: 'center', pos: containerCenterY },
        { type: 'h', edge: 'bottom', pos: previewContainer.clientHeight }
    ];

    // Targets: Other components
    const otherComponents = this.editorView.currentScreen.components.filter(c => c.id !== this.editorView.selectedComponent.id);
    otherComponents.forEach(comp => {
        const compElement = document.querySelector(`.preview-component[data-component-id="${comp.id}"]`);
        if (!compElement) return;
        const compProps = comp.properties;
        const compX = compProps.x || 0;
        const compY = compProps.y || 0;
        // Use offsetWidth/Height as getBoundingClientRect might include transforms/margins inappropriately here
        const compWidth = compElement.offsetWidth; 
        const compHeight = compElement.offsetHeight;
        
        // Vertical edges + center
        targets.push({ type: 'v', edge: 'left', pos: compX });
        targets.push({ type: 'v', edge: 'center', pos: compX + compWidth / 2 });
        targets.push({ type: 'v', edge: 'right', pos: compX + compWidth });
        // Horizontal edges + center
        targets.push({ type: 'h', edge: 'top', pos: compY });
        targets.push({ type: 'h', edge: 'center', pos: compY + compHeight / 2 });
        targets.push({ type: 'h', edge: 'bottom', pos: compY + compHeight });
    });

    // Check snapping for vertical lines
    let snappedX = false;
    [newX, newX + draggedWidth / 2, newX + draggedWidth].forEach((draggedPos, i) => {
        if (snappedX) return; // Only snap once horizontally
        targets.forEach(target => {
            if (target.type === 'v') {
                const dist = Math.abs(draggedPos - target.pos);
                if (dist < snapThreshold) {
                    snapOffsetX = target.pos - draggedPos; 
                    activeSnapLines.push({ type: 'vertical', pos: target.pos });
                    snappedX = true;
                }
            }
        });
    });

    // Check snapping for horizontal lines
    let snappedY = false;
    [newY, newY + draggedHeight / 2, newY + draggedHeight].forEach((draggedPos, i) => {
        if (snappedY) return; // Only snap once vertically
        targets.forEach(target => {
            if (target.type === 'h') {
                const dist = Math.abs(draggedPos - target.pos);
                if (dist < snapThreshold) {
                    snapOffsetY = target.pos - draggedPos;
                    activeSnapLines.push({ type: 'horizontal', pos: target.pos });
                    snappedY = true;
                }
            }
        });
    });

    // Apply snapping offsets
    newX += snapOffsetX;
    newY += snapOffsetY;
    
    // Boundary check
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    if (newX + draggedWidth > previewContainer.clientWidth) {
      newX = previewContainer.clientWidth - draggedWidth;
    }
     if (newY + draggedHeight > previewContainer.clientHeight) {
      newY = previewContainer.clientHeight - draggedHeight;
    }

    // Update style directly for smooth feedback
    draggedElement.style.left = `${newX}px`;
    draggedElement.style.top = `${newY}px`;
    
    // Update properties (will be saved on mouseup)
    this.editorView.selectedComponent.properties.x = Math.round(newX);
    this.editorView.selectedComponent.properties.y = Math.round(newY);

    // Update property editor inputs in real-time
    this.editorView.propertyPanel.updatePropertyEditor();

    // Draw alignment guides
    this.drawAlignmentGuides(activeSnapLines);

    // Update dimension overlay
    this.updateDimensionOverlay(this.editorView.selectedComponent, draggedElement); 
  }

  drawAlignmentGuides(lines) {
    const guidesContainer = document.getElementById('alignment-guides');
    if (!guidesContainer) return;
    guidesContainer.innerHTML = ''; // Clear previous guides

    lines.forEach(line => {
      const guide = document.createElement('div');
      guide.className = `alignment-guide ${line.type}`;
      if (line.type === 'horizontal') {
        guide.style.top = `${line.pos}px`;
      } else { // vertical
        guide.style.left = `${line.pos}px`;
      }
      guidesContainer.appendChild(guide);
    });
  }
  
  clearAlignmentGuides() {
    const guidesContainer = document.getElementById('alignment-guides');
    if (guidesContainer) {
      guidesContainer.innerHTML = ''; // Remove all alignment guides
    }
  }

  handleComponentMouseUp(e) {
    if (this.isDraggingComponent && this.editorView.selectedComponent) {
      this.isDraggingComponent = false;
      
      // Create a command for the move operation
      const componentId = this.editorView.selectedComponent.id;
      const newPosition = { 
        x: parseInt(this.editorView.selectedComponent.properties.x, 10) || 0, 
        y: parseInt(this.editorView.selectedComponent.properties.y, 10) || 0 
      };
      
      // Only record the command if it actually moved
      if (this.draggedComponentStartX !== newPosition.x || this.draggedComponentStartY !== newPosition.y) {
        // Store start position for accurate undo
        const startPosition = {
          x: parseInt(this.draggedComponentStartX, 10) || 0,
          y: parseInt(this.draggedComponentStartY, 10) || 0
        };
        
        const moveCommand = new MoveComponentCommand(
          this.editorView, 
          componentId, 
          newPosition, 
          null,  // newParentId - keeping same parent
          startPosition  // Pass original position to command
        );
        this.editorView.executeCommand(moveCommand);
      }
      
      // Update UI and clear overlay
      this.clearAlignmentGuides();
      this.updateDimensionOverlay(this.editorView.selectedComponent, e.target);
    }
  }

  saveComponentUpdate(reselect = true, showPanel = true) { 
    if (!this.editorView.selectedComponent) return;
    
    const componentId = this.editorView.selectedComponent.id;
    const componentCopy = JSON.parse(JSON.stringify(this.editorView.selectedComponent));
    
    // Create an UpdatePropertyCommand
    const updateCommand = new UpdatePropertyCommand(
      this.editorView, 
      componentId, 
      'properties', // We're updating all properties at once here
      componentCopy.properties
    );
    
    this.editorView.executeCommand(updateCommand);
    
    if (reselect) {
      this.selectComponent(componentId, showPanel);
    }
  }

  selectComponent(componentId, showPanel = true) { 
    const prevSelectedElement = document.querySelector('.preview-component.selected');
    
    // If trying to select the same component again, do nothing here
    // Deselection is handled in the click listener now
    if (prevSelectedElement && prevSelectedElement.dataset.componentId === componentId) {
        // If panel should be shown (e.g., right-click), ensure it is
        if (showPanel && !this.editorView.propertyPanelVisible) {
            this.editorView.propertyPanel.showPropertyPanel();
        }
        return; 
    }

    // Deselect previous if different
    if (prevSelectedElement) {
        prevSelectedElement.classList.remove('selected');
    }
    
    // Find the newly selected component data
    const newSelectedComponentData = this._findComponentInScreen(this.editorView.currentScreen.components, componentId);

    if (!newSelectedComponentData) {
        this.deselectComponent(); // Deselect if component not found
        return;
    }
    
    this.editorView.selectedComponent = newSelectedComponentData;
    
    // Highlight the element visually
    const newSelectedElement = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
    if (newSelectedElement) {
        newSelectedElement.classList.add('selected');
        this.updateDimensionOverlay(newSelectedComponentData, newSelectedElement); // Show overlay on selection
    }
    
    // Call the onComponentSelected callback if it exists
    if (typeof this.onComponentSelected === 'function') {
        this.onComponentSelected(newSelectedComponentData);
    } else {
        // Fallback to old behavior if callback not set
        // Show or hide panel based on flag
        if (showPanel) {
            this.editorView.propertyPanel.showPropertyPanel();
        } else {
            // Ensure panel is hidden if left-clicking or starting drag
            if (this.editorView.propertyPanelVisible) {
                this.editorView.propertyPanel.hidePropertyPanel();
            }
        }
    }
  }

  deselectComponent() {
    const selectedElement = document.querySelector('.preview-component.selected');
    if (selectedElement) {
      selectedElement.classList.remove('selected');
    }
    
    this.editorView.selectedComponent = null;
    
    // Call the onComponentSelected callback with null if it exists
    if (typeof this.onComponentSelected === 'function') {
        this.onComponentSelected(null);
    } else {
        // Fallback to old behavior if callback not set
        this.editorView.propertyPanel.hidePropertyPanel();
    }
    
    this.clearDimensionOverlay(); // Clear overlay on deselection
  }

  // Helper to find component recursively (you might already have this)
  _findComponentInScreen(components, id) {
     for (const component of components) {
       if (component.id === id) {
         return component;
       }
       // Check children if this component is a container (adjust based on your structure)
       const children = component.properties?.children || component.children;
       if (children && Array.isArray(children) && children.length > 0) {
         const found = this._findComponentInScreen(children, id);
         if (found) {
           return found;
         }
       }
     }
     return null;
  }

  addComponentToScreen(componentType, initialX = 0, initialY = 0) {
    let componentProps = {
      type: componentType,
      properties: {}
    };
    
    const defaultProps = {
        width: 'wrap_content',
        height: 'wrap_content',
        x: initialX,
        y: initialY,
        margin: '',
        padding: '',
        bgColor: 'transparent',
        font: '',
        borderColor: 'transparent', // Default border transparent
        borderRadius: '0px',
        boxShadow: 'none' 
    };

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
        componentProps.properties = { ...defaultProps, text: 'Button', textSize: 14, textColor: '#000000', bgColor: '#E0E0E0', padding: '8px 16px', borderRadius: '4px' };
        break;
      case 'textview':
        componentProps.properties = { ...defaultProps, text: 'TextView', textSize: 14, textColor: '#000000' };
        break;
      case 'edittext':
        componentProps.properties = { ...defaultProps, text: '', hint: 'Enter text here', hintColor: '#A0A0A0', textSize: 14, textColor: '#000000', width: 'match_parent', bgColor: '#FFFFFF', padding: '8px', borderColor: '#CCCCCC', borderRadius: '4px' };
        break;
      case 'imageview':
        componentProps.properties = { ...defaultProps, src: '', scaleType: 'fitCenter', width: 100, height: 100, bgColor: '#cccccc' };
        break;
      case 'checkbox':
        componentProps.properties = { ...defaultProps, text: 'CheckBox', checked: false, textColor: '#000000' };
        break;
      case 'radiobutton':
        componentProps.properties = { ...defaultProps, text: 'RadioButton', checked: false, radioGroup: '', textColor: '#000000' };
        break;
      case 'switch':
        componentProps.properties = { ...defaultProps, text: 'Switch', checked: false, textColor: '#000000' };
        break;
      case 'progressbar':
        componentProps.properties = { ...defaultProps, progress: 50, max: 100, style: 'horizontal', width: 'match_parent', height: 4, indeterminate: false };
        break;
      case 'seekbar':
        componentProps.properties = { ...defaultProps, progress: 50, max: 100, width: 'match_parent', height: 'wrap_content' };
        break;
      case 'spinner':
        componentProps.properties = { ...defaultProps, items: 'Item 1, Item 2, Item 3', selectedIndex: 0, width: 'match_parent' };
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

    // Ensure ID is unique (might need better generation later)
    componentProps.id = `${componentType}_${Date.now()}`;

    // Use AddComponentCommand instead of direct addition
    const command = new AddComponentCommand(this.editorView, componentProps);
    this.editorView.executeCommand(command);
    
    // The AddComponentCommand will handle rendering and selection
    // The ID of the new component is stored in command.addedComponentId after execution
    if (command.addedComponentId) {
      this.selectComponent(command.addedComponentId);
    }
  }

  updateDimensionOverlay(component, element) {
    const overlay = document.getElementById('dimension-overlay');
    if (!overlay || !component || !element) {
      this.clearDimensionOverlay();
      return;
    }

    overlay.innerHTML = ''; // Clear previous - Keep this to remove any stale content
  }

  clearDimensionOverlay() {
    const overlay = document.getElementById('dimension-overlay');
    if (overlay) overlay.innerHTML = '';
  }
}

export default ComponentManager; 