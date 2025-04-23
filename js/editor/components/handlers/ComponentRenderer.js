import IndexedDBManager from '../../../utils/IndexedDBManager.js';

class ComponentRenderer {
    constructor(editorView, componentManager) {
        this.editorView = editorView;
        this.componentManager = componentManager; // May need for event listeners or selection
    }

    /**
     * Renders all components for the current screen in the preview container.
     */
    renderComponentsPreview() {
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;

        // Clear existing preview (keep overlays if they are outside the component rendering logic)
        // Find a way to preserve overlays or re-add them after clearing
        const alignmentGuides = document.getElementById('alignment-guides');
        const dimensionOverlay = document.getElementById('dimension-overlay');
        previewContainer.innerHTML = ''; // Clear components
        if (alignmentGuides) previewContainer.appendChild(alignmentGuides); // Re-add
        if (dimensionOverlay) previewContainer.appendChild(dimensionOverlay); // Re-add

        // Only proceed if a screen is selected
        if (!this.editorView.currentScreen) return;

        // Show empty message if no components
        if (this.editorView.currentScreen.components.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-preview';
            emptyMessage.innerHTML = '<p>Drag and drop components here</p>';
            previewContainer.appendChild(emptyMessage);
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

                // If this was the selected component, reselect it visually
                if (this.editorView.selectedComponent && this.editorView.selectedComponent.id === component.id) {
                    componentElement.classList.add('selected');
                    // Note: Property panel update might be handled elsewhere after selection
                }
            }
        });
    }

    /**
     * Creates the DOM element for a given component configuration.
     * @param {object} component - The component data object.
     * @returns {HTMLElement|null} The created component element or null.
     */
    createComponentElement(component) {
        const element = document.createElement('div');
        element.className = `preview-component preview-${component.type}`;
        element.dataset.componentId = component.id;
        const props = component.properties;

        const parseDimension = (dimension) => {
            if (!dimension) return null;
            if (dimension === 'match_parent' || dimension === 'wrap_content') return dimension;
            if (typeof dimension === 'number') return `${dimension}px`;
            if (typeof dimension === 'string') {
                if (dimension.endsWith('px')) return dimension;
                const num = parseInt(dimension, 10);
                if (!isNaN(num)) return `${num}px`;
            }
            return null;
        };

        const width = parseDimension(props.width);
        const height = parseDimension(props.height);

        if (width === 'match_parent') element.style.width = '100%';
        else if (width === 'wrap_content') element.style.width = 'auto';
        else if (width) element.style.width = width;

        if (height === 'match_parent') element.style.height = '100%';
        else if (height === 'wrap_content') element.style.height = 'auto';
        else if (height) element.style.height = height;

        element.style.position = 'absolute';
        element.style.left = `${props.x || 0}px`;
        element.style.top = `${props.y || 0}px`;
        element.style.minWidth = '10px';
        element.style.minHeight = '10px';
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

        element.innerHTML = ''; // Clear default
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'flex-start';

        this.renderComponentContent(element, component);

        // Add resize handles (delegate to ResizeHandler or keep here if tightly coupled)
        // Assuming ResizeHandler will add them later if selected
        // this.componentManager.resizeHandler.addResizeHandles(element);
        // OR, if ComponentManager calls this method and then adds handles:
        this.componentManager.addResizeHandles(element); // Requires ComponentManager ref


        // --- Event Listeners --- 
        // These should ideally be handled by an InteractionHandler listening on the container
        // But for direct attachment, we pass the componentManager reference

        // Mouse down for potential drag start
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            if (e.button !== 0) return;
            e.stopPropagation();
            this.componentManager.interactionHandler.handleComponentMouseDown(e, component);
        });

        // Click for selection
        element.addEventListener('click', (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            if (!this.componentManager.isDraggingComponent) { // Check flag on ComponentManager
                e.stopPropagation();
                 // Delegate selection to ComponentManager or InteractionHandler
                this.componentManager.interactionHandler.selectComponent(component.id, true);
            }
        });

        // Context menu (optional)
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Potentially delegate to InteractionHandler for context menu logic
            // this.componentManager.interactionHandler.handleContextMenu(e, component);
        });

        return element;
    }

    /**
     * Renders the specific content inside a component element based on its type.
     * @param {HTMLElement} element - The component's container element.
     * @param {object} component - The component data object.
     */
    renderComponentContent(element, component) {
        const props = component.properties;
        element.innerHTML = ''; // Clear first

        switch (component.type) {
             // Layouts
            case 'linearlayout-h':
            case 'scrollview-h':
                element.style.flexDirection = 'row';
                element.style.justifyContent = 'flex-start';
                element.style.alignItems = 'flex-start';
                element.innerHTML = `<!-- H Layout (${props.children?.length || 0}) -->`; // Placeholder
                break;
            case 'linearlayout-v':
            case 'scrollview-v':
                element.style.flexDirection = 'column';
                element.style.justifyContent = 'flex-start';
                element.style.alignItems = 'flex-start';
                element.innerHTML = `<!-- V Layout (${props.children?.length || 0}) -->`; // Placeholder
                break;
            case 'cardview':
                element.style.justifyContent = 'center';
                element.innerHTML = `<!-- Card (${props.children?.length || 0}) -->`; // Placeholder
                break;

            // Widgets
            case 'button':
                element.textContent = props.text || 'Button';
                element.style.textAlign = 'center';
                element.style.cursor = 'pointer';
                element.style.justifyContent = 'center';
                element.style.backgroundColor = props.bgColor || '#E0E0E0'; // Ensure default is applied if not present
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
                element.style.backgroundColor = props.bgColor || '#FFFFFF'; // Default background
                element.style.borderColor = props.borderColor || '#CCCCCC'; // Default border
                element.style.borderWidth = '1px';
                element.style.borderStyle = 'solid';
                break;
            case 'imageview':
                element.style.justifyContent = 'center';
                if (props.src) {
                    // Check if this is an IndexedDB image URL
                    if (props.src.startsWith('indexeddb://')) {
                        const imageId = parseInt(props.src.replace('indexeddb://', ''));
                        
                        // Create a loading placeholder
                        element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">hourglass_empty</i>';
                        
                        // Load the image from IndexedDB
                        this._loadIndexedDBImage(imageId).then(dataUrl => {
                            element.innerHTML = ''; // Clear placeholder
                            const img = document.createElement('img');
                            img.src = dataUrl;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = props.scaleType || 'contain';
                            element.appendChild(img);
                        }).catch(err => {
                            console.error('Error loading image:', err);
                            element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">broken_image</i>';
                        });
                    } else {
                        // Use direct URL
                        const img = document.createElement('img');
                        img.src = props.src;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = props.scaleType || 'contain';
                        element.appendChild(img);
                    }
                } else {
                    element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">image</i>';
                }
                element.style.backgroundColor = props.bgColor || '#CCCCCC'; // Default background
                break;
            case 'checkbox':
            case 'radiobutton':
                const checkInput = document.createElement('input');
                checkInput.type = component.type === 'checkbox' ? 'checkbox' : 'radio';
                checkInput.checked = props.checked || false;
                checkInput.disabled = true;
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
                switchToggle.style.backgroundColor = props.checked ? '#a5d6a7' : '#ccc';
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
                element.style.padding = '0';
                const progressBg = document.createElement('div');
                progressBg.style.width = '100%';
                progressBg.style.height = '100%';
                progressBg.style.backgroundColor = '#e0e0e0';
                progressBg.style.borderRadius = 'inherit';
                progressBg.style.overflow = 'hidden';
                const progressBar = document.createElement('div');
                progressBar.style.width = `${Math.min(100, Math.max(0, props.progress || 0))}%`;
                progressBar.style.height = '100%';
                progressBar.style.backgroundColor = props.progressColor || '#2196F3';
                progressBg.appendChild(progressBar);
                element.appendChild(progressBg);
                break;
            case 'seekbar':
                element.style.padding = '0';
                const track = document.createElement('div');
                track.style.width = '100%';
                track.style.height = '4px';
                track.style.backgroundColor = '#ccc';
                track.style.position = 'relative';
                track.style.borderRadius = '2px';
                track.style.top = '50%'; // Center track vertically
                track.style.transform = 'translateY(-50%)';
                const thumb = document.createElement('div');
                thumb.style.width = '14px';
                thumb.style.height = '14px';
                thumb.style.borderRadius = '50%';
                thumb.style.backgroundColor = '#2196F3';
                thumb.style.position = 'absolute';
                thumb.style.top = '50%';
                const progressPercent = Math.min(100, Math.max(0, props.progress || 0));
                thumb.style.left = `calc(${progressPercent}% - 7px)`;
                thumb.style.transform = 'translateY(-50%)';
                track.appendChild(thumb);
                element.appendChild(track);
                break;
             case 'spinner':
                element.innerHTML = `<span>${(props.items || '').split(',')[0] || 'Select'}</span><i class="material-icons" style="margin-left: auto;">arrow_drop_down</i>`;
                element.style.justifyContent = 'space-between';
                element.style.border = '1px solid #ccc';
                element.style.padding = props.padding || '4px 8px';
                break;
            case 'listview':
                 element.innerHTML = '<!-- ListView -->';
                 element.style.border = '1px solid #ccc'; // Keep border
                break;
            case 'webview':
                element.innerHTML = '<i class="material-icons" style="font-size: 48px; color: #888;">web</i>';
                element.style.justifyContent = 'center';
                element.style.border = '1px solid #ccc'; // Keep border
                break;
            default:
                element.textContent = component.type; // Fallback
        }
    }

    /**
     * Updates the visual representation of a single component based on new properties.
     * @param {string} componentId - The ID of the component to update.
     * @param {object} properties - The updated properties object.
     */
    updateComponentVisuals(componentId, properties) {
        const componentElement = document.querySelector(`.preview-component[data-component-id="${componentId}"]`);
        if (!componentElement) return;

        // Find the component data
        const component = this.componentManager.findComponentById(componentId);
        if (!component) return; // Need component data for context

        // Apply style updates based on the provided properties
        if (properties) {
            // Position
            if (properties.x !== undefined) componentElement.style.left = `${properties.x}px`;
            if (properties.y !== undefined) componentElement.style.top = `${properties.y}px`;

            // Dimensions
            const updateDimension = (propName, value) => {
                if (value === 'match_parent') componentElement.style[propName] = '100%';
                else if (value === 'wrap_content') componentElement.style[propName] = 'auto';
                else if (typeof value === 'string' && value.endsWith('px')) {
                    componentElement.style[propName] = value;
                } else if (typeof value === 'number') {
                    componentElement.style[propName] = `${value}px`;
                }
            };
            if (properties.width !== undefined) updateDimension('width', properties.width);
            if (properties.height !== undefined) updateDimension('height', properties.height);

            // Basic Styling
            if (properties.margin !== undefined) componentElement.style.margin = properties.margin;
            if (properties.padding !== undefined) componentElement.style.padding = properties.padding;
            if (properties.bgColor !== undefined) componentElement.style.backgroundColor = properties.bgColor;
            if (properties.opacity !== undefined) componentElement.style.opacity = (properties.opacity || 100) / 100;
            if (properties.borderRadius !== undefined) componentElement.style.borderRadius = properties.borderRadius;
            if (properties.borderColor !== undefined) {
                componentElement.style.borderColor = properties.borderColor;
                componentElement.style.borderWidth = properties.borderColor && properties.borderColor !== 'transparent' ? '1px' : '0';
                componentElement.style.borderStyle = properties.borderColor && properties.borderColor !== 'transparent' ? 'solid' : 'none';
            }
             if (properties.boxShadow !== undefined) componentElement.style.boxShadow = properties.boxShadow;

            // Text properties
            if (properties.textSize !== undefined) componentElement.style.fontSize = `${properties.textSize}px`;
            if (properties.textColor !== undefined) componentElement.style.color = properties.textColor;
            if (properties.font !== undefined) componentElement.style.fontFamily = properties.font;

            // --- Content updates based on component type --- 
            // Re-render the inner content based on potentially changed properties
            this.renderComponentContent(componentElement, { ...component, properties: { ...component.properties, ...properties } });

        }
    }

    /**
     * Loads an image from IndexedDB
     * @param {number} imageId - The ID of the image to load
     * @returns {Promise<string>} - Promise that resolves to the data URL
     */
    async _loadIndexedDBImage(imageId) {
        try {
            const image = await IndexedDBManager.getImage(imageId);
            return image.data;
        } catch (error) {
            console.error(`Failed to load image ${imageId} from IndexedDB:`, error);
            throw error;
        }
    }
}

export default ComponentRenderer; 