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
            // Consider adding focus management to the editor main area
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
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
        this.editorView.propertyPanel.updatePropertyEditor();

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
        if (!this.editorView.selectedComponent) return;

        // Ignore key events if an input field is focused within the property panel or elsewhere
        const targetTagName = e.target.tagName.toUpperCase();
        const isInputFocused = targetTagName === 'INPUT' || targetTagName === 'SELECT' || targetTagName === 'TEXTAREA';

        let needsUpdate = false;
        const step = e.shiftKey ? 10 : 1;
        const component = this.editorView.selectedComponent;
        const originalPosition = { x: component.properties.x, y: component.properties.y };

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                if (isInputFocused) return;
                e.preventDefault();
                if (e.key === 'ArrowUp') component.properties.y -= step;
                if (e.key === 'ArrowDown') component.properties.y += step;
                if (e.key === 'ArrowLeft') component.properties.x -= step;
                if (e.key === 'ArrowRight') component.properties.x += step;
                needsUpdate = true;
                break;
            case 'Delete':
            case 'Backspace':
                if (isInputFocused) return;
                e.preventDefault();
                const componentIdToDelete = component.id;
                // Before deleting, deselect the component to avoid stale references
                this.deselectComponent();
                const deleteCommand = new DeleteComponentCommand(this.editorView, componentIdToDelete);
                this.editorView.undoRedoManager.executeCommand(deleteCommand);
                // Ensure the property panel is hidden
                if (this.editorView.propertyPanel && typeof this.editorView.propertyPanel.hidePropertyPanel === 'function') {
                    this.editorView.propertyPanel.hidePropertyPanel();
                }
                // Re-render to ensure DOM is updated
                this.componentManager.renderComponentsPreview();
                return; // Exit early as the component is gone
        }

        if (needsUpdate) {
            // Apply constraints
            component.properties.x = Math.max(0, component.properties.x);
            component.properties.y = Math.max(0, component.properties.y);

            // Create Move Command
            const newPosition = { x: component.properties.x, y: component.properties.y };
            if (originalPosition.x !== newPosition.x || originalPosition.y !== newPosition.y) {
                const moveCommand = new MoveComponentCommand(this.editorView, component.id, newPosition, null, originalPosition);
                this.editorView.undoRedoManager.executeCommand(moveCommand);
                // The command execution should trigger UI updates
            }
            
            // Update property panel directly for responsiveness (command might be async)
             this.editorView.propertyPanel.updatePropertyEditor();
             // Update overlays
            this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(component);
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

    /**
     * Explicitly deletes a component by ID
     * @param {string} componentId - The ID of the component to delete
     */
    deleteComponent(componentId) {
        // Create and execute the delete command
        const deleteCommand = new DeleteComponentCommand(this.editorView, componentId);
        this.editorView.undoRedoManager.executeCommand(deleteCommand);
        
        // If this was the selected component, deselect it
        if (this.editorView.selectedComponent && this.editorView.selectedComponent.id === componentId) {
            this.deselectComponent();
        }
        
        // Re-render the preview to ensure DOM is updated
        this.componentManager.renderComponentsPreview();
    }
}

export default ComponentInteractionHandler; 