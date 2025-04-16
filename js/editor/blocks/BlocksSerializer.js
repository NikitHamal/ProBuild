class BlocksSerializer {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
  }
  
  serializeBlocks() {
    if (!this.blocksManager.blocksWorkspace) return [];
    
    const blocks = [];
    
    document.querySelectorAll('.blocks-workspace .block').forEach(blockElement => {
      const blockId = blockElement.dataset.blockId;
      const blockType = blockElement.dataset.blockType;
      const blockCategory = blockElement.dataset.blockCategory;
      
      const rect = blockElement.getBoundingClientRect();
      const workspaceRect = this.blocksManager.blocksWorkspace.getBoundingClientRect();
      
      const x = rect.left - workspaceRect.left;
      const y = rect.top - workspaceRect.top;
      
      // Extract values from inputs
      const inputs = {};
      blockElement.querySelectorAll('.block-input').forEach(input => {
        const inputName = input.dataset.inputName;
        const inputValue = input.value;
        inputs[inputName] = inputValue;
      });
      
      // Extract connections
      const connections = [];
      blockElement.querySelectorAll('.block-connection').forEach(conn => {
        const connectedTo = conn.dataset.connectedTo;
        if (connectedTo) {
          connections.push({
            from: blockId,
            to: connectedTo,
            slot: conn.dataset.slot
          });
        }
      });
      
      blocks.push({
        id: blockId,
        type: blockType,
        category: blockCategory,
        x,
        y,
        inputs,
        connections
      });
    });
    
    return blocks;
  }
  
  deserializeBlocks(blocks) {
    if (!this.blocksManager.blocksWorkspace || !blocks) return;
    
    // Clear existing blocks
    this.blocksManager.blocksWorkspace.innerHTML = '';
    
    // Add blocks to workspace
    blocks.forEach(block => {
      const blockElement = this.blocksManager.blockFactory.createBlock(block.type, block.id);
      
      if (blockElement) {
        // Position the block
        blockElement.style.left = `${block.x}px`;
        blockElement.style.top = `${block.y}px`;
        
        // Set category
        blockElement.dataset.blockCategory = block.category;
        
        // Set input values
        if (block.inputs) {
          Object.entries(block.inputs).forEach(([name, value]) => {
            const input = blockElement.querySelector(`.block-input[data-input-name="${name}"]`);
            if (input) input.value = value;
          });
        }
        
        // Add to workspace
        this.blocksManager.blocksWorkspace.appendChild(blockElement);
      }
    });
    
    // Connect blocks after all are added to DOM
    blocks.forEach(block => {
      if (block.connections) {
        block.connections.forEach(conn => {
          const fromBlock = document.querySelector(`.block[data-block-id="${conn.from}"]`);
          const toBlock = document.querySelector(`.block[data-block-id="${conn.to}"]`);
          
          if (fromBlock && toBlock) {
            const connection = fromBlock.querySelector(`.block-connection[data-slot="${conn.slot}"]`);
            
            if (connection) {
              connection.dataset.connectedTo = conn.to;
              connection.classList.add('connected');
            }
          }
        });
      }
    });
    
    // Initialize workspace interactions
    this.blocksManager.workspaceManager.initializeWorkspace();
  }
  
  getScreenBlocks(screenId) {
    // Always return an empty array to have a clean workspace with no default blocks
    return [];
  }
  
  saveBlocks() {
    // Serialize blocks from workspace
    const blocks = this.serializeBlocks();
    
    // Save to app storage
    if (!this.blocksManager.currentApp.screenBlocks) {
      this.blocksManager.currentApp.screenBlocks = {};
    }
    
    this.blocksManager.currentApp.screenBlocks[this.blocksManager.currentScreen.id] = blocks;
    this.blocksManager.editorView.appService.updateApp(this.blocksManager.currentApp);
    
    return blocks;
  }
}

export default BlocksSerializer; 