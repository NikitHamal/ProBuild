import {
    UpdatePropertyCommand,
    MoveComponentCommand
} from '../../commands/ComponentCommands.js';

class ResizeHandler {
    constructor(editorView, componentManager) {
        this.editorView = editorView;
        this.componentManager = componentManager;
        this.isResizingComponent = false; // State specific to resizing
        this.resizeHandle = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.draggedComponentStartX = 0; // Component's initial X before resize
        this.draggedComponentStartY = 0; // Component's initial Y before resize
        this.resizeStartWidth = 0;       // Component's initial width before resize
        this.resizeStartHeight = 0;      // Component's initial height before resize
        this.boundHandleResizeMove = null;
        this.boundHandleResizeEnd = null;
    }

    /**
     * Adds resize handles to a component element.
     * This is typically called by the ComponentRenderer when creating/updating an element.
     * @param {HTMLElement} element - The component element.
     */
    addResizeHandles(element) {
        let resizeHandlesContainer = element.querySelector('.resize-handles');
        if (!resizeHandlesContainer) {
             resizeHandlesContainer = document.createElement('div');
             resizeHandlesContainer.className = 'resize-handles';
             element.appendChild(resizeHandlesContainer);
        } else {
            resizeHandlesContainer.innerHTML = ''; // Clear existing handles if updating
        }

        const handlePositions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

        handlePositions.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${position}`;
            handle.dataset.position = position;

            // Add event listener for starting resize
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Prevent triggering component drag
                const componentId = element.dataset.componentId;
                 // Delegate to handleResizeStart, passing the component data
                 const component = this.componentManager.findComponentById(componentId);
                if (component) {
                    this.handleResizeStart(e, component, position);
                }
            });

            resizeHandlesContainer.appendChild(handle);
        });
    }

    /**
     * Handles the mouse down event on a resize handle to initiate resizing.
     * @param {MouseEvent} e - The mouse event.
     * @param {object} component - The component data object.
     * @param {string} position - The position of the handle (e.g., 'n', 'se').
     */
    handleResizeStart(e, component, position) {
        e.preventDefault();
        e.stopPropagation();

        // Ensure the component is selected (handled by InteractionHandler, but good check)
        // this.componentManager.interactionHandler.selectComponent(component.id, false);

        this.isResizingComponent = true;
        this.resizeHandle = position;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        // Get current component dimensions and position from the element/properties
        const componentElement = document.querySelector(`.preview-component[data-component-id="${component.id}"]`);
        if (!componentElement) {
            this.isResizingComponent = false;
            return;
        }

        const rect = componentElement.getBoundingClientRect(); // Use computed dimensions
        this.draggedComponentStartX = component.properties.x || 0;
        this.draggedComponentStartY = component.properties.y || 0;
         // Use offsetWidth/Height for raw dimensions without transforms potentially included in getBoundingClientRect
        this.resizeStartWidth = componentElement.offsetWidth;
        this.resizeStartHeight = componentElement.offsetHeight;


        // Delegate overlay update
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(component, componentElement);

        // Set up global listeners for move and end
        this.boundHandleResizeMove = this.handleResizeMove.bind(this);
        this.boundHandleResizeEnd = this.handleResizeEnd.bind(this);
        document.addEventListener('mousemove', this.boundHandleResizeMove);
        document.addEventListener('mouseup', this.boundHandleResizeEnd);
    }

    /**
     * Handles the mouse move event during component resizing.
     * @param {MouseEvent} e - The mouse event.
     */
    handleResizeMove(e) {
        if (!this.isResizingComponent || !this.editorView.selectedComponent) return;

        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;

        const componentElement = document.querySelector(`.preview-component[data-component-id="${this.editorView.selectedComponent.id}"]`);
        if (!componentElement) return;

        let newX = this.draggedComponentStartX;
        let newY = this.draggedComponentStartY;
        let newWidth = this.resizeStartWidth;
        let newHeight = this.resizeStartHeight;
        const minDimension = 10; // Minimum size

        // Calculate new dimensions and position based on handle
        switch (this.resizeHandle) {
            case 'e': // East
                newWidth = Math.max(minDimension, this.resizeStartWidth + deltaX);
                break;
            case 'w': // West
                newWidth = Math.max(minDimension, this.resizeStartWidth - deltaX);
                newX = this.draggedComponentStartX + (this.resizeStartWidth - newWidth);
                break;
            case 's': // South
                newHeight = Math.max(minDimension, this.resizeStartHeight + deltaY);
                break;
            case 'n': // North
                newHeight = Math.max(minDimension, this.resizeStartHeight - deltaY);
                newY = this.draggedComponentStartY + (this.resizeStartHeight - newHeight);
                break;
            case 'ne': // North-East
                newWidth = Math.max(minDimension, this.resizeStartWidth + deltaX);
                newHeight = Math.max(minDimension, this.resizeStartHeight - deltaY);
                newY = this.draggedComponentStartY + (this.resizeStartHeight - newHeight);
                break;
            case 'nw': // North-West
                newWidth = Math.max(minDimension, this.resizeStartWidth - deltaX);
                newHeight = Math.max(minDimension, this.resizeStartHeight - deltaY);
                newX = this.draggedComponentStartX + (this.resizeStartWidth - newWidth);
                newY = this.draggedComponentStartY + (this.resizeStartHeight - newHeight);
                break;
            case 'se': // South-East
                newWidth = Math.max(minDimension, this.resizeStartWidth + deltaX);
                newHeight = Math.max(minDimension, this.resizeStartHeight + deltaY);
                break;
            case 'sw': // South-West
                newWidth = Math.max(minDimension, this.resizeStartWidth - deltaX);
                newHeight = Math.max(minDimension, this.resizeStartHeight + deltaY);
                newX = this.draggedComponentStartX + (this.resizeStartWidth - newWidth);
                break;
        }

        // Update component element style directly for visual feedback
        componentElement.style.left = `${Math.round(newX)}px`;
        componentElement.style.top = `${Math.round(newY)}px`;
        componentElement.style.width = `${Math.round(newWidth)}px`;
        componentElement.style.height = `${Math.round(newHeight)}px`;

        // Store new values in component properties (will be saved via command on mouseup)
        const properties = this.editorView.selectedComponent.properties;
        properties.x = Math.round(newX);
        properties.y = Math.round(newY);
        // Store dimensions as pixel strings for consistency, unless they were special values
        properties.width = `${Math.round(newWidth)}px`;
        properties.height = `${Math.round(newHeight)}px`;

        // Update property panel in real-time
        this.editorView.propertyPanel.updatePropertyEditor();

        // Update dimension overlay (delegated)
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(this.editorView.selectedComponent, componentElement);
    }

    /**
     * Handles the mouse up event after component resizing.
     * @param {MouseEvent} e - The mouse event.
     */
    handleResizeEnd(e) {
        if (!this.isResizingComponent) return;
        
        this.isResizingComponent = false;
        document.removeEventListener('mousemove', this.boundHandleResizeMove);
        document.removeEventListener('mouseup', this.boundHandleResizeEnd);
        this.boundHandleResizeMove = null;
        this.boundHandleResizeEnd = null;

        if (!this.editorView.selectedComponent) return;

        const componentId = this.editorView.selectedComponent.id;
        const finalProps = this.editorView.selectedComponent.properties;

        // Convert start dimensions to strings for comparison
        const startWidthPx = `${Math.round(this.resizeStartWidth)}px`;
        const startHeightPx = `${Math.round(this.resizeStartHeight)}px`;

        let commands = [];

        // Command for Width Change
        if (finalProps.width !== startWidthPx) { // Compare with original pixel value
            commands.push(new UpdatePropertyCommand(
                this.editorView,
                componentId,
                'properties.width',
                finalProps.width,
                 startWidthPx // Store original px value for undo
            ));
        }

        // Command for Height Change
        if (finalProps.height !== startHeightPx) {
             commands.push(new UpdatePropertyCommand(
                this.editorView,
                componentId,
                'properties.height',
                finalProps.height,
                startHeightPx // Store original px value for undo
            ));
        }

        // Command for Position Change (if it occurred during resize)
        if (finalProps.x !== this.draggedComponentStartX || finalProps.y !== this.draggedComponentStartY) {
            const startPosition = {
                x: this.draggedComponentStartX,
                y: this.draggedComponentStartY
            };
            const endPosition = {
                x: finalProps.x,
                y: finalProps.y
            };
            commands.push(new MoveComponentCommand(
                this.editorView,
                componentId,
                endPosition,
                null,
                startPosition
            ));
        }

        // Execute commands if any changes were made
        if (commands.length > 0) {
            // If multiple commands, consider wrapping them in a single composite command
            // For now, execute sequentially
            commands.forEach(cmd => this.editorView.undoRedoManager.executeCommand(cmd));
        }

        // Update overlay (delegated)
        this.componentManager.alignmentOverlayHandler.updateDimensionOverlay(this.editorView.selectedComponent);
    }
}

export default ResizeHandler; 