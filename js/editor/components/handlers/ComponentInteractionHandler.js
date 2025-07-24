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

            // Note: We're not adding keydown listeners here anymore since EditorView is handling that
            // and will delegate to our handleKeyDown method when appropriate
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
        if (e.button !== 0 && e.type !== 'touchstart') return;

        let clientX, clientY;
        if (e.type === 'touchstart') {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        this.selectComponent(component.id, false); // Select but don't force panel show yet
        this.isDraggingComponent = true;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.draggedComponentStartX = component.properties.x || 0;
        this.draggedComponentStartY = component.properties.y || 0;

        // Delegate overlay update to the OverlayHandler via ComponentManager
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(this.editorView.selectedComponent);

        // Bind mouse move and up listeners to the document
        this.boundHandleMouseMove = this.handleComponentMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleComponentMouseUp.bind(this);
        document.addEventListener('mousemove', this.boundHandleMouseMove);
        document.addEventListener('mouseup', this.boundHandleMouseUp);
        document.addEventListener('touchmove', this.boundHandleMouseMove, { passive: false });
        document.addEventListener('touchend', this.boundHandleMouseUp);
    }

    /**
     * Handles mouse move event during component dragging.
     * @param {MouseEvent} e - The mouse event.
     */
    handleComponentMouseMove(e) {
        if (!this.isDraggingComponent || !this.editorView.selectedComponent) return;
        if (e.type === 'touchmove') e.preventDefault();

        let clientX, clientY;
        if (e.type === 'touchmove') {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;

        // Calculate potential new raw position based on mouse delta
        const deltaX = clientX - this.dragStartX;
        const deltaY = clientY - this.dragStartY;
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
        document.removeEventListener('touchmove', this.boundHandleMouseMove);
        document.removeEventListener('touchend', this.boundHandleMouseUp);
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
        console.log(`ComponentInteractionHandler.handleKeyDown: ${e.key}`);
        
        if (!this.editorView.selectedComponent) {
            console.log('No component selected for keyboard operation');
            return;
        }

        const targetTagName = e.target.tagName.toUpperCase();
        const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'SELECT' || targetTagName === 'TEXTAREA';
        
        // Handle Delete/Backspace keys regardless of other checks
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (isInputFocused) return;
            
            e.preventDefault();
            console.log('Deleting component via keyboard');
            
            const componentIdToDelete = this.editorView.selectedComponent.id;
            const deleteCommand = new DeleteComponentCommand(this.editorView, componentIdToDelete);
            this.editorView.undoRedoManager.executeCommand(deleteCommand);
            
            // Clear any guides
            if (this.componentManager && this.componentManager.alignmentOverlayHandler) {
                this.componentManager.alignmentOverlayHandler.clearAlignmentGuides();
                this.componentManager.alignmentOverlayHandler.clearDimensionOverlay();
            }
            
            return; // Exit early
        }

        // Handle movement keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (isInputFocused) return;
            
            e.preventDefault();
            console.log(`Moving component with ${e.key}`);

            const previewContainer = document.getElementById('preview-container');
            if (!previewContainer) return;

            const component = this.editorView.selectedComponent;
            const componentElement = document.querySelector(`.preview-component[data-component-id="${component.id}"]`);
            if (!componentElement) return;

            const originalPosition = { 
                x: parseInt(component.properties.x || 0), 
                y: parseInt(component.properties.y || 0) 
            };
            
            let moveDistance = e.shiftKey ? 10 : 1; // Move 10px with shift key, 1px normally
            let deltaX = 0;
            let deltaY = 0;

            // Calculate the delta based on key
            switch (e.key) {
                case 'ArrowUp': deltaY = -moveDistance; break;
                case 'ArrowDown': deltaY = moveDistance; break;
                case 'ArrowLeft': deltaX = -moveDistance; break;
                case 'ArrowRight': deltaX = moveDistance; break;
            }

            // Calculate new position
            const newX = originalPosition.x + deltaX;
            const newY = originalPosition.y + deltaY;
            
            console.log(`Moving from (${originalPosition.x},${originalPosition.y}) to (${newX},${newY})`);

            // Get component dimensions
            const componentWidth = componentElement.offsetWidth;
            const componentHeight = componentElement.offsetHeight;

            // Apply exact movement for arrow keys (no snapping)
            let finalX = newX;
            let finalY = newY;
            
            // Only apply boundary checks, no snapping
            // Ensure within boundaries
            finalX = Math.max(0, finalX);
            finalY = Math.max(0, finalY);
            
            if (finalX + componentWidth > previewContainer.clientWidth) {
                finalX = previewContainer.clientWidth - componentWidth;
            }
            if (finalY + componentHeight > previewContainer.clientHeight) {
                finalY = previewContainer.clientHeight - componentHeight;
            }

            // Apply visual update
            componentElement.style.left = `${finalX}px`;
            componentElement.style.top = `${finalY}px`;

            // Update component properties
            component.properties.x = finalX;
            component.properties.y = finalY;
            
            // Show alignment guides by default (but don't snap to them)
            if (this.componentManager && this.componentManager.alignmentOverlayHandler) {
                const snapResult = this.componentManager.alignmentOverlayHandler.calculateSnapPosition(
                    finalX, finalY, componentWidth, componentHeight, component.id
                );
                
                // Draw guides but don't snap
                this.componentManager.alignmentOverlayHandler.drawAlignmentGuides(snapResult.lines);
            }

            // Create a move command for undo/redo functionality
            if (originalPosition.x !== finalX || originalPosition.y !== finalY) {
                const moveCommand = new MoveComponentCommand(
                    this.editorView, 
                    component.id, 
                    { 
                        x: finalX, 
                        y: finalY 
                    }, 
                    null, 
                    originalPosition
                );
                this.editorView.undoRedoManager.executeCommand(moveCommand);
            }

            // Update property panel if visible
            if (this.editorView.propertyPanelVisible && this.editorView.propertyPanel) {
                const xInput = document.getElementById('prop-x');
                const yInput = document.getElementById('prop-y');
                if (xInput) xInput.value = finalX;
                if (yInput) yInput.value = finalY;
            }
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
}

export default ComponentInteractionHandler; 