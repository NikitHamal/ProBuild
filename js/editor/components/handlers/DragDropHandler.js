import { AddComponentCommand } from '../../commands/ComponentCommands.js';

class DragDropHandler {
    constructor(editorView, componentManager) {
        this.editorView = editorView;
        this.componentManager = componentManager;
        this.isHandlingDrop = false; // Add a flag to prevent duplicate drops
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
        });

        // Add event listeners for the preview container
        previewContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        previewContainer.addEventListener('drop', this.handleDrop.bind(this));
    }


    // Renamed from original ComponentManager method
    handleComponentItemDragStart(e) {
        // Check if e.target is an Element before calling closest
        if (e.target && e.target.closest) {
            const componentItem = e.target.closest('.component-item');
            if (componentItem && componentItem.dataset.type) {
                e.dataTransfer.setData('text/plain', componentItem.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            }
        }
    }

    handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e) {
        e.preventDefault();
        
        // Prevent duplicate component creation by checking if we're already handling a drop
        if (this.isHandlingDrop) {
            return;
        }
        
        this.isHandlingDrop = true;
        
        try {
            const componentType = e.dataTransfer.getData('text/plain');
            const previewContainer = document.getElementById('preview-container'); // Target the main container
            if (!componentType || !previewContainer) {
                this.isHandlingDrop = false;
                return;
            }
    
            const rect = previewContainer.getBoundingClientRect();
            // Calculate drop position relative to the container, accounting for scroll
            // Use clientX/Y relative to viewport, then adjust by container's top-left corner
            const x = e.clientX - rect.left + previewContainer.scrollLeft;
            const y = e.clientY - rect.top + previewContainer.scrollTop;
    
            // Adjust slightly so the component top-left is near the cursor, not centered on it
            const adjustedX = Math.max(0, x - 10);
            const adjustedY = Math.max(0, y - 10);
    
            // Check if it's a layout component
            const isLayout = componentType.startsWith('linearlayout') || 
                            componentType.startsWith('scrollview') || 
                            componentType === 'cardview';
            
            if (isLayout) {
                console.log(`DragDropHandler: Adding layout component of type ${componentType}`);
            }
            
            // Delegate adding the component back to the ComponentManager or EditorView
            this.componentManager.addComponentToScreen(componentType, adjustedX, adjustedY);
            
            // For layout components, ensure the code tab is updated
            if (isLayout && this.editorView.codeManager && this.editorView.codeManager.fileManager) {
                console.log("DragDropHandler: Updating code files for new layout component");
                
                // Short delay to ensure the component is fully added
                setTimeout(() => {
                    // Mark files as dirty
                    const fileManager = this.editorView.codeManager.fileManager;
                    fileManager.markFileAsDirty('layout_component', 'layout');
                    fileManager.markFileAsDirty('layout_component', 'main');
                    
                    // Regenerate affected files
                    const affectedFiles = ['layout', 'main'];
                    affectedFiles.forEach(fileId => {
                        const newContent = fileManager.generateFileContent(fileId);
                        fileManager.updateFileContent(fileId, newContent);
                    });
                    
                    // Force save
                    fileManager.triggerAutoSave(true);
                }, 100);
            }
            
            // Reset the flag after a slight delay to prevent any race conditions
            setTimeout(() => {
                this.isHandlingDrop = false;
            }, 200);
        } catch (error) {
            console.error("Error handling component drop:", error);
            this.isHandlingDrop = false;
        }
    }

    // Setup specific event listeners needed by this handler
    setupDesignTabEvents() {
        console.log("Setting up drag and drop event listeners");
        
        // Component Drag FROM sidebar - using more robust approach
        const componentItems = document.querySelectorAll('.components-sidebar .component-item');
        if (componentItems.length === 0) {
            console.warn("No component items found to set up drag events");
        }
        
        componentItems.forEach(item => {
            // Remove any existing listeners to prevent duplicates
            const oldListener = item._dragStartListener;
            if (oldListener) {
                item.removeEventListener('dragstart', oldListener);
            }
            
            // Add with proper binding and store the reference
            const boundHandler = this.handleComponentItemDragStart.bind(this);
            item.addEventListener('dragstart', boundHandler);
            item._dragStartListener = boundHandler;
            console.log(`Added dragstart listener to ${item.dataset.type} component`);
        });

        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            // Remove any existing listeners to prevent duplicates
            const oldDragOverListener = previewContainer._dragOverListener;
            const oldDropListener = previewContainer._dropListener;
            
            if (oldDragOverListener) {
                previewContainer.removeEventListener('dragover', oldDragOverListener);
            }
            if (oldDropListener) {
                previewContainer.removeEventListener('drop', oldDropListener);
            }
            
            // Add with proper binding and store references
            const boundDragOver = this.handleDragOver.bind(this);
            const boundDrop = this.handleDrop.bind(this);
            
            previewContainer.addEventListener('dragover', boundDragOver);
            previewContainer.addEventListener('drop', boundDrop);
            
            previewContainer._dragOverListener = boundDragOver;
            previewContainer._dropListener = boundDrop;
            
            console.log("Added dragover/drop listeners to preview container");
        } else {
            console.error("Preview container not found for drag and drop setup");
        }
    }
}

export default DragDropHandler; 