class BlocksCodeGenerator {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
  }
  
  generatePseudoCode() {
    // Generate pseudo-code from blocks
    let code = '// Generated code from blocks\n\n';
    
    // Find event blocks (starting points)
    const eventBlocks = Array.from(document.querySelectorAll('.blocks-workspace .block[data-block-category="events"]'));
    
    eventBlocks.forEach(eventBlock => {
      const eventType = eventBlock.dataset.blockType;
      code += `// Event: ${eventType}\n`;
      code += `function on${eventType.charAt(0).toUpperCase() + eventType.slice(1)}() {\n`;
      
      // Find connected blocks
      const nextBlock = document.querySelector(`.block-connection[data-connected-to="${eventBlock.dataset.blockId}"]`);
      if (nextBlock) {
        code += this.generateBlockCode(nextBlock.closest('.block'), 1);
      }
      
      code += '}\n\n';
    });
    
    return code;
  }
  
  generateBlockCode(block, indentLevel) {
    if (!block) return '';
    
    const indent = '  '.repeat(indentLevel);
    let code = '';
    
    const blockType = block.dataset.blockType;
    
    // Simple code generation based on block type
    switch (blockType) {
      case 'setText':
        const textValue = block.querySelector('.block-input').value || '""';
        code += `${indent}setText(${textValue});\n`;
        break;
      case 'if':
        const condition = block.querySelector('.block-input').value || 'true';
        code += `${indent}if (${condition}) {\n`;
        
        // Find connected blocks inside if
        const thenBlock = document.querySelector(`.block-connection[data-slot="then"][data-connected-to="${block.dataset.blockId}"]`);
        if (thenBlock) {
          code += this.generateBlockCode(thenBlock.closest('.block'), indentLevel + 1);
        }
        
        code += `${indent}}\n`;
        
        // Check for else
        const elseBlock = document.querySelector(`.block-connection[data-slot="else"][data-connected-to="${block.dataset.blockId}"]`);
        if (elseBlock) {
          code += `${indent}else {\n`;
          code += this.generateBlockCode(elseBlock.closest('.block'), indentLevel + 1);
          code += `${indent}}\n`;
        }
        break;
      default:
        code += `${indent}// Block: ${blockType}\n`;
    }
    
    // Find next block in sequence
    const nextBlock = document.querySelector(`.block-connection[data-slot="next"][data-connected-to="${block.dataset.blockId}"]`);
    if (nextBlock) {
      code += this.generateBlockCode(nextBlock.closest('.block'), indentLevel);
    }
    
    return code;
  }
  
  showGeneratedCode() {
    const pseudoCode = this.generatePseudoCode();
    
    // Display pseudo-code
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <div class="dialog-header">
          <div class="dialog-title">Generated Code</div>
        </div>
        <div class="dialog-content">
          <pre>${pseudoCode}</pre>
        </div>
        <div class="dialog-actions end">
          <button class="dialog-btn primary">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Handle close button
    dialog.querySelector('.dialog-btn').addEventListener('click', () => {
      dialog.remove();
    });
    
    return pseudoCode;
  }
}

export default BlocksCodeGenerator; 