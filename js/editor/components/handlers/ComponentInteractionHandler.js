import {
    DeleteComponentCommand,
    MoveComponentCommand,
    UpdatePropertyCommand
} from '../../commands/ComponentCommands.js';

class ComponentInteractionHandler {
    constructor(editorView, componentManager) {
        this.editorView = editorView;
        this.componentManager = componentManager;
        this.isDraggingComponent = false; // State specific to interaction
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.draggedComponentStartX = 0;
        this.draggedComponentStartY = 0;
        this.boundHandleMouseMove = null;
        this.boundHandleMouseUp = null;

        this.onComponentSelected = null; // Callback when a component is selected
        this.onComponentDeselected = null; // Callback when a component is deselected
    }

    /**
     * Initializes event listeners related to component interaction within the preview.
     */
    initInteractionListeners() {
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            // Click on background to deselect
            previewContainer.addEventListener('click', (e) => {
                if (e.target === previewContainer) {
                    this.deselectComponent();
                    // Optionally hide property panel
                    if (this.editorView.propertyPanel && typeof this.editorView.propertyPanel.hidePropertyPanel === 'function') {
                        this.editorView.propertyPanel.hidePropertyPanel();
                    }
                }
            });

            // Listen for keyboard events globally when the editor has focus
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this)); // Add keyup listener
            
            // Prevent default context menu and add our own
            document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        }

        // Note: Mousedown/click listeners on individual components are added 
        // dynamically by ComponentRenderer.createComponentElement
    }

    /**
     * Handles mouse down event on a component element to initiate dragging.
     * This is typically called by an event listener set up in ComponentRenderer.
     * @param {MouseEvent} e - The mouse event.
     * @param {object} component - The component data object.
     */
    handleComponentMouseDown(e, component) {
        e.preventDefault(); // Prevent default browser image drag
        if (e.button !== 0) return; // Only left click

        this.selectComponent(component.id, false); // Select but don't force panel show yet
        this.isDraggingComponent = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.draggedComponentStartX = component.properties.x || 0;
        this.draggedComponentStartY = component.properties.y || 0;

        // Delegate overlay update to the OverlayHandler via ComponentManager
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(this.editorView.selectedComponent);

        // Bind mouse move and up listeners to the document
        this.boundHandleMouseMove = this.handleComponentMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleComponentMouseUp.bind(this);
        document.addEventListener('mousemove', this.boundHandleMouseMove);
        document.addEventListener('mouseup', this.boundHandleMouseUp);
    }

    /**
     * Handles mouse move event during component dragging.
     * @param {MouseEvent} e - The mouse event.
     */
    handleComponentMouseMove(e) {
        if (!this.isDraggingComponent || !this.editorView.selectedComponent) return;

        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;

        // Calculate potential new raw position based on mouse delta
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        let newX = this.draggedComponentStartX + deltaX;
        let newY = this.draggedComponentStartY + deltaY;

        // Get the dragged element for dimensions
        const draggedElement = document.querySelector(`.preview-component[data-component-id="${this.editorView.selectedComponent.id}"]`);
        if (!draggedElement) return;
        const draggedRect = draggedElement.getBoundingClientRect();
        const draggedWidth = draggedRect.width;
        const draggedHeight = draggedRect.height;

        // --- Alignment Logic (delegated to AlignmentOverlayHandler) ---
        const snapResult = this.componentManager.alignmentOverlayHandler.calculateSnapPosition(
            newX, newY, draggedWidth, draggedHeight, this.editorView.selectedComponent.id
        );

        newX = snapResult.x;
        newY = snapResult.y;
        const activeSnapLines = snapResult.lines;

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
        this.editorView.propertyPanel.updatePropertyValues();

        // Draw alignment guides (delegated)
        this.componentManager.alignmentOverlayHandler.drawAlignmentGuides(activeSnapLines);

        // Update dimension overlay (delegated)
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(this.editorView.selectedComponent, draggedElement);
    }

    /**
     * Handles mouse up event after component dragging.
     * @param {MouseEvent} e - The mouse event.
     */
    handleComponentMouseUp(e) {
        if (!this.isDraggingComponent) return;
        
        this.isDraggingComponent = false;
        document.removeEventListener('mousemove', this.boundHandleMouseMove);
        document.removeEventListener('mouseup', this.boundHandleMouseUp);
        this.boundHandleMouseMove = null;
        this.boundHandleMouseUp = null;

        if (this.editorView.selectedComponent) {
            // Create a command for the move operation
            const componentId = this.editorView.selectedComponent.id;
            const newPosition = {
                x: parseInt(this.editorView.selectedComponent.properties.x, 10) || 0,
                y: parseInt(this.editorView.selectedComponent.properties.y, 10) || 0
            };

            // Only record the command if it actually moved
            if (this.draggedComponentStartX !== newPosition.x || this.draggedComponentStartY !== newPosition.y) {
                const startPosition = {
                    x: parseInt(this.draggedComponentStartX, 10) || 0,
                    y: parseInt(this.draggedComponentStartY, 10) || 0
                };

                const moveCommand = new MoveComponentCommand(
                    this.editorView,
                    componentId,
                    newPosition,
                    null, // newParentId - keeping same parent
                    startPosition // Pass original position to command
                );
                this.editorView.undoRedoManager.executeCommand(moveCommand);
            }

            // Clear overlays and potentially update dimension display
            this.componentManager.alignmentOverlayHandler.clearAlignmentGuides();
            this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(this.editorView.selectedComponent);
        }
    }

    /**
     * Handles keydown events, primarily for moving and deleting selected components.
     * @param {KeyboardEvent} e - The keyboard event.
     */
    handleKeyDown(e) {
        // console.log(`[KeyDown] Key: ${e.key}, Target:`, e.target);
        if (!this.editorView.selectedComponent) {
            // console.log('[KeyDown] No component selected.');
            return;
        }

        const targetTagName = e.target.tagName.toUpperCase();
        const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'SELECT' || targetTagName === 'TEXTAREA';
        // console.log(`[KeyDown] Is input focused: ${isInputFocused}`);

        let needsVisualUpdate = false;
        let finalX = null;
        let finalY = null;
        const component = this.editorView.selectedComponent;
        const originalPosition = { x: component.properties.x || 0, y: component.properties.y || 0 };
        // console.log(`[KeyDown] Original Position:`, originalPosition);

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                console.log(`[KeyDown] Arrow key pressed: ${e.key}`);
                if (isInputFocused) {
                    console.log('[KeyDown] Input focused, ignoring arrow key for movement.');
                    return;
                }
                e.preventDefault(); // Attempt to prevent scrolling
                console.log('[KeyDown] preventDefault called.');
                needsVisualUpdate = true;

                const step = e.shiftKey ? 10 : 1;
                let potentialX = originalPosition.x;
                let potentialY = originalPosition.y;

                if (e.key === 'ArrowUp') potentialY -= step;
                if (e.key === 'ArrowDown') potentialY += step;
                if (e.key === 'ArrowLeft') potentialX -= step;
                if (e.key === 'ArrowRight') potentialX += step;
                console.log(`[KeyDown] Potential Position: x=${potentialX}, y=${potentialY}`);

                // --- Alignment and Direct Update --- 
                const componentElement = document.querySelector(`.preview-component[data-component-id="${component.id}"]`);
                const previewContainer = document.getElementById('preview-container');
                if (!componentElement || !previewContainer) {
                    console.error('[KeyDown] Component element or preview container not found!');
                    return;
                }

                const componentWidth = componentElement.offsetWidth;
                const componentHeight = componentElement.offsetHeight;
                console.log(`[KeyDown] Component Dimensions: w=${componentWidth}, h=${componentHeight}`);

                // Calculate snap position
                console.log('[KeyDown] Calculating snap position...');
                const snapResult = this.componentManager.alignmentOverlayHandler.calculateSnapPosition(
                    potentialX, potentialY, componentWidth, componentHeight, component.id
                );
                let snappedX = snapResult.x;
                let snappedY = snapResult.y;
                const activeSnapLines = snapResult.lines;
                console.log(`[KeyDown] Snap Result: x=${snappedX}, y=${snappedY}, lines:`, activeSnapLines);

                // Boundary checks
                const originalSnappedX = snappedX;
                const originalSnappedY = snappedY;
                snappedX = Math.max(0, snappedX);
                snappedY = Math.max(0, snappedY);
                if (snappedX + componentWidth > previewContainer.clientWidth) {
                    snappedX = previewContainer.clientWidth - componentWidth;
                }
                if (snappedY + componentHeight > previewContainer.clientHeight) {
                    snappedY = previewContainer.clientHeight - componentHeight;
                }
                if (snappedX !== originalSnappedX || snappedY !== originalSnappedY) {
                    console.log(`[KeyDown] Boundary applied. Final Snapped: x=${snappedX}, y=${snappedY}`);
                }

                // Apply visual update directly
                console.log(`[KeyDown] Applying style: left=${snappedX}px, top=${snappedY}px`);
                componentElement.style.left = `${snappedX}px`;
                componentElement.style.top = `${snappedY}px`;

                // Store final position for command and property update
                finalX = snappedX;
                finalY = snappedY;

                // Draw alignment guides
                console.log('[KeyDown] Drawing alignment guides...');
                this.componentManager.alignmentOverlayHandler.drawAlignmentGuides(activeSnapLines);

                break; // End arrow key handling

            case 'Delete':
            case 'Backspace':
                if (isInputFocused) return;
                e.preventDefault();
                this.deleteSelectedComponent();
                return; // Exit early
        }

        if (needsVisualUpdate && finalX !== null && finalY !== null) {
            console.log(`[KeyDown] Needs visual update block. finalX=${finalX}, finalY=${finalY}`);
            // Update component properties with the final snapped position
            component.properties.x = finalX;
            component.properties.y = finalY;

            // Create Move Command only if position actually changed from the start
            if (originalPosition.x !== finalX || originalPosition.y !== finalY) {
                 console.log('[KeyDown] Position changed, creating MoveComponentCommand.');
                 // Create command using the original position *before* this key press sequence started
                 // NOTE: This still creates a command per key press. Debouncing on keyup would be better for undo stack.
                const moveCommand = new MoveComponentCommand(this.editorView, component.id, { x: finalX, y: finalY }, null, originalPosition);
                this.editorView.undoRedoManager.executeCommand(moveCommand);
            } else {
                 console.log('[KeyDown] Position did not change, skipping command.');
            }
            
            // Update property panel
            console.log('[KeyDown] Updating property panel values...');
            this.editorView.propertyPanel.updatePropertyValues();
            // Update dimension overlay
            console.log('[KeyDown] Updating dimension overlay...');
            this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(component, document.querySelector(`.preview-component[data-component-id="${component.id}"]`));
        } else if (needsVisualUpdate) {
            console.warn('[KeyDown] needsVisualUpdate was true, but finalX/Y were null.');
        }
    }
    
    /**
     * Handles keyup events, primarily to clear alignment guides after movement.
     * @param {KeyboardEvent} e - The keyboard event.
     */
    handleKeyUp(e) {
        // Clear guides when an arrow key is released
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
             if (this.editorView.selectedComponent) {
                 this.componentManager.alignmentOverlayHandler.clearAlignmentGuides();
             }
        }
    }

    /**
     * Selects a component visually and updates the editor state.
     * @param {string} componentId - The ID of the component to select.
     * @param {boolean} [showPanel=true] - Whether to show the property panel.
     */
    selectComponent(componentId, showPanel = true) {
        if (!this.editorView.currentScreen) return;

        const previouslySelectedId = this.editorView.selectedComponent?.id;

        // Deselect previous if different
        if (previouslySelectedId && previouslySelectedId !== componentId) {
            this.deselectComponent();
        }

        // If already selected, potentially just ensure panel is shown
        if (previouslySelectedId === componentId) {
            if (showPanel && this.editorView.propertyPanel && typeof this.editorView.propertyPanel.showPropertyPanel === 'function') {
                this.editorView.propertyPanel.showPropertyPanel();
            }
             // Ensure sidebar tab is correct
            if (showPanel && this.editorView.sidebarManager) {
                this.editorView.sidebarManager.switchSidebarTab('properties');
            }
            return; // Already selected
        }

        // Find the component in the current screen data
        const component = this.componentManager.findComponentById(componentId);
        if (!component) {
            console.warn(`ComponentInteraction: Component with ID ${componentId} not found.`);
            return;
        }

        // Find the corresponding DOM element
        const componentElement = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
        if (!componentElement) {
            console.warn(`ComponentInteraction: DOM element for component ID ${componentId} not found.`);
            return; // Element might not be rendered yet
        }

        // Update state and UI
        this.editorView.selectedComponent = component;
        componentElement.classList.add('selected');
        
        // Update delete button visibility
        this._updateDeleteButtonVisibility();

        // Scroll the element into view if needed
        // componentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

        // Show and update the property panel
        if (showPanel && this.editorView.propertyPanel && typeof this.editorView.propertyPanel.showPropertyPanel === 'function') {
            this.editorView.propertyPanel.showPropertyPanel(); // Will also update values
        } else if (showPanel) {
            console.error("ComponentInteraction: PropertyPanel missing or showPropertyPanel method missing.");
        }

        // Switch sidebar tab to properties
        if (showPanel && this.editorView.sidebarManager) {
            this.editorView.sidebarManager.switchSidebarTab('properties');
        } else if (showPanel) {
             console.error("ComponentInteraction: SidebarManager or switchSidebarTab method missing.");
        }

        // Update dimension overlay (delegated)
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(component, componentElement);

        // Notify EditorView/ComponentManager if a callback is set
        if (typeof this.onComponentSelected === 'function') {
            this.onComponentSelected(component);
        }
    }

    /**
     * Deselects the currently selected component.
     */
    deselectComponent() {
        if (!this.editorView.selectedComponent) return;

        // Get reference to the component before nullifying it
        const deselectedComponent = this.editorView.selectedComponent;

        const prevSelectedElement = document.querySelector(`.preview-component[data-component-id="${deselectedComponent.id}"]`);
        if (prevSelectedElement) {
            prevSelectedElement.classList.remove('selected');
        }

        this.editorView.selectedComponent = null;
        
        // Update delete button visibility (hide all buttons)
        this._updateDeleteButtonVisibility();

        // Clear dimension overlay (delegated)
        this.componentManager.alignmentOverlayHandler.clearDimensionOverlay();

        // Hide property panel
        if (this.editorView.propertyPanel && typeof this.editorView.propertyPanel.hidePropertyPanel === 'function') {
            this.editorView.propertyPanel.hidePropertyPanel();
        }

        // Notify about deselection
        if (typeof this.onComponentDeselected === 'function') {
            this.onComponentDeselected(deselectedComponent);
        }
    }

    /**
     * Sets a callback function to be executed when a component is selected.
     * @param {Function} callback - The function to call. It receives the selected component object.
     */
    setOnComponentSelectedCallback(callback) {
        this.onComponentSelected = callback;
    }

    /**
     * Sets a callback function to be executed when a component is deselected.
     * @param {Function} callback - The function to call. It receives the deselected component object.
     */
    setOnComponentDeselectedCallback(callback) {
        this.onComponentDeselected = callback;
    }

    /**
     * Handles context menu event to show custom menu for components
     * @param {MouseEvent} e - The context menu event
     */
    handleContextMenu(e) {
        // Only handle in design tab
        if (this.editorView.activeTab !== 'design') return;
        
        // Check if clicked on a component
        const componentElement = e.target.closest('.preview-component');
        if (!componentElement) return;
        
        e.preventDefault(); // Prevent default context menu
        
        // Get component ID
        const componentId = componentElement.dataset.componentId;
        if (!componentId) return;
        
        // Select this component
        this.selectComponent(componentId, true);
        
        // Create and show custom context menu
        const contextMenu = document.createElement('div');
        contextMenu.className = 'component-context-menu';
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        contextMenu.style.padding = '4px 0';
        contextMenu.style.zIndex = '9999';
        
        // Add menu items
        const deleteItem = document.createElement('div');
        deleteItem.className = 'context-menu-item';
        deleteItem.textContent = 'Delete Component';
        deleteItem.style.padding = '8px 12px';
        deleteItem.style.cursor = 'pointer';
        deleteItem.style.display = 'flex';
        deleteItem.style.alignItems = 'center';
        deleteItem.style.gap = '8px';
        
        // Add icon
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'material-icons';
        deleteIcon.textContent = 'delete';
        deleteIcon.style.fontSize = '16px';
        deleteIcon.style.color = '#F44336';
        
        deleteItem.prepend(deleteIcon);
        
        // Hover effect
        deleteItem.addEventListener('mouseover', () => {
            deleteItem.style.backgroundColor = '#f5f5f5';
        });
        deleteItem.addEventListener('mouseout', () => {
            deleteItem.style.backgroundColor = 'transparent';
        });
        
        // Click handler
        deleteItem.addEventListener('click', () => {
            this.deleteSelectedComponent();
            document.body.removeChild(contextMenu);
        });
        
        contextMenu.appendChild(deleteItem);
        document.body.appendChild(contextMenu);
        
        // Close menu when clicking outside
        const closeMenu = (evt) => {
            if (!contextMenu.contains(evt.target)) {
                document.body.removeChild(contextMenu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Slight delay to avoid immediate closing
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    /**
     * Deletes the currently selected component
     */
    deleteSelectedComponent() {
        if (!this.editorView.selectedComponent) return;
        
        const componentIdToDelete = this.editorView.selectedComponent.id;
        console.log(`InteractionHandler: Requesting deletion of component: ${componentIdToDelete}`);
        
        // Delegate to ComponentManager for consistent deletion handling
        this.componentManager.deleteComponent(componentIdToDelete);
    }

    /**
     * Updates visibility of delete buttons on components based on selection state
     * @private
     */
    _updateDeleteButtonVisibility() {
        // Hide all delete buttons first
        document.querySelectorAll('.component-delete-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show delete button only for selected component
        if (this.editorView.selectedComponent) {
            const selectedElement = document.querySelector(`.preview-component[data-component-id="${this.editorView.selectedComponent.id}"]`);
            if (selectedElement) {
                const deleteBtn = selectedElement.querySelector('.component-delete-btn');
                if (deleteBtn) {
                    deleteBtn.style.display = 'flex';
                }
            }
        }
    }
}

export default ComponentInteractionHandler; 