import { UpdatePropertyCommand } from '../../commands/ComponentCommands.js';
// PropertyValueUtils might be needed if value conversion is complex during event handling
// import PropertyValueUtils from './PropertyValueUtils.js'; 

class PropertyPanelEventHandler {
    constructor(editorView, componentIdManager) {
        this.editorView = editorView;
        this.componentIdManager = componentIdManager;
        this.panel = document.getElementById('property-panel');
        this.debounceTimeouts = {}; // Store timeouts for debouncing
    }

    /**
     * Sets up all necessary event listeners for the property panel.
     */
    setupAllEventHandlers() {
        if (!this.panel) return;
        
        this._setupGroupToggleListeners();
        this._setupSliderSyncListeners();
        this._setupColorPreviewSyncListeners();
        this._setupWidthHeightListeners();
        this._setupPropertyInputListeners();
        this._setupIdChangeListener();
    }

    /**
     * Sets up listeners for toggling property group visibility.
     */
    _setupGroupToggleListeners() {
        this.panel.querySelectorAll('.property-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const group = header.closest('.property-group');
                if (group) {
                    group.classList.toggle('collapsed');
                    const icon = header.querySelector('.property-group-toggle');
                    if (icon) {
                        icon.textContent = group.classList.contains('collapsed') ? 'expand_less' : 'expand_more';
                    }
                }
            });
        });
    }

    /**
     * Sets up listeners to synchronize sliders with their number inputs.
     */
    _setupSliderSyncListeners() {
        const syncSlider = (sliderId, numberId) => {
            const slider = this.panel.querySelector(`#${sliderId}`);
            const numberInput = this.panel.querySelector(`#${numberId}`);
            if (slider && numberInput) {
                slider.oninput = (e) => {
                    numberInput.value = e.target.value;
                    // Trigger the actual property change command via the number input's listener
                    numberInput.dispatchEvent(new Event('input', { bubbles: true }));
                };
                numberInput.oninput = (e) => {
                    // Prevent feedback loop if triggered by slider
                    if (document.activeElement !== slider) {
                         slider.value = e.target.value;
                    }
                };
            }
        };
        syncSlider('prop-opacity-slider', 'prop-opacity');
        syncSlider('prop-progress-slider', 'prop-progress');
    }

    /**
     * Sets up listeners to synchronize color inputs with their previews.
     */
    _setupColorPreviewSyncListeners() {
        const syncColor = (inputId, previewId) => {
            const inputEl = this.panel.querySelector(`#${inputId}`);
            const previewEl = this.panel.querySelector(`#${previewId}`);
            if (inputEl && previewEl) {
                // Initial sync is handled by the updater
                // Update preview when color input value changes *during* interaction
                inputEl.oninput = (e) => {
                    previewEl.style.backgroundColor = e.target.value;
                    // The 'change' or debounced 'input' listener on the input element 
                    // will handle the command execution.
                };
            }
        };
        syncColor('prop-bgcolor', 'bgcolor-preview');
        syncColor('prop-textcolor', 'textcolor-preview');
        syncColor('prop-bordercolor', 'bordercolor-preview');
        syncColor('prop-hintcolor', 'hintcolor-preview');
    }

    /**
     * Sets up listeners for the width/height type selects and value inputs.
     */
    _setupWidthHeightListeners() {
        const setupDimension = (dimension) => {
            const typeSelect = this.panel.querySelector(`#prop-${dimension}-type`);
            const valueInput = this.panel.querySelector(`#prop-${dimension}-value`);
            const customRow = this.panel.querySelector(`#custom-${dimension}-row`);

            if (typeSelect && valueInput && customRow) {
                typeSelect.onchange = (e) => {
                    const isFixed = e.target.value === 'fixed';
                    customRow.style.display = isFixed ? 'flex' : 'none';
                    this._updateWidthHeightProperty(dimension, e.target.value, valueInput.value);
                };
                valueInput.oninput = (e) => {
                     // Only trigger update if type is fixed
                    if (typeSelect.value === 'fixed') {
                        // Debounce value input changes
                         this._debounce(`wh_${dimension}`, () => {
                            this._updateWidthHeightProperty(dimension, typeSelect.value, e.target.value);
                        }, 300);                       
                    }
                };
            }
        };
        setupDimension('width');
        setupDimension('height');
    }
    
    /**
     * Creates and executes an UpdatePropertyCommand for width or height changes.
     * @param {string} dimension - 'width' or 'height'.
     * @param {string} type - 'wrap_content', 'match_parent', or 'fixed'.
     * @param {string} value - The numerical value (as string) if type is 'fixed'.
     */
    _updateWidthHeightProperty(dimension, type, value) {
        if (!this.editorView.selectedComponent) return;
        
        let newValue;
        if (type === 'fixed') {
            const numValue = parseInt(value, 10);
            // Use pixel value, default to 100px if invalid/empty
            newValue = !isNaN(numValue) && numValue > 0 ? `${numValue}px` : '100px'; 
        } else {
            newValue = type; // Use 'wrap_content' or 'match_parent' directly
        }
        
        this._createAndExecuteCommand(`properties.${dimension}`, newValue);
    }

    /**
     * Sets up listeners for general property input fields.
     */
    _setupPropertyInputListeners() {
        // Configuration for each property input
        const propertyConfigs = [
            // Position
            { id: 'prop-x', prop: 'x', event: 'input', converter: val => parseInt(val) || 0 },
            { id: 'prop-y', prop: 'y', event: 'input', converter: val => parseInt(val) || 0 },
            // Layout
            { id: 'prop-margin', prop: 'margin', event: 'input', debounce: true },
            { id: 'prop-padding', prop: 'padding', event: 'input', debounce: true },
            // Appearance
            { id: 'prop-bgcolor', prop: 'bgColor', event: 'input' }, // Use input for live color update
            { id: 'prop-opacity', prop: 'opacity', event: 'input', converter: val => parseInt(val) || 100 },
            { id: 'prop-borderradius', prop: 'borderRadius', event: 'input', debounce: true },
            // Text
            { id: 'prop-text', prop: 'text', event: 'input', debounce: true },
            { id: 'prop-textsize', prop: 'textSize', event: 'input', converter: val => parseInt(val) || 14 },
            { id: 'prop-textcolor', prop: 'textColor', event: 'input' }, // Use input for live color update
            { id: 'prop-font', prop: 'font', event: 'change' },
            // Effects
            { id: 'prop-bordercolor', prop: 'borderColor', event: 'input' }, // Use input for live color update
            { id: 'prop-boxshadow', prop: 'boxShadow', event: 'input', debounce: true },
            // Component Specific
            { id: 'prop-hint', prop: 'hint', event: 'input', debounce: true },
            { id: 'prop-hintcolor', prop: 'hintColor', event: 'input' }, // Use input for live color update
            { id: 'prop-src', prop: 'src', event: 'input', debounce: true },
            { id: 'prop-scaleType', prop: 'scaleType', event: 'change' },
            { id: 'prop-checked', prop: 'checked', event: 'change', type: 'checkbox' },
            { id: 'prop-progress', prop: 'progress', event: 'input', converter: val => parseInt(val) || 0 },
            { id: 'prop-max', prop: 'max', event: 'input', converter: val => parseInt(val) || 100 },
            { id: 'prop-items', prop: 'items', event: 'input', debounce: true }, // Consider parsing later if needed as array
            { id: 'prop-orientation', prop: 'orientation', event: 'change' },
            { id: 'prop-url', prop: 'url', event: 'input', debounce: true },
        ];

        propertyConfigs.forEach(config => {
            const el = this.panel.querySelector(`#${config.id}`);
            if (el) {
                const eventType = config.event || 'change'; 
                const updateHandler = (e) => {
                    let value;
                    if (config.type === 'checkbox') {
                        value = el.checked;
                    } else {
                        value = el.value;
                    }
                    
                    const finalValue = config.converter ? config.converter(value) : value;
                    this._createAndExecuteCommand(`properties.${config.prop}`, finalValue);
                };

                if (config.debounce) {
                    el.addEventListener(eventType, (e) => {
                        this._debounce(config.prop, () => updateHandler(e), 300);                       
                    });
                } else {
                    el.addEventListener(eventType, updateHandler);
                }
            }
        });
    }

    /**
     * Sets up the listener for the component ID input field.
     */
    _setupIdChangeListener() {
        const idInput = this.panel.querySelector('#prop-id');
        if (idInput) {
            idInput.addEventListener('change', (e) => {
                const component = this.editorView.selectedComponent;
                if (!component) return;
                
                const oldId = component.id;
                const newId = e.target.value.trim();

                // Skip if no change or empty value
                if (newId === oldId || !newId) {
                    e.target.value = oldId; // Reset to old value if empty or unchanged
                    return;
                }

                // Attempt to handle the ID change using ComponentIdManager
                if (this.componentIdManager && this.editorView.currentScreen) {
                    const success = this.componentIdManager.handleIdChange(
                        oldId, 
                        newId, 
                        this.editorView.currentScreen.id
                    );
                    
                    if (success) {
                        // ID change was successful
                        // Update the input field (redundant but safe)
                        e.target.value = newId; 
                        // No need to re-render preview here, handleIdChange should manage it
                        // No need to re-select, handleIdChange should update the selection reference
                        console.log(`Component ID changed from ${oldId} to ${newId}`);
                    } else {
                        // ID change failed (e.g., duplicate ID), revert the input
                        e.target.value = oldId;
                        console.warn(`Failed to change component ID to ${newId}. It might be a duplicate.`);
                        // Optionally show a user message
                    }
                } else {
                     console.error("ComponentIdManager or currentScreen not available for ID change.");
                     e.target.value = oldId; // Revert if manager not available
                }
            });
        }
    }

    /**
     * Creates and executes an UpdatePropertyCommand.
     * @param {string} propertyPath - The full path to the property (e.g., "properties.text").
     * @param {any} newValue - The new value for the property.
     */
    _createAndExecuteCommand(propertyPath, newValue) {
        const component = this.editorView.selectedComponent;
        if (!component) return;

        // Get the old value (requires navigating the property path)
        const pathParts = propertyPath.split('.');
        let oldValue = component;
        try {
            pathParts.forEach(part => {
                oldValue = oldValue[part];
            });
        } catch (e) {
            console.warn("Could not retrieve old value for path:", propertyPath);
            oldValue = undefined; // Set to undefined if path is invalid
        }

        // Only execute if the value has actually changed
        // Use JSON.stringify for simple comparison of non-object values 
        // More robust comparison might be needed for objects/arrays if properties can be complex
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            const command = new UpdatePropertyCommand(
                this.editorView,
                component.id,
                propertyPath,
                newValue
            );
            this.editorView.undoRedoManager.executeCommand(command);
            
            // Delegate the preview update to the main panel class
            if (this.editorView.propertyPanel && typeof this.editorView.propertyPanel.updateComponentPreview === 'function') {
                this.editorView.propertyPanel.updateComponentPreview(component.id, propertyPath.split('.').pop(), newValue);
            } else {
                 console.warn("PropertyPanel or updateComponentPreview not found for preview update.");
            }
        }
    }
    
    /**
     * Basic debounce implementation.
     * @param {string} key - A unique key for the debounce timeout.
     * @param {function} func - The function to debounce.
     * @param {number} delay - The debounce delay in milliseconds.
     */
    _debounce(key, func, delay) {
        clearTimeout(this.debounceTimeouts[key]);
        this.debounceTimeouts[key] = setTimeout(func, delay);
    }
}

export default PropertyPanelEventHandler; 