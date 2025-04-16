class BlocksRenderer {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  renderCanvas(blocks) {
    // In a real implementation, we would render the blocks
    // For now, return a placeholder canvas
    if (!blocks || blocks.length === 0) {
      return this.renderEmptyCanvas();
    }
    
    return `
      <div class="blocks-canvas">
        ${blocks.map(block => this.renderBlock(block)).join('')}
      </div>
    `;
  }
  
  renderEmptyCanvas() {
    return `
      <div class="blocks-canvas empty">
        <div class="blocks-empty-message">
          <i class="material-icons">widgets</i>
          <p>Drag blocks from the right panel to start coding!</p>
          <p class="blocks-empty-submessage">When your app starts, any blocks here will run.</p>
        </div>
      </div>
    `;
  }
  
  renderBlock(block) {
    // In a real implementation, we would use the block type to determine how to render it
    // For now, use placeholder rendering
    
    const category = this.blocksManager.blockCategories.categories.find(c => c.id === block.category);
    const color = category ? category.color : '#888';
    
    return `
      <div class="block" 
           data-block-id="${block.id}" 
           data-block-type="${block.type}"
           style="position: absolute; left: ${block.x || 50}px; top: ${block.y || 50}px;">
        <div class="block-content" style="background-color: ${color}">
          <div class="block-header">
            <span class="block-title">${block.name || 'Block'}</span>
          </div>
          <div class="block-inputs">
            ${this.renderBlockInputs(block)}
          </div>
        </div>
      </div>
    `;
  }
  
  renderBlockInputs(block) {
    // Simplified input rendering for placeholder
    const inputs = Array.isArray(block.inputs) ? block.inputs : [];
    if (inputs.length === 0) {
      return '';
    }
    return inputs.map(input => {
      if (input.type === 'text') {
        return `<span class="block-input-text">${input.value || input.placeholder || 'text'}</span>`;
      } else if (input.type === 'number') {
        return `<span class="block-input-number">${input.value || input.default || 0}</span>`;
      } else if (input.type === 'boolean') {
        return `<span class="block-input-boolean">${input.value ? 'true' : 'false'}</span>`;
      } else if (input.type === 'dropdown') {
        return `<span class="block-input-dropdown">${input.value || input.options[0] || 'option'}</span>`;
      }
      return '';
    }).join(' ');
  }
  
  setZoom(zoom) {
    this.zoom = Math.max(0.5, Math.min(2, zoom));
    this.applyTransform();
  }
  
  zoomIn() {
    this.setZoom(this.zoom + 0.1);
  }
  
  zoomOut() {
    this.setZoom(this.zoom - 0.1);
  }
  
  resetZoom() {
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.applyTransform();
  }
  
  moveCanvas(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.applyTransform();
  }
  
  applyTransform() {
    const canvas = document.querySelector('.blocks-canvas');
    if (!canvas) return;
    
    canvas.style.transform = `scale(${this.zoom}) translate(${this.offsetX}px, ${this.offsetY}px)`;
  }
  
  getRelativePosition(clientX, clientY) {
    const workspace = document.getElementById('blocks-workspace');
    if (!workspace) return { x: 0, y: 0 };
    
    const rect = workspace.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.zoom - this.offsetX,
      y: (clientY - rect.top) / this.zoom - this.offsetY
    };
  }
}

export default BlocksRenderer; 