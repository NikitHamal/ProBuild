import { AddComponentCommand } from '../../commands/ComponentCommands.js';

class DragDropHandler {
    constructor(editorView, componentManager) {
        this.editorView = editorView;
        this.componentManager = componentManager;
    }

    /**
     * Initializes drag-and-drop for component items in the sidebar
     * and drop functionality for the preview container.
     */
    initComponentDragFromSidebar() {
        const componentItems = document.querySelectorAll('.component-item[draggable="true"]');
        const previewContainer = document.getElementById('preview-container');

        if (!previewContainer) return;

        // Add event listeners for drag operations on component items
        componentItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                // Store the component type in dataTransfer
                e.dataTransfer.setData('text/plain', item.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
                // Set a custom drag image if needed
                const dragIcon = document.createElement('div');
                dragIcon.textContent = item.querySelector('.component-name').textContent;
                dragIcon.className = 'drag-preview';
                document.body.appendChild(dragIcon);
                e.dataTransfer.setDragImage(dragIcon, 0, 0);
                setTimeout(() => document.body.removeChild(dragIcon), 0);
            });

            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const componentType = e.currentTarget.dataset.type;
                const touch = e.touches[0];
                this.handleTouchStart(touch, componentType);
            });
        });

        // Add event listeners for the preview container
        previewContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        previewContainer.addEventListener('drop', this.handleDrop.bind(this));

        // Add touch listeners to the document
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }


    // Renamed from original ComponentManager method
    handleComponentItemDragStart(e) {
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
        const previewContainer = document.getElementById('preview-container'); // Target the main container
        if (!componentType || !previewContainer) return;

        const rect = previewContainer.getBoundingClientRect();
        // Calculate drop position relative to the container, accounting for scroll
        // Use clientX/Y relative to viewport, then adjust by container's top-left corner
        const x = e.clientX - rect.left + previewContainer.scrollLeft;
        const y = e.clientY - rect.top + previewContainer.scrollTop;

        // Adjust slightly so the component top-left is near the cursor, not centered on it
        const adjustedX = Math.max(0, x - 10);
        const adjustedY = Math.max(0, y - 10);

        // Delegate adding the component back to the ComponentManager or EditorView
        this.componentManager.addComponentToScreen(componentType, adjustedX, adjustedY);
    }

    // Setup specific event listeners needed by this handler
    setupDesignTabEvents() {
        // Component Drag FROM sidebar
        document.querySelectorAll('.components-sidebar .component-item').forEach(item => {
             // Use the renamed specific handler if preferred, or keep original if needed
             item.addEventListener('dragstart', this.handleComponentItemDragStart.bind(this));
        });

        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.addEventListener('dragover', this.handleDragOver.bind(this));
            previewContainer.addEventListener('drop', this.handleDrop.bind(this));
        }
    }

    handleTouchStart(touch, componentType) {
        this.touchDragging = true;
        this.draggedComponentType = componentType;

        // Create a drag preview element
        this.dragPreview = document.createElement('div');
        this.dragPreview.className = 'drag-preview';
        this.dragPreview.textContent = componentType;
        document.body.appendChild(this.dragPreview);

        this.updateDragPreviewPosition(touch);
    }

    handleTouchMove(e) {
        if (!this.touchDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDragPreviewPosition(touch);
    }

    handleTouchEnd(e) {
        if (!this.touchDragging) return;
        this.touchDragging = false;
        document.body.removeChild(this.dragPreview);

        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

        if (dropTarget && dropTarget.closest('#preview-container')) {
            const previewContainer = dropTarget.closest('#preview-container');
            const rect = previewContainer.getBoundingClientRect();
            const x = touch.clientX - rect.left + previewContainer.scrollLeft;
            const y = touch.clientY - rect.top + previewContainer.scrollTop;

            this.componentManager.addComponentToScreen(this.draggedComponentType, x, y);
        }
    }

    updateDragPreviewPosition(touch) {
        this.dragPreview.style.left = `${touch.clientX - this.dragPreview.offsetWidth / 2}px`;
        this.dragPreview.style.top = `${touch.clientY - this.dragPreview.offsetHeight / 2}px`;
    }
}

export default DragDropHandler; 