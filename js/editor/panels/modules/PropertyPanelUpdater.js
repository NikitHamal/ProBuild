import PropertyValueUtils from './PropertyValueUtils.js';

class PropertyPanelUpdater {
    constructor(editorView) {
        this.editorView = editorView;
        this.panel = document.getElementById('property-panel'); // Cache the panel element
    }

    /**
     * Updates the entire property panel UI based on the currently selected component.
     */
    updatePanelForSelectedComponent() {
        if (!this.panel) {
            console.error('Property panel element not found!');
            return;
        }
        const component = this.editorView.selectedComponent;
        if (!component) {
            this.hidePanelUI();
            return;
        }

        this.showPanelUI();
        this._updateInputValues(component);
        this._updateComponentSpecificVisibility(component);
    }

    /**
     * Populates the input fields with the component's property values.
     * @param {object} component - The selected component object.
     */
    _updateInputValues(component) {
        const props = component.properties;
        const type = component.type;

        // Helper to set value, using cached panel element
        const setValue = (id, value, type = 'value') => {
            const el = this.panel.querySelector(`#${id}`);
            if (el) {
                if (type === 'checkbox') {
                    el.checked = !!value;
                } else if (type === 'color') {
                    const hexValue = PropertyValueUtils.formatColorForInput(value);
                    el.value = hexValue;
                    this._updateColorPreviewUI(id, id.replace('prop-', '') + '-preview', hexValue);
                } else if (type === 'range') {
                    const numValue = value !== null && value !== undefined ? value : '0';
                    el.value = numValue;
                    // Also update the corresponding number input
                    const numberInputId = id.replace('-slider', '');
                    this._updateSliderUI(id, numberInputId, numValue);
                } else {
                    el.value = value !== null && value !== undefined ? value : '';
                }
            }
        };

        // Set common properties
        setValue('prop-id', component.id);
        setValue('prop-type', type);
        setValue('prop-x', props.x);
        setValue('prop-y', props.y);
        setValue('prop-margin', props.margin);
        setValue('prop-padding', props.padding);
        setValue('prop-bgcolor', props.bgColor, 'color');
        setValue('prop-opacity', props.opacity || 100);
        setValue('prop-opacity-slider', props.opacity || 100, 'range');
        setValue('prop-borderradius', props.borderRadius || '0px');
        setValue('prop-bordercolor', props.borderColor, 'color');
        setValue('prop-boxshadow', props.boxShadow || 'none');

        // Width & Height
        this._updateWidthHeightUI(props.width, props.height);

        // Text properties (if applicable)
        const hasText = ['textview', 'button', 'edittext', 'checkbox', 'radiobutton', 'switch'].includes(type);
        if (hasText) {
            setValue('prop-text', props.text);
        }
        const hasTextOptions = hasText || type === 'edittext';
        if (hasTextOptions) {
            setValue('prop-textsize', props.textSize || 14);
            setValue('prop-textcolor', props.textColor, 'color');
            setValue('prop-font', props.font);
        }

        // Component-specific properties
        if (type === 'edittext') {
            setValue('prop-hint', props.hint);
            setValue('prop-hintcolor', props.hintColor, 'color');
        }
        if (type === 'imageview') {
            setValue('prop-src', props.src);
            setValue('prop-scaleType', props.scaleType || 'fitCenter');
        }
        if (['checkbox', 'radiobutton', 'switch'].includes(type)) {
            setValue('prop-checked', props.checked, 'checkbox');
        }
        if (['progressbar', 'seekbar'].includes(type)) {
            setValue('prop-progress', props.progress);
            setValue('prop-progress-slider', props.progress, 'range');
            setValue('prop-max', props.max || 100);
        }
        if (['spinner', 'listview'].includes(type)) {
            setValue('prop-items', Array.isArray(props.items) ? props.items.join(', ') : props.items);
        }
        if (type.startsWith('linearlayout') || type.startsWith('scrollview')) {
            setValue('prop-orientation', props.orientation);
        }
        if (type === 'webview') {
            setValue('prop-url', props.url);
        }
    }

    /**
     * Shows or hides specific property rows based on the component type.
     * @param {object} component - The selected component object.
     */
    _updateComponentSpecificVisibility(component) {
        const type = component.type;

        // Helper to show/hide row
        const showRow = (propName, show) => {
            const row = this.panel.querySelector(`.property-row[data-prop="${propName}"]`);
            if (row) row.style.display = show ? 'flex' : 'none';
        };

        // --- Text Group Visibility --- 
        const hasText = ['textview', 'button', 'edittext', 'checkbox', 'radiobutton', 'switch'].includes(type);
        const textGroup = this.panel.querySelector('#text-group');
        if (textGroup) textGroup.style.display = hasText ? 'block' : 'none';
        
        // Individual text props (only if group is visible)
        if (hasText) {
            showRow('text', true); // Always show text input if the group is visible
            const hasTextOptions = hasText || type === 'edittext';
            showRow('textSize', hasTextOptions);
            showRow('textColor', hasTextOptions);
            showRow('font', hasTextOptions);
        }

        // --- Component Specific Group Visibility --- 
        const specificPropsToShow = [];
        if (type === 'edittext') specificPropsToShow.push('hint', 'hintColor');
        if (type === 'imageview') specificPropsToShow.push('src', 'scaleType');
        if (['checkbox', 'radiobutton', 'switch'].includes(type)) specificPropsToShow.push('checked');
        if (['progressbar', 'seekbar'].includes(type)) specificPropsToShow.push('progress', 'max');
        if (['spinner', 'listview'].includes(type)) specificPropsToShow.push('items');
        if (type.startsWith('linearlayout') || type.startsWith('scrollview')) specificPropsToShow.push('orientation');
        if (type === 'webview') specificPropsToShow.push('url');

        // Hide all specific rows first
        this.panel.querySelectorAll('#component-specific-group .property-row[data-prop]').forEach(row => {
            row.style.display = 'none';
        });

        // Show the relevant ones
        specificPropsToShow.forEach(propName => showRow(propName, true));

        // Show/hide the entire group
        const specificGroup = this.panel.querySelector('#component-specific-group');
        if (specificGroup) specificGroup.style.display = specificPropsToShow.length > 0 ? 'block' : 'none';
    }

    /**
     * Updates the width/height select and input fields.
     * @param {string|number} widthValue - Current width property value.
     * @param {string|number} heightValue - Current height property value.
     */
    _updateWidthHeightUI(widthValue, heightValue) {
        const widthInfo = PropertyValueUtils.parseWidthHeightValue(widthValue);
        const widthTypeSelect = this.panel.querySelector('#prop-width-type');
        const customWidthRow = this.panel.querySelector('#custom-width-row');
        const widthValueInput = this.panel.querySelector('#prop-width-value');
        if (widthTypeSelect) widthTypeSelect.value = widthInfo.type;
        if (widthValueInput) widthValueInput.value = widthInfo.value ?? '';
        if (customWidthRow) customWidthRow.style.display = widthInfo.type === 'fixed' ? 'flex' : 'none';

        const heightInfo = PropertyValueUtils.parseWidthHeightValue(heightValue);
        const heightTypeSelect = this.panel.querySelector('#prop-height-type');
        const customHeightRow = this.panel.querySelector('#custom-height-row');
        const heightValueInput = this.panel.querySelector('#prop-height-value');
        if (heightTypeSelect) heightTypeSelect.value = heightInfo.type;
        if (heightValueInput) heightValueInput.value = heightInfo.value ?? '';
        if (customHeightRow) customHeightRow.style.display = heightInfo.type === 'fixed' ? 'flex' : 'none';
    }

    /**
     * Updates the visual state of a slider and its corresponding number input.
     * @param {string} sliderId - The ID of the slider element.
     * @param {string} numberId - The ID of the number input element.
     * @param {number} value - The value to set.
     */
    _updateSliderUI(sliderId, numberId, value) {
        const sliderEl = this.panel.querySelector(`#${sliderId}`);
        const numberEl = this.panel.querySelector(`#${numberId}`);
        if (sliderEl) sliderEl.value = value;
        if (numberEl) numberEl.value = value;
    }

    /**
     * Updates the background color of a color preview div.
     * @param {string} inputId - The ID of the color input element.
     * @param {string} previewId - The ID of the preview div element.
     * @param {string} hexColor - The hex color value.
     */
    _updateColorPreviewUI(inputId, previewId, hexColor) {
        // The input value is set in _updateInputValues
        const previewEl = this.panel.querySelector(`#${previewId}`);
        if (previewEl) {
            const propertyName = inputId.replace('prop-', '');
            const property = this.editorView.selectedComponent?.properties?.[propertyName];
            
            // Check if this is a none value
            const isNone = hexColor === '#F5F5F5' && 
                (inputId === 'prop-bgcolor' || inputId === 'prop-bordercolor') &&
                (property === 'none' || property === 'transparent');
                
            if (isNone) {
                // Set checkered pattern for none
                previewEl.style.backgroundColor = 'transparent';
                previewEl.style.backgroundImage = 'linear-gradient(45deg, #eaeaea 25%, transparent 25%, transparent 75%, #eaeaea 75%, #eaeaea), linear-gradient(45deg, #eaeaea 25%, transparent 25%, transparent 75%, #eaeaea 75%, #eaeaea)';
                previewEl.style.backgroundSize = '8px 8px';
                previewEl.style.backgroundPosition = '0 0, 4px 4px';
            } else {
                // Regular color
                previewEl.style.backgroundColor = hexColor;
                previewEl.style.backgroundImage = 'none';
            }
        }
    }
    
     /**
     * Shows the property groups and hides the "no component selected" message.
     */
    showPanelUI() {
        const noComponentMessage = this.panel.querySelector('#no-component-message');
        const propertyGroups = this.panel.querySelector('#property-groups-container');
        if (noComponentMessage) noComponentMessage.style.display = 'none';
        if (propertyGroups) propertyGroups.style.display = 'block';
    }

    /**
     * Hides the property groups and shows the "no component selected" message.
     */
    hidePanelUI() {
        const noComponentMessage = this.panel.querySelector('#no-component-message');
        const propertyGroups = this.panel.querySelector('#property-groups-container');
        if (noComponentMessage) noComponentMessage.style.display = 'flex';
        if (propertyGroups) propertyGroups.style.display = 'none';
    }

    /**
     * Clears the panel by hiding the property groups.
     */
    clearPanel() {
        this.hidePanelUI();
    }
}

export default PropertyPanelUpdater; 