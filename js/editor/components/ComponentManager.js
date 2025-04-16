class ComponentManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.isDraggingComponent = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.draggedComponentStartX = 0;
    this.draggedComponentStartY = 0;
  }

  handleKeyDown(e) {
    if (!this.editorView.selectedComponent) return; 
    
    const targetTagName = e.target.tagName.toUpperCase();
    const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'SELECT';

    let needsUpdate = false;
    const step = e.shiftKey ? 10 : 1; 

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
        this.editorView.appService.deleteComponent(
          this.editorView.currentApp.id, 
          this.editorView.currentScreen.id, 
          this.editorView.selectedComponent.id
        );
        this.editorView.propertyPanel.hidePropertyPanel(); 
        this.renderComponentsPreview(); 
        break;
    }

    if (needsUpdate) {
      this.editorView.selectedComponent.properties.x = Math.max(0, this.editorView.selectedComponent.properties.x);
      this.editorView.selectedComponent.properties.y = Math.max(0, this.editorView.selectedComponent.properties.y);
      
      this.saveComponentUpdate(false, false); 
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
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    if (this.editorView.currentScreen.components.length === 0) {
      previewContainer.innerHTML = `<div class="empty-preview"><p>Drag and drop components here</p></div>`;
      return;
    }
    this.editorView.currentScreen.components.forEach(component => {
      const element = this.createComponentElement(component);
      previewContainer.appendChild(element);
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
        e.stopPropagation();
        this.selectComponent(component.id, false);
      }
    });
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        this.selectComponent(component.id, true);
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

  handleComponentMouseUp(e) {
    if (!this.isDraggingComponent) return;
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    
    // Clear guides & dimensions
    this.drawAlignmentGuides([]);
    this.clearDimensionOverlay(); 

    if (this.editorView.selectedComponent) {
      // Properties were updated during mousemove, just need to save.
      this.saveComponentUpdate(false, false); 
    }
    setTimeout(() => { this.isDraggingComponent = false; }, 50);
  }

  saveComponentUpdate(reselect = true, showPanel = true) { 
    if (!this.editorView.selectedComponent) return;
    const componentIdToSelect = this.editorView.selectedComponent.id; 
    this.editorView.appService.updateComponent(
      this.editorView.currentApp.id, 
      this.editorView.currentScreen.id, 
      this.editorView.selectedComponent
    );
    this.renderComponentsPreview(); 
    if (reselect) {
        this.selectComponent(componentIdToSelect, showPanel); 
    }
  }

  selectComponent(componentId, showPanel = true) { 
    const prevSelected = document.querySelector('.preview-component.selected');
    if (prevSelected && prevSelected.dataset.componentId !== componentId) {
      prevSelected.classList.remove('selected');
    }
    
    // Find the newly selected component data
    const newSelectedComponent = this.editorView.currentScreen.components.find(c => c.id === componentId);
    if (!newSelectedComponent) {
        this.editorView.propertyPanel.hidePropertyPanel(); 
        this.editorView.selectedComponent = null;
        return;
    }
    this.editorView.selectedComponent = newSelectedComponent;
    
    // Highlight the element visually
    const element = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
    if (element && !element.classList.contains('selected')) {
      element.classList.add('selected');
    }
    
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

    const newComponent = this.editorView.appService.addComponent(
      this.editorView.currentApp.id, 
      this.editorView.currentScreen.id, 
      componentProps
    );
    
    if (newComponent) {
      this.renderComponentsPreview();
      this.selectComponent(newComponent.id); // Select the newly added component
    }
  }

  updateDimensionOverlay(component, element) {
    const overlay = document.getElementById('dimension-overlay');
    if (!overlay || !component || !element) {
      this.clearDimensionOverlay();
      return;
    }

    overlay.innerHTML = ''; // Clear previous

    const x = component.properties.x || 0;
    const y = component.properties.y || 0;
    const w = element.offsetWidth;
    const h = element.offsetHeight;
    const offset = 5; // How far outside the element to show labels

    // Top Label (Y)
    const topLabel = document.createElement('div');
    topLabel.className = 'dimension-indicator';
    topLabel.textContent = `Y: ${y}`;
    topLabel.style.left = `${x + w / 2}px`;
    topLabel.style.top = `${y - offset - 12}px`; // 12 is approx label height
    topLabel.style.transform = 'translateX(-50%)';
    overlay.appendChild(topLabel);

    // Left Label (X)
    const leftLabel = document.createElement('div');
    leftLabel.className = 'dimension-indicator';
    leftLabel.textContent = `X: ${x}`;
    leftLabel.style.left = `${x - offset}px`;
    leftLabel.style.top = `${y + h / 2}px`;
    leftLabel.style.transform = 'translate(-100%, -50%)';
    overlay.appendChild(leftLabel);

    // Bottom Label (H)
    const bottomLabel = document.createElement('div');
    bottomLabel.className = 'dimension-indicator';
    bottomLabel.textContent = `H: ${h}`;
    bottomLabel.style.left = `${x + w / 2}px`;
    bottomLabel.style.top = `${y + h + offset}px`;
    bottomLabel.style.transform = 'translateX(-50%)';
    overlay.appendChild(bottomLabel);

    // Right Label (W)
    const rightLabel = document.createElement('div');
    rightLabel.className = 'dimension-indicator';
    rightLabel.textContent = `W: ${w}`;
    rightLabel.style.left = `${x + w + offset}px`;
    rightLabel.style.top = `${y + h / 2}px`;
    rightLabel.style.transform = 'translateY(-50%)';
    overlay.appendChild(rightLabel);
  }

  clearDimensionOverlay() {
    const overlay = document.getElementById('dimension-overlay');
    if (overlay) overlay.innerHTML = '';
  }
}

export default ComponentManager; 