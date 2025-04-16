class BlocksToolbox {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.blockDefinitions = this.getBlockDefinitions();
  }
  
  render() {
    const activeCategory = this.blocksManager.blockCategories.activeCategory;
    return `
      <div class="blocks-toolbox-container">
        <div class="blocks-toolbox-title">
          <span>${this.getCategoryTitle(activeCategory)}</span>
        </div>
        <div class="blocks-toolbox-list" id="blocks-toolbox-list">
          ${this.renderBlocksForCategory(activeCategory)}
        </div>
      </div>
    `;
  }
  
  updateToolboxForCategory(categoryId) {
    const toolboxList = document.getElementById('blocks-toolbox-list');
    const toolboxTitle = document.querySelector('.blocks-toolbox-title span');
    
    if (toolboxList && toolboxTitle) {
      toolboxTitle.textContent = this.getCategoryTitle(categoryId);
      toolboxList.innerHTML = this.renderBlocksForCategory(categoryId);
      this.setupBlockDragging();
    }
  }
  
  getCategoryTitle(categoryId) {
    const category = this.blocksManager.blockCategories.getCategoryById(categoryId);
    return category ? category.name + ' Blocks' : 'Blocks';
  }
  
  renderBlocksForCategory(categoryId) {
    const blocks = this.getBlocksForCategory(categoryId);
    
    if (blocks.length === 0) {
      return '<div class="empty-blocks-message">No blocks available in this category.</div>';
    }
    
    return blocks.map(block => this.renderBlockTemplate(block)).join('');
  }
  
  renderBlockTemplate(block) {
    const category = this.blocksManager.blockCategories.getCategoryById(block.category);
    const color = category ? category.color : '#888';
    
    return `
      <div class="block-template" 
           data-block-type="${block.type}" 
           data-category="${block.category}"
           draggable="true"
           style="--block-color: ${color}">
        <div class="block-header">
          <span class="block-title">${block.name}</span>
        </div>
        <div class="block-content">
          ${this.renderBlockInputs(block)}
        </div>
        <div class="block-description">
          <span>${block.description}</span>
        </div>
      </div>
    `;
  }
  
  renderBlockInputs(block) {
    // For simplicity in this example, just show a basic representation
    if (!block.inputs || block.inputs.length === 0) {
      return '';
    }
    
    return block.inputs.map(input => {
      if (input.type === 'text') {
        return `<span class="block-input-placeholder">"${input.placeholder || 'text'}"</span>`;
      } else if (input.type === 'number') {
        return `<span class="block-input-placeholder">${input.default || '0'}</span>`;
      } else if (input.type === 'boolean') {
        return `<span class="block-input-placeholder">${input.default ? 'true' : 'false'}</span>`;
      } else if (input.type === 'dropdown') {
        return `<span class="block-input-placeholder">[${input.options[0] || 'option'}]</span>`;
      }
      return '';
    }).join(' ');
  }
  
  setupEventListeners() {
    this.setupBlockDragging();
  }
  
  setupBlockDragging() {
    const blockTemplates = document.querySelectorAll('.block-template');
    
    blockTemplates.forEach(blockTemplate => {
      blockTemplate.addEventListener('dragstart', (e) => {
        const blockType = blockTemplate.dataset.blockType;
        const category = blockTemplate.dataset.category;
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
          type: blockType,
          category: category
        }));
      });
    });
    
    // Set up workspace as drop target
    const workspace = document.getElementById('blocks-workspace');
    if (workspace) {
      workspace.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
      });
      
      workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        try {
          const blockData = JSON.parse(data);
          this.addBlockToWorkspace(blockData, e.clientX, e.clientY);
        } catch (error) {
          console.error('Error adding block:', error);
        }
      });
    }
  }
  
  addBlockToWorkspace(blockData, x, y) {
    // Get block definition
    const block = this.blockDefinitions.find(b => 
      b.type === blockData.type && b.category === blockData.category);
    
    if (!block) return;
    
    // Get workspace and its position
    const workspace = document.getElementById('blocks-workspace');
    if (!workspace) return;
    
    const workspaceRect = workspace.getBoundingClientRect();
    
    // Create a new block element
    const blockElement = document.createElement('div');
    blockElement.className = 'block';
    blockElement.dataset.blockType = block.type;
    blockElement.dataset.category = block.category;
    
    // Position the block at drop position
    blockElement.style.left = `${x - workspaceRect.left}px`;
    blockElement.style.top = `${y - workspaceRect.top}px`;
    
    // Get category color
    const category = this.blocksManager.blockCategories.getCategoryById(block.category);
    const color = category ? category.color : '#888';
    
    // Set block content
    blockElement.innerHTML = `
      <div class="block-content" style="background-color: ${color}">
        <div class="block-header">
          <span class="block-title">${block.name}</span>
        </div>
        <div class="block-inputs">
          ${this.renderBlockInputs(block)}
        </div>
      </div>
    `;
    
    // Add the block to the workspace
    workspace.appendChild(blockElement);
    
    // Setup block dragging/interaction
    this.setupBlockInteraction(blockElement);
  }
  
  setupBlockInteraction(blockElement) {
    let isDragging = false;
    let startX, startY;
    let offsetX, offsetY;
    
    blockElement.addEventListener('mousedown', (e) => {
      // Only handle left clicks directly on the block (not on inputs)
      if (e.button !== 0 || e.target.classList.contains('block-input')) return;
      
      isDragging = true;
      blockElement.classList.add('dragging');
      
      // Store initial positions
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = blockElement.getBoundingClientRect();
      offsetX = startX - rect.left;
      offsetY = startY - rect.top;
      
      // Prevent default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const workspace = document.getElementById('blocks-workspace');
      const workspaceRect = workspace.getBoundingClientRect();
      
      // Calculate new position
      const newLeft = e.clientX - workspaceRect.left - offsetX;
      const newTop = e.clientY - workspaceRect.top - offsetY;
      
      // Update position
      blockElement.style.left = `${newLeft}px`;
      blockElement.style.top = `${newTop}px`;
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      
      isDragging = false;
      blockElement.classList.remove('dragging');
    });
    
    // Select block on click
    blockElement.addEventListener('click', (e) => {
      // Remove selection from other blocks
      document.querySelectorAll('.block.selected').forEach(block => {
        if (block !== blockElement) {
          block.classList.remove('selected');
        }
      });
      
      // Toggle selection for this block
      blockElement.classList.toggle('selected');
      
      e.stopPropagation();
    });
  }
  
  getBlocksForCategory(categoryId) {
    return this.blockDefinitions.filter(block => block.category === categoryId);
  }
  
  getBlockDefinitions() {
    // This would be a much larger collection in a real implementation
    return [
      // Events category
      {
        type: 'event_app_start',
        category: 'events',
        name: 'When App Starts',
        description: 'Triggered when the app is opened',
        inputs: []
      },
      {
        type: 'event_screen_create',
        category: 'events',
        name: 'When Screen Created',
        description: 'Triggered when the screen is created',
        inputs: []
      },
      {
        type: 'event_button_click',
        category: 'events',
        name: 'When Button Clicked',
        description: 'Triggered when a button is clicked',
        inputs: [
          { type: 'dropdown', name: 'component', options: ['Button1', 'Button2'] }
        ]
      },
      
      // Control category
      {
        type: 'control_if',
        category: 'control',
        name: 'If',
        description: 'Do something if a condition is true',
        inputs: [
          { type: 'boolean', name: 'condition', default: true }
        ]
      },
      {
        type: 'control_if_else',
        category: 'control',
        name: 'If-Else',
        description: 'Do something if a condition is true, otherwise do something else',
        inputs: [
          { type: 'boolean', name: 'condition', default: true }
        ]
      },
      {
        type: 'control_repeat',
        category: 'control',
        name: 'Repeat',
        description: 'Repeat a set of actions',
        inputs: [
          { type: 'number', name: 'times', default: 10 }
        ]
      },
      
      // Logic category
      {
        type: 'logic_compare',
        category: 'logic',
        name: 'Compare',
        description: 'Compare two values',
        inputs: [
          { type: 'text', name: 'a', placeholder: 'a' },
          { type: 'dropdown', name: 'operator', options: ['=', '≠', '>', '<', '≥', '≤'] },
          { type: 'text', name: 'b', placeholder: 'b' }
        ]
      },
      {
        type: 'logic_and',
        category: 'logic',
        name: 'And',
        description: 'Returns true if both inputs are true',
        inputs: [
          { type: 'boolean', name: 'a', default: true },
          { type: 'boolean', name: 'b', default: true }
        ]
      },
      {
        type: 'logic_or',
        category: 'logic',
        name: 'Or',
        description: 'Returns true if either input is true',
        inputs: [
          { type: 'boolean', name: 'a', default: true },
          { type: 'boolean', name: 'b', default: false }
        ]
      },
      
      // Math category
      {
        type: 'math_arithmetic',
        category: 'math',
        name: 'Arithmetic',
        description: 'Perform arithmetic operations',
        inputs: [
          { type: 'number', name: 'a', default: 1 },
          { type: 'dropdown', name: 'operator', options: ['+', '-', '×', '÷'] },
          { type: 'number', name: 'b', default: 1 }
        ]
      },
      {
        type: 'math_random',
        category: 'math',
        name: 'Random Number',
        description: 'Generate a random number in a range',
        inputs: [
          { type: 'number', name: 'min', default: 1 },
          { type: 'number', name: 'max', default: 100 }
        ]
      },
      
      // Text category
      {
        type: 'text_join',
        category: 'text',
        name: 'Join Text',
        description: 'Create text by joining items together',
        inputs: [
          { type: 'text', name: 'text1', placeholder: 'text' },
          { type: 'text', name: 'text2', placeholder: 'text' }
        ]
      },
      {
        type: 'text_length',
        category: 'text',
        name: 'Text Length',
        description: 'Returns the length of a text string',
        inputs: [
          { type: 'text', name: 'text', placeholder: 'text' }
        ]
      },
      
      // Components category
      {
        type: 'component_set_text',
        category: 'components',
        name: 'Set Text',
        description: 'Set the text of a component',
        inputs: [
          { type: 'dropdown', name: 'component', options: ['TextView1', 'Button1'] },
          { type: 'text', name: 'text', placeholder: 'text' }
        ]
      },
      {
        type: 'component_get_text',
        category: 'components',
        name: 'Get Text',
        description: 'Get the text of a component',
        inputs: [
          { type: 'dropdown', name: 'component', options: ['TextView1', 'EditText1'] }
        ]
      },
      // Go to Activity block
      {
        type: 'component_go_to_activity',
        category: 'components',
        name: 'Go to Activity',
        description: 'Navigate to another screen/activity',
        inputs: [
          { type: 'dropdown', name: 'activity', options: (window.editorView && window.editorView.currentApp && window.editorView.currentApp.screens) ? window.editorView.currentApp.screens.map(s => s.name) : ['Screen2', 'Screen3'] }
        ]
      },
      // Show Toast block
      {
        type: 'component_show_toast',
        category: 'components',
        name: 'Show Toast',
        description: 'Show a toast message',
        inputs: [
          { type: 'text', name: 'message', placeholder: 'Enter message' }
        ]
      }
    ];
  }
}

export default BlocksToolbox; 