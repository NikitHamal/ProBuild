class BlockFactory {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.blockCounter = 0;
  }
  
  createBlock(blockType) {
    // Generate a unique ID for the block
    const blockId = `block_${Date.now()}_${this.blockCounter++}`;
    
    // Get block definition based on type
    const blockDef = this.getBlockDefinition(blockType);
    if (!blockDef) return null;
    
    // Create block element
    const block = document.createElement('div');
    block.className = 'block';
    block.dataset.blockId = blockId;
    block.dataset.blockType = blockType;
    block.dataset.blockCategory = blockDef.category;
    block.style.backgroundColor = blockDef.color || '#757575';
    block.style.position = 'absolute';
    
    // Create block content
    let blockContent = `
      <div class="block-header">
        <span class="block-name">${blockDef.name}</span>
        <div class="block-controls">
          <button class="block-duplicate-btn" title="Duplicate">
            <i class="material-icons">content_copy</i>
          </button>
          <button class="block-delete-btn" title="Delete">
            <i class="material-icons">delete</i>
          </button>
        </div>
      </div>
      <div class="block-body">
    `;
    
    // Add inputs if any
    if (blockDef.inputs && blockDef.inputs.length > 0) {
      blockDef.inputs.forEach(input => {
        if (input.type === 'text') {
          blockContent += `
            <div class="block-input-container">
              <label>${input.label}:</label>
              <input type="text" class="block-input" data-input-name="${input.name}" value="${input.default || ''}">
            </div>
          `;
        } else if (input.type === 'number') {
          blockContent += `
            <div class="block-input-container">
              <label>${input.label}:</label>
              <input type="number" class="block-input" data-input-name="${input.name}" value="${input.default || 0}">
            </div>
          `;
        } else if (input.type === 'select') {
          blockContent += `
            <div class="block-input-container">
              <label>${input.label}:</label>
              <select class="block-input" data-input-name="${input.name}">
                ${input.options.map(opt => `<option value="${opt.value}" ${opt.value === input.default ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          `;
        }
      });
    }
    
    // Add connection points if any
    if (blockDef.connections && blockDef.connections.length > 0) {
      blockDef.connections.forEach(conn => {
        blockContent += `
          <div class="block-connection ${conn.type}" data-slot="${conn.slot}" data-type="${conn.type}" data-category="${blockDef.category}" data-connected-to="">
            <div class="connection-point"></div>
            <span>${conn.label}</span>
          </div>
        `;
      });
    }
    
    blockContent += '</div>'; // Close block-body
    
    block.innerHTML = blockContent;
    
    return block;
  }
  
  getBlockDefinition(blockType) {
    // This is where block definitions would be defined or loaded
    // For now, we'll return some sample definitions
    
    const blockDefinitions = {
      // Event blocks
      'onCreateView': {
        name: 'When Screen Opens',
        category: 'events',
        color: '#FFA000',
        connections: [
          { slot: 'next', type: 'output', label: 'Do' }
        ]
      },
      'onButtonClick': {
        name: 'When Button Clicked',
        category: 'events',
        color: '#FFA000',
        inputs: [
          { name: 'buttonId', label: 'Button', type: 'select', options: this.getComponentOptions('button'), default: '' }
        ],
        connections: [
          { slot: 'next', type: 'output', label: 'Do' }
        ]
      },
      
      // Control blocks
      'if': {
        name: 'If',
        category: 'control',
        color: '#FF8F00',
        inputs: [
          { name: 'condition', label: 'Condition', type: 'text', default: '' }
        ],
        connections: [
          { slot: 'then', type: 'output', label: 'Then' },
          { slot: 'else', type: 'output', label: 'Else' },
          { slot: 'next', type: 'output', label: 'Next' }
        ]
      },
      'loop': {
        name: 'Repeat',
        category: 'control',
        color: '#FF8F00',
        inputs: [
          { name: 'times', label: 'Times', type: 'number', default: 10 }
        ],
        connections: [
          { slot: 'do', type: 'output', label: 'Do' },
          { slot: 'next', type: 'output', label: 'Next' }
        ]
      },
      
      // Component blocks
      'setText': {
        name: 'Set Text',
        category: 'components',
        color: '#607D8B',
        inputs: [
          { name: 'viewId', label: 'View', type: 'select', options: this.getComponentOptions('textview'), default: '' },
          { name: 'text', label: 'Text', type: 'text', default: '' }
        ],
        connections: [
          { slot: 'next', type: 'output', label: 'Next' }
        ]
      },
      'setVisibility': {
        name: 'Set Visibility',
        category: 'components',
        color: '#607D8B',
        inputs: [
          { name: 'viewId', label: 'View', type: 'select', options: this.getComponentOptions(), default: '' },
          { name: 'visibility', label: 'Visibility', type: 'select', options: [
            { value: 'visible', label: 'Visible' },
            { value: 'invisible', label: 'Invisible' },
            { value: 'gone', label: 'Gone' }
          ], default: 'visible' }
        ],
        connections: [
          { slot: 'next', type: 'output', label: 'Next' }
        ]
      },
      'goToActivity': {
        name: 'Go to Activity',
        category: 'components',
        color: '#607D8B',
        inputs: [
          { name: 'screenId', label: 'Screen', type: 'select', options: this.getScreenOptions(), default: '' }
        ],
        connections: [
          { slot: 'next', type: 'output', label: 'Next' }
        ]
      },
      'showToast': {
        name: 'Show Toast',
        category: 'components',
        color: '#607D8B',
        inputs: [
          { name: 'message', label: 'Message', type: 'text', default: 'Toast message' },
          { name: 'length', label: 'Duration', type: 'select', options: [
            { value: 'short', label: 'Short' },
            { value: 'long', label: 'Long' }
          ], default: 'short' }
        ],
        connections: [
          { slot: 'next', type: 'output', label: 'Next' }
        ]
      }
    };
    
    return blockDefinitions[blockType] || null;
  }
  
  getComponentOptions(filterType = null) {
    // Get available components from current screen
    const components = this.blocksManager.currentScreen?.components || [];
    
    const options = [];
    
    // Add option for no selection
    options.push({ value: '', label: 'Select a component' });
    
    // Filter components by type if needed
    const filteredComponents = filterType 
      ? components.filter(c => c.type === filterType || c.type.includes(filterType)) 
      : components;
    
    // Add options for each component
    filteredComponents.forEach(component => {
      options.push({
        value: component.id,
        label: `${component.id} (${component.type})`
      });
    });
    
    return options;
  }
  
  getScreenOptions() {
    // Get available screens from the current app
    const screens = this.blocksManager.editorView?.currentApp?.screens || [];
    
    const options = [];
    
    // Add option for no selection
    options.push({ value: '', label: 'Select a screen' });
    
    // Add options for each screen
    screens.forEach(screen => {
      options.push({
        value: screen.id,
        label: screen.name
      });
    });
    
    return options;
  }
  
  duplicateBlock(block) {
    if (!block) return null;
    
    // Get block type and create a new one
    const blockType = block.dataset.blockType;
    const newBlock = this.createBlock(blockType);
    
    if (!newBlock) return null;
    
    // Copy input values if any
    block.querySelectorAll('.block-input').forEach(input => {
      const inputName = input.dataset.inputName;
      const newInput = newBlock.querySelector(`.block-input[data-input-name="${inputName}"]`);
      
      if (newInput) {
        // Handle different input types correctly
        if (input.tagName === 'SELECT') {
          newInput.value = input.value;
          // Trigger change event to ensure any event handlers run
          const event = new Event('change');
          newInput.dispatchEvent(event);
        } else if (input.type === 'checkbox') {
          newInput.checked = input.checked;
        } else {
          newInput.value = input.value;
        }
      }
    });
    
    // Position slightly offset from original
    const rect = block.getBoundingClientRect();
    const workspaceRect = this.blocksManager.blocksWorkspace.getBoundingClientRect();
    
    // Calculate new position, accounting for workspace scroll position
    const scrollLeft = this.blocksManager.blocksWorkspace.scrollLeft;
    const scrollTop = this.blocksManager.blocksWorkspace.scrollTop;
    
    // Calculate position relative to workspace, accounting for scroll
    let newLeft = rect.left - workspaceRect.left + 20 + scrollLeft;
    let newTop = rect.top - workspaceRect.top + 20 + scrollTop;
    
    // Ensure the block stays within visible workspace
    newLeft = Math.max(0, newLeft);
    newTop = Math.max(0, newTop);
    
    newBlock.style.left = `${newLeft}px`;
    newBlock.style.top = `${newTop}px`;
    
    return newBlock;
  }
}

export default BlockFactory; 