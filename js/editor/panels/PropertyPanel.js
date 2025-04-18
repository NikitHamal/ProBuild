import { UpdatePropertyCommand } from '../commands/ComponentCommands.js';

class PropertyPanel {
  constructor(editorView) {
    this.editorView = editorView;
    this.googleFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Roboto Condensed', 
      'Source Sans Pro', 'Oswald', 'Raleway', 'Ubuntu', 'Merriweather',
      'Poppins', 'Playfair Display', 'Nunito', 'PT Sans', 'Rubik', 
      'Noto Sans', 'Roboto Mono', 'Fira Sans', 'Work Sans', 'Quicksand'
    ];
  }
  
  renderPropertyPanel() {
    // Now returns an empty div since we'll populate it in the sidebar
    return `<div id="property-panel-container"></div>`;
  }

  renderSidebarPropertyPanel() {
    // Create font options HTML
    const fontOptionsHtml = this.googleFonts.map(font => 
      `<option value="${font}">${font}</option>`
    ).join('');

    return `
      <div class="property-panel" id="property-panel">
        <div class="no-component-selected" id="no-component-message">
          <i class="material-icons">touch_app</i>
          <p>Select a component to view and edit its properties</p>
        </div>
        <div id="property-groups-container" style="display: none;">
          <!-- Position Group -->
          <div class="property-group">
            <div class="property-group-header">
              <div class="property-group-title">Position</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row">
                <div class="property-label">X</div>
                <div class="property-input"><input type="number" id="prop-x" placeholder="X"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Y</div>
                <div class="property-input"><input type="number" id="prop-y" placeholder="Y"></div>
              </div>
            </div>
          </div>

          <!-- Layout Group -->
          <div class="property-group">
            <div class="property-group-header">
              <div class="property-group-title">Layout</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row">
                <div class="property-label">Width</div>
                <div class="property-input">
                  <select id="prop-width">
                    <option value="wrap_content">Wrap</option>
                    <option value="match_parent">Match</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div class="property-row">
                <div class="property-label">Height</div>
                <div class="property-input">
                  <select id="prop-height">
                    <option value="wrap_content">Wrap</option>
                    <option value="match_parent">Match</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div class="property-row">
                <div class="property-label">Margin</div>
                <div class="property-input"><input type="text" id="prop-margin" placeholder="e.g. 8px"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Padding</div>
                <div class="property-input"><input type="text" id="prop-padding" placeholder="e.g. 8px"></div>
              </div>
            </div>
          </div>

          <!-- Appearance Group -->
          <div class="property-group">
            <div class="property-group-header">
              <div class="property-group-title">Appearance</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row">
                <div class="property-label">Background</div>
                <div class="property-input"><input type="color" id="prop-bgcolor"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Opacity</div>
                <div class="property-input"><input type="number" id="prop-opacity" min="0" max="100" value="100"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Corner Radius</div>
                <div class="property-input"><input type="text" id="prop-borderradius" placeholder="e.g. 4px"></div>
              </div>
            </div>
          </div>

          <!-- Text Group -->
          <div class="property-group" id="text-group">
            <div class="property-group-header">
              <div class="property-group-title">Text</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row" data-prop="text">
                <div class="property-label">Content</div>
                <div class="property-input"><input type="text" id="prop-text" placeholder="Text"></div>
              </div>
              <div class="property-row" data-prop="textSize">
                <div class="property-label">Size</div>
                <div class="property-input"><input type="number" id="prop-textsize"></div>
              </div>
              <div class="property-row" data-prop="textColor">
                <div class="property-label">Color</div>
                <div class="property-input"><input type="color" id="prop-textcolor"></div>
              </div>
              <div class="property-row" data-prop="font">
                <div class="property-label">Font</div>
                <div class="property-input">
                  <select id="prop-font">
                    <option value="">Default</option>
                    ${fontOptionsHtml}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Effects Group -->
          <div class="property-group">
            <div class="property-group-header">
              <div class="property-group-title">Effects</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row">
                <div class="property-label">Border Color</div>
                <div class="property-input"><input type="color" id="prop-bordercolor"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Shadow</div>
                <div class="property-input"><input type="text" id="prop-boxshadow" placeholder="e.g. 2px 2px 5px #888"></div>
              </div>
            </div>
          </div>

          <!-- Component Specific Group -->
          <div class="property-group" id="component-specific-group">
            <div class="property-group-header">
              <div class="property-group-title">Component Options</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row" data-prop="hint" style="display:none;">
                <div class="property-label">Hint</div>
                <div class="property-input"><input type="text" id="prop-hint" placeholder="Hint"></div>
              </div>
              <div class="property-row" data-prop="hintColor" style="display:none;">
                <div class="property-label">Hint Color</div>
                <div class="property-input"><input type="color" id="prop-hintcolor"></div>
              </div>
              <div class="property-row" data-prop="src" style="display:none;">
                <div class="property-label">Image Source</div>
                <div class="property-input"><input type="text" id="prop-src" placeholder="Image URL"></div>
              </div>
              <div class="property-row" data-prop="scaleType" style="display:none;">
                <div class="property-label">Scale Type</div>
                <div class="property-input">
                  <select id="prop-scaleType">
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                    <option value="fitCenter">Fit Center</option>
                  </select>
                </div>
              </div>
              <div class="property-row" data-prop="checked" style="display:none;">
                <div class="property-label">Checked</div>
                <div class="property-input"><input type="checkbox" id="prop-checked"></div>
              </div>
              <div class="property-row" data-prop="progress" style="display:none;">
                <div class="property-label">Progress</div>
                <div class="property-input"><input type="number" id="prop-progress" min="0" max="100"></div>
              </div>
              <div class="property-row" data-prop="max" style="display:none;">
                <div class="property-label">Max</div>
                <div class="property-input"><input type="number" id="prop-max"></div>
              </div>
              <div class="property-row" data-prop="items" style="display:none;">
                <div class="property-label">Items</div>
                <div class="property-input"><input type="text" id="prop-items" placeholder="Comma-separated"></div>
              </div>
              <div class="property-row" data-prop="orientation" style="display:none;">
                <div class="property-label">Orientation</div>
                <div class="property-input">
                  <select id="prop-orientation">
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
              </div>
              <div class="property-row" data-prop="url" style="display:none;">
                <div class="property-label">URL</div>
                <div class="property-input"><input type="text" id="prop-url" placeholder="https://..."></div>
              </div>
            </div>
          </div>
          
          <!-- Identity Group -->
        <div class="property-group">
            <div class="property-group-header">
              <div class="property-group-title">Identity</div>
              <i class="material-icons property-group-toggle">expand_more</i>
            </div>
            <div class="property-rows">
              <div class="property-row">
                <div class="property-label">ID</div>
                <div class="property-input"><input type="text" id="prop-id" placeholder="Component ID"></div>
              </div>
              <div class="property-row">
                <div class="property-label">Type</div>
                <div class="property-input"><input type="text" id="prop-type" placeholder="Component Type" readonly></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupPropertyGroupToggles() {
    document.querySelectorAll('.property-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.property-group');
        group.classList.toggle('collapsed');
      });
    });
  }

  showPropertyPanel() {
    // For the new design, we don't need to show/hide the entire panel,
    // just update its content based on component selection
    this.editorView.propertyPanelVisible = true;
    
    // Show the property content, hide the empty message
    const noComponentMessage = document.getElementById('no-component-message');
    const propertyGroups = document.getElementById('property-groups-container');
    
    if (noComponentMessage && propertyGroups) {
      noComponentMessage.style.display = 'none';
      propertyGroups.style.display = 'block';
    }

    // Populate values
    this.updatePropertyEditor(); 

    // Setup events now that the panel is visible and populated
    this.setupPropertyEditorEvents();
    this.setupPropertyGroupToggles();
    
    // Load Google Fonts dynamically
    this.loadGoogleFonts();
  }

  hidePropertyPanel() {
    this.editorView.propertyPanelVisible = false;
    
    // Show the empty message, hide property content
    const noComponentMessage = document.getElementById('no-component-message');
    const propertyGroups = document.getElementById('property-groups-container');
    
    if (noComponentMessage && propertyGroups) {
      noComponentMessage.style.display = 'flex';
      propertyGroups.style.display = 'none';
    }
    
    if (this.editorView.selectedComponent) { 
      const prevSelected = document.querySelector(`.preview-component[data-component-id="${this.editorView.selectedComponent.id}"]`);
      if (prevSelected) prevSelected.classList.remove('selected');
      this.editorView.selectedComponent = null;
    }
  }

  loadGoogleFonts() {
    // Create link for Google Fonts if not already created
    if (!document.getElementById('google-fonts-link')) {
      const fontFamilies = this.googleFonts.join('|').replace(/ /g, '+');
      const link = document.createElement('link');
      link.id = 'google-fonts-link';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
      document.head.appendChild(link);
    }
  }

  updatePropertyEditor() {
    if (!this.editorView.selectedComponent) return;
    const props = this.editorView.selectedComponent.properties;
    const type = this.editorView.selectedComponent.type;
    const panel = document.getElementById('property-panel');
    if (!panel) return;

    // Helper to set value if element exists
    const setValue = (id, value) => {
      const el = panel.querySelector(`#${id}`);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = !!value;
        } else if (el.type === 'color') {
          if (value === 'transparent' || !value) {
            el.value = '#FFFFFF'; // Use white as fallback for transparent
          } else if (value.startsWith('#')) {
            el.value = value;
          } else {
            // Convert named colors or rgba to hex
            try {
              const tempDiv = document.createElement('div');
              tempDiv.style.color = value;
              document.body.appendChild(tempDiv);
              const rgbColor = window.getComputedStyle(tempDiv).color;
              document.body.removeChild(tempDiv);
              
              // Convert rgb(r,g,b) to hex
              const rgbMatch = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
              if (rgbMatch) {
                const hex = '#' + 
                  ('0' + parseInt(rgbMatch[1], 10).toString(16)).slice(-2) +
                  ('0' + parseInt(rgbMatch[2], 10).toString(16)).slice(-2) +
                  ('0' + parseInt(rgbMatch[3], 10).toString(16)).slice(-2);
                el.value = hex;
              } else {
                el.value = '#FFFFFF'; // Default fallback
              }
            } catch (e) {
              el.value = '#FFFFFF'; // Error fallback
            }
          }
        } else {
          el.value = value !== null && value !== undefined ? value : '';
        }
      }
    };
    
    // Helper to show/hide row
    const showRow = (propName, show) => {
      const row = panel.querySelector(`.property-row[data-prop="${propName}"]`);
      if (row) row.style.display = show ? 'flex' : 'none';
    };

    // Set common properties
    setValue('prop-id', this.editorView.selectedComponent.id);
    setValue('prop-type', type); // Added to show component type
    setValue('prop-x', props.x);
    setValue('prop-y', props.y);
    setValue('prop-width', props.width || 'wrap_content');
    setValue('prop-height', props.height || 'wrap_content');
    setValue('prop-margin', props.margin);
    setValue('prop-padding', props.padding);
    setValue('prop-bgcolor', props.bgColor || '#FFFFFF');
    setValue('prop-opacity', props.opacity || 100);
    setValue('prop-font', props.font);
    setValue('prop-borderradius', props.borderRadius || '0px');
    setValue('prop-bordercolor', props.borderColor || '#000000');
    setValue('prop-boxshadow', props.boxShadow || 'none');
    
    // Show/hide text group based on component type
    const hasText = ['textview', 'button', 'edittext', 'checkbox', 'radiobutton', 'switch'].includes(type);
    const textGroup = panel.querySelector('#text-group');
    if (textGroup) {
      textGroup.style.display = hasText ? 'block' : 'none';
    }
    
    // Show/Hide and set component-specific properties
    showRow('text', hasText);
    if (hasText) setValue('prop-text', props.text);

    const hasTextOptions = hasText || type === 'edittext'; // EditText needs size/color even without text (for hint)
    showRow('textSize', hasTextOptions);
    if (hasTextOptions) setValue('prop-textsize', props.textSize || 14);
    showRow('textColor', hasTextOptions);
    if (hasTextOptions) setValue('prop-textcolor', props.textColor || '#000000');

    const isEditText = type === 'edittext';
    showRow('hint', isEditText);
    if (isEditText) setValue('prop-hint', props.hint);
    showRow('hintColor', isEditText);
    if (isEditText) setValue('prop-hintcolor', props.hintColor || '#A0A0A0');

    const isImageView = type === 'imageview';
    showRow('src', isImageView);
    if (isImageView) setValue('prop-src', props.src);
    showRow('scaleType', isImageView);
    if (isImageView) setValue('prop-scaleType', props.scaleType || 'fitCenter');

    const isCheckable = ['checkbox', 'radiobutton', 'switch'].includes(type);
    showRow('checked', isCheckable);
    if (isCheckable) setValue('prop-checked', props.checked);

    const hasProgress = ['progressbar', 'seekbar'].includes(type);
    showRow('progress', hasProgress);
    if (hasProgress) setValue('prop-progress', props.progress);
    showRow('max', hasProgress);
    if (hasProgress) setValue('prop-max', props.max || 100);

    const hasItems = ['spinner', 'listview'].includes(type);
    showRow('items', hasItems);
    if (hasItems) setValue('prop-items', Array.isArray(props.items) ? props.items.join(', ') : props.items); // Handle array or string

    const isLayout = type.startsWith('linearlayout') || type.startsWith('scrollview');
    showRow('orientation', isLayout);
    if (isLayout) setValue('prop-orientation', props.orientation);

    const isWebView = type === 'webview';
    showRow('url', isWebView);
    if (isWebView) setValue('prop-url', props.url);
    
    // Show/hide component-specific group if it has any visible rows
    const hasSpecificProps = panel.querySelectorAll('#component-specific-group .property-row[style="display:flex;"]').length > 0;
    const specificGroup = panel.querySelector('#component-specific-group');
    if (specificGroup) {
      specificGroup.style.display = hasSpecificProps ? 'block' : 'none';
    }
  }

  setupPropertyEditorEvents() {
    const c = this.editorView.selectedComponent;
    if (!c) return;
    const panel = document.getElementById('property-panel');
    if (!panel) return;

    // Helper to add listener if element exists and create a command
    const addListener = (id, eventType, propertyName, valueConverter = (val) => val) => {
      const el = panel.querySelector(`#${id}`);
      if (el) {
        // Remove previous listener first if needed (simple overwrite works for onX)
        el[eventType] = (e) => { 
          if (!this.editorView.selectedComponent) return; // Re-check component exists
          
          // Get the old value
          const oldValue = c.properties[propertyName];
          
          // Get the new value using the converter
          let newValue;
          if (el.type === 'checkbox') {
            newValue = valueConverter(el.checked);
          } else if (el.type === 'color') {
            // Special handling for color inputs
            if (oldValue === 'transparent' && el.value === '#FFFFFF') {
              // Keep transparent if it was transparent before
              newValue = 'transparent';
            } else {
              // Otherwise use the new color value
              newValue = valueConverter(el.value);
            }
          } else {
            newValue = valueConverter(el.value);
          }
          
          // Only create a command if the value actually changed
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            // Create an UpdatePropertyCommand
            const command = new UpdatePropertyCommand(
              this.editorView,
              c.id,
              `properties.${propertyName}`, // Specify the exact property path
              newValue
            );
            
            // Execute the command (this will also update the UI)
            this.editorView.executeCommand(command);
          }
        }; 
      }
    };

    // Setup ID change handling - special case since it's not a property
    const idInput = panel.querySelector('#prop-id');
    if (idInput) {
      idInput.onchange = (e) => {
        const oldId = c.id;
        const newId = e.target.value.trim();
        
        // Skip if no change or empty value
        if (newId === oldId || !newId) {
          e.target.value = oldId; // Reset to old value if empty
          return;
        }
        
        // Validate ID format (alphanumeric, underscore)
        if (!/^[a-zA-Z0-9_]+$/.test(newId)) {
          alert('Component ID must contain only letters, numbers, and underscores.');
          e.target.value = oldId;
          return;
        }
        
        // Check if ID is unique in current screen
        const isDuplicate = this.editorView.currentScreen.components.some(comp => 
          comp.id === newId && comp.id !== oldId
        );
        
        if (isDuplicate) {
          alert('Component ID must be unique. This ID is already used by another component.');
          e.target.value = oldId;
          return;
        }
        
        // Update the ID in all relevant places
        this.editorView.appService.updateComponentId(
          this.editorView.currentApp.id,
          this.editorView.currentScreen.id,
          oldId,
          newId
        );
        
        // Update the selected component reference
        c.id = newId;
        
        // Refresh the UI to reflect the ID change
        this.editorView.componentManager.renderComponentsPreview();
        this.editorView.propertyPanel.updatePropertyValues();
        
        // Notify code and blocks managers about the change
        if (this.editorView.codeManager) {
          this.editorView.codeManager.handleComponentIdChange(oldId, newId);
        }
        
        if (this.editorView.blocksManager) {
          this.editorView.blocksManager.handleComponentIdChange(oldId, newId);
        }
      };
    }

    // --- Common Properties ---
    // ID handled separately above
    // Type (read-only)
    addListener('prop-x', 'oninput', 'x', val => parseInt(val) || 0);
    addListener('prop-y', 'oninput', 'y', val => parseInt(val) || 0);
    addListener('prop-width', 'onchange', 'width');
    addListener('prop-height', 'onchange', 'height');
    addListener('prop-margin', 'oninput', 'margin');
    addListener('prop-padding', 'oninput', 'padding');
    addListener('prop-bgcolor', 'oninput', 'bgColor');
    addListener('prop-opacity', 'oninput', 'opacity', val => parseInt(val) || 100);
    addListener('prop-font', 'onchange', 'font');
    addListener('prop-borderradius', 'oninput', 'borderRadius');
    addListener('prop-bordercolor', 'oninput', 'borderColor');
    addListener('prop-boxshadow', 'oninput', 'boxShadow');

    // --- Component Specific --- 
    addListener('prop-text', 'oninput', 'text');
    addListener('prop-textsize', 'oninput', 'textSize', val => parseInt(val) || 14);
    addListener('prop-textcolor', 'oninput', 'textColor');
    addListener('prop-hint', 'oninput', 'hint');
    addListener('prop-hintcolor', 'oninput', 'hintColor');
    addListener('prop-src', 'oninput', 'src');
    addListener('prop-scaleType', 'onchange', 'scaleType');
    addListener('prop-checked', 'onchange', 'checked');
    addListener('prop-progress', 'oninput', 'progress', val => parseInt(val) || 0);
    addListener('prop-max', 'oninput', 'max', val => parseInt(val) || 100);
    addListener('prop-items', 'oninput', 'items');
    addListener('prop-orientation', 'onchange', 'orientation');
    addListener('prop-url', 'oninput', 'url');
  }
  
  // Method to update property values without triggering commands
  // Used when component selection changes or after undo/redo operations
  updatePropertyValues() {
    this.updatePropertyEditor();
  }
}

export default PropertyPanel; 