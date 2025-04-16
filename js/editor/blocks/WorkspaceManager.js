class WorkspaceManager {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.draggedBlock = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.activeDragConnection = null;
    this.snapDistance = 15; // Distance in px to snap connections
  }
  
  initializeWorkspace() {
    this.workspace = this.blocksManager.blocksWorkspace;
    if (!this.workspace) return;
    
    // Set up workspace event listeners
    this.workspace.addEventListener('click', (e) => {
      if (e.target === this.workspace) {
        // Clicked on empty workspace - deselect blocks
        this.blocksManager.deselectAllBlocks();
      }
    });
    
    // Handle drop events from the toolbox
    this.workspace.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    this.workspace.addEventListener('drop', (e) => {
      e.preventDefault();
      
      // Check if we're dropping a block from the toolbox
      const blockType = e.dataTransfer.getData('blocktype');
      if (blockType) {
        // Calculate drop position relative to workspace
        const rect = this.workspace.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create and add the block
        const block = this.blocksManager.addBlock(blockType, { x, y });
        
        // Select the new block
        if (block) {
          this.selectBlock(block);
        }
      }
    });
    
    // Set up events for existing blocks
    this.setupExistingBlocks();
  }
  
  setupExistingBlocks() {
    // Add event listeners to all blocks in the workspace
    this.workspace.querySelectorAll('.block').forEach(block => {
      this.setupBlockInteractions(block);
    });
  }
  
  setupBlockInteractions(block) {
    if (!block) return;
    
    // Make block draggable
    block.addEventListener('mousedown', (e) => {
      // Ignore if clicking on inputs or buttons
      if (
        e.target.matches('input, select, button') || 
        e.target.closest('input, select, button')
      ) {
        return;
      }
      
      // Handle connection point dragging
      if (e.target.closest('.connection-point')) {
        this.handleConnectionDrag(e);
        return;
      }
      
      // Start block drag
      this.startBlockDrag(e, block);
    });
    
    // Block selection
    block.addEventListener('click', (e) => {
      // Ignore if clicking on inputs or buttons
      if (
        e.target.matches('input, select, button') || 
        e.target.closest('input, select, button')
      ) {
        return;
      }
      
      // Select the block
      this.selectBlock(block, e.ctrlKey || e.metaKey);
      e.stopPropagation();
    });
    
    // Block delete button
    const deleteBtn = block.querySelector('.block-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        // Select the block first (deselecting any others)
        this.selectBlock(block, false);
        
        // Delete the selected block using the manager's method
        this.blocksManager.deleteSelectedBlocks();
        
        e.stopPropagation();
      });
    }
    
    // Block duplicate button
    const duplicateBtn = block.querySelector('.block-duplicate-btn');
    if (duplicateBtn) {
      duplicateBtn.addEventListener('click', (e) => {
        // Save state for undo
        this.blocksManager.undoManager.addToUndoStack();
        
        // Duplicate the block
        const newBlock = this.blocksManager.blockFactory.duplicateBlock(block);
        
        if (newBlock) {
          // Add to workspace
          this.workspace.appendChild(newBlock);
          
          // Setup events
          this.setupBlockInteractions(newBlock);
          
          // Select the new block
          this.selectBlock(newBlock);
          
          // Refresh connections in the workspace to handle any inconsistencies
          this.blocksManager.refreshConnections();
        }
        
        e.stopPropagation();
      });
    }
  }
  
  startBlockDrag(e, block) {
    e.preventDefault();
    
    // Save initial drag position
    this.draggedBlock = block;
    const rect = block.getBoundingClientRect();
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.offsetX = this.dragStartX - rect.left;
    this.offsetY = this.dragStartY - rect.top;
    
    // Save original position in case we need to revert
    this.originalLeft = parseInt(block.style.left) || 0;
    this.originalTop = parseInt(block.style.top) || 0;
    
    // Add dragging class
    block.classList.add('dragging');
    
    // Select the block if not already selected
    if (!block.classList.contains('selected')) {
      this.selectBlock(block, e.ctrlKey || e.metaKey);
    }
    
    // Add event listeners for drag and release
    document.addEventListener('mousemove', this.blockDragMove);
    document.addEventListener('mouseup', this.blockDragEnd);
  }
  
  blockDragMove = (e) => {
    if (!this.draggedBlock) return;
    
    // Calculate new position
    const workspaceRect = this.workspace.getBoundingClientRect();
    
    // Account for workspace scroll position
    const scrollLeft = this.workspace.scrollLeft;
    const scrollTop = this.workspace.scrollTop;
    
    const x = e.clientX - workspaceRect.left - this.offsetX + scrollLeft;
    const y = e.clientY - workspaceRect.top - this.offsetY + scrollTop;
    
    // Get all selected blocks
    const selectedBlocks = Array.from(document.querySelectorAll('.block.selected'));
    
    // If we're dragging multiple blocks, calculate offset from start
    if (selectedBlocks.length > 1) {
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;
      
      // Move all selected blocks
      selectedBlocks.forEach(block => {
        const currentLeft = parseInt(block.style.left) || 0;
        const currentTop = parseInt(block.style.top) || 0;
        
        // Ensure the block stays within workspace bounds
        const newLeft = Math.max(0, currentLeft + deltaX);
        const newTop = Math.max(0, currentTop + deltaY);
        
        block.style.left = `${newLeft}px`;
        block.style.top = `${newTop}px`;
      });
      
      // Update drag start for next move
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    } else {
      // Just move the current block, ensuring it stays within workspace bounds
      this.draggedBlock.style.left = `${Math.max(0, x)}px`;
      this.draggedBlock.style.top = `${Math.max(0, y)}px`;
      
      // Check if we're over the trash area
      this.checkTrashAreaDrop(e);
    }
    
    // Auto-scroll the workspace if dragging near edges
    this.handleWorkspaceAutoScroll(e, workspaceRect);
  }
  
  handleWorkspaceAutoScroll(e, workspaceRect) {
    const SCROLL_MARGIN = 50; // px from edge to start scrolling
    const SCROLL_SPEED = 10; // px per frame
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Horizontal scrolling
    if (mouseX < workspaceRect.left + SCROLL_MARGIN) {
      // Left edge - scroll left
      this.workspace.scrollLeft -= SCROLL_SPEED;
    } else if (mouseX > workspaceRect.right - SCROLL_MARGIN) {
      // Right edge - scroll right
      this.workspace.scrollLeft += SCROLL_SPEED;
    }
    
    // Vertical scrolling
    if (mouseY < workspaceRect.top + SCROLL_MARGIN) {
      // Top edge - scroll up
      this.workspace.scrollTop -= SCROLL_SPEED;
    } else if (mouseY > workspaceRect.bottom - SCROLL_MARGIN) {
      // Bottom edge - scroll down
      this.workspace.scrollTop += SCROLL_SPEED;
    }
  }
  
  checkTrashAreaDrop(e) {
    const trashArea = document.querySelector('.blocks-trash-area');
    if (!trashArea) return;
    
    const trashRect = trashArea.getBoundingClientRect();
    const isOverTrash = 
      e.clientX >= trashRect.left &&
      e.clientX <= trashRect.right &&
      e.clientY >= trashRect.top &&
      e.clientY <= trashRect.bottom;
    
    if (isOverTrash) {
      trashArea.classList.add('active');
    } else {
      trashArea.classList.remove('active');
    }
  }
  
  blockDragEnd = (e) => {
    if (!this.draggedBlock) return;
    
    // Remove dragging class
    this.draggedBlock.classList.remove('dragging');
    
    // Check if dropping over trash area
    const trashArea = document.querySelector('.blocks-trash-area');
    if (trashArea) {
      const trashRect = trashArea.getBoundingClientRect();
      const isOverTrash = 
        e.clientX >= trashRect.left &&
        e.clientX <= trashRect.right &&
        e.clientY >= trashRect.top &&
        e.clientY <= trashRect.bottom;
      
      if (isOverTrash) {
        // Select this block and delete it
        this.selectBlock(this.draggedBlock, false);
        this.blocksManager.deleteSelectedBlocks();
        this.draggedBlock = null;
        trashArea.classList.remove('active');
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.blockDragMove);
        document.removeEventListener('mouseup', this.blockDragEnd);
        return;
      }
      
      trashArea.classList.remove('active');
    }
    
    // Save state for undo
    this.blocksManager.undoManager.addToUndoStack();
    
    // Check if any blocks are now connected
    this.checkBlockConnections(this.draggedBlock);
    
    // Refresh all connections in the workspace
    this.blocksManager.refreshConnections();
    
    // Reset drag variables
    this.draggedBlock = null;
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.blockDragMove);
    document.removeEventListener('mouseup', this.blockDragEnd);
  }
  
  checkBlockConnections(block) {
    // Check if block can connect to nearby blocks after being dragged
    if (!block) return;
    
    // Get all connection points in this block
    const connections = block.querySelectorAll('.block-connection');
    if (connections.length === 0) return;
    
    // For each connection point, check if it's near a compatible connection
    connections.forEach(connection => {
      // Skip if already connected
      if (connection.dataset.connectedTo) return;
      
      const connPoint = connection.querySelector('.connection-point');
      if (!connPoint) return;
      
      // Get connection position
      const rect = connPoint.getBoundingClientRect();
      const x = rect.left + rect.width/2;
      const y = rect.top + rect.height/2;
      
      // Find nearby connection points
      const nearbyConns = this.findNearbyConnectionPoints(x, y, connection);
      
      // Connect to the closest compatible one if any
      if (nearbyConns.length > 0) {
        this.connectBlocks(connection, nearbyConns[0]);
      }
    });
  }
  
  findNearbyConnectionPoints(x, y, sourceConnection) {
    const MAX_DISTANCE = 20; // Maximum distance to consider "nearby"
    const compatibleConns = [];
    
    // Check all connection points in workspace
    document.querySelectorAll('.block-connection').forEach(conn => {
      // Skip if it's the source connection or if already connected
      if (conn === sourceConnection || conn.dataset.connectedTo) return;
      
      // Check if compatible
      if (!this.canConnect(sourceConnection, conn)) return;
      
      // Get position
      const connPoint = conn.querySelector('.connection-point');
      if (!connPoint) return;
      
      const rect = connPoint.getBoundingClientRect();
      const connX = rect.left + rect.width/2;
      const connY = rect.top + rect.height/2;
      
      // Calculate distance
      const distance = Math.sqrt((connX - x)**2 + (connY - y)**2);
      
      // If within range, add to list with distance
      if (distance <= MAX_DISTANCE) {
        compatibleConns.push({
          connection: conn,
          distance: distance
        });
      }
    });
    
    // Sort by distance and return connections only
    return compatibleConns
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.connection);
  }
  
  handleConnectionDrag(e) {
    const connectionPoint = e.target.closest('.connection-point');
    if (!connectionPoint) return;
    
    const connection = connectionPoint.parentElement;
    if (!connection) return;
    
    // Start connection drag
    this.activeDragConnection = connection;
    
    // Create temporary visual connection
    const tempConnection = document.createElement('div');
    tempConnection.className = 'temp-connection';
    tempConnection.style.position = 'absolute';
    tempConnection.style.zIndex = 1000;
    tempConnection.style.pointerEvents = 'none';
    document.body.appendChild(tempConnection);
    
    // Get connection position
    const rect = connectionPoint.getBoundingClientRect();
    const x1 = rect.left + rect.width / 2;
    const y1 = rect.top + rect.height / 2;
    
    // Add event listeners for drag and release
    const connectionDragMove = (e) => {
      const x2 = e.clientX;
      const y2 = e.clientY;
      
      // Draw line
      this.drawConnectionLine(tempConnection, x1, y1, x2, y2);
      
      // Highlight compatible connections
      this.highlightCompatibleConnections(connection);
    };
    
    const connectionDragEnd = (e) => {
      // Remove temporary connection
      tempConnection.remove();
      
      // Check if we're connecting to another connection point
      const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
      const targetConnectionPoint = elementAtPoint?.closest('.connection-point');
      
      if (targetConnectionPoint) {
        const targetConnection = targetConnectionPoint.parentElement;
        
        // Check if compatible
        if (this.canConnect(connection, targetConnection)) {
          // Connect them
          this.connectBlocks(connection, targetConnection);
        }
      }
      
      // Reset variables
      this.activeDragConnection = null;
      
      // Remove highlights
      document.querySelectorAll('.connection-highlight').forEach(el => {
        el.classList.remove('connection-highlight');
      });
      
      // Remove event listeners
      document.removeEventListener('mousemove', connectionDragMove);
      document.removeEventListener('mouseup', connectionDragEnd);
    };
    
    document.addEventListener('mousemove', connectionDragMove);
    document.addEventListener('mouseup', connectionDragEnd);
  }
  
  drawConnectionLine(element, x1, y1, x2, y2) {
    // Calculate line properties
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    // Set line position and size
    element.style.width = `${length}px`;
    element.style.height = '2px';
    element.style.backgroundColor = '#FFA000';
    element.style.transformOrigin = '0 0';
    element.style.transform = `translate(${x1}px, ${y1}px) rotate(${angle}deg)`;
  }
  
  highlightCompatibleConnections(connection) {
    // Reset highlights
    document.querySelectorAll('.connection-highlight').forEach(el => {
      el.classList.remove('connection-highlight');
    });
    
    // Highlight compatible connections
    document.querySelectorAll('.block-connection').forEach(conn => {
      if (this.canConnect(connection, conn)) {
        conn.classList.add('connection-highlight');
      }
    });
  }
  
  canConnect(connection1, connection2) {
    if (!connection1 || !connection2) return false;
    if (connection1 === connection2) return false;
    const block1 = connection1.closest('.block');
    const block2 = connection2.closest('.block');
    if (block1 === block2) return false;
    const type1 = connection1.dataset.type;
    const type2 = connection2.dataset.type;
    const cat1 = connection1.dataset.category;
    const cat2 = connection2.dataset.category;
    // Only allow output to input or input to output
    if (!((type1 === 'output' && type2 === 'input') || (type1 === 'input' && type2 === 'output'))) return false;
    // Enforce category compatibility: event->action, action->action, action->value, value->input (if needed)
    // Event output can only connect to Action input
    if ((cat1 === 'events' && cat2 === 'components') && type1 === 'output' && type2 === 'input') return true;
    // Action output to Action input
    if ((cat1 === 'components' && cat2 === 'components') && type1 === 'output' && type2 === 'input') return true;
    // Add more rules as needed (e.g., logic, value blocks)
    return false;
  }
  
  connectBlocks(connection1, connection2) {
    if (!this.canConnect(connection1, connection2)) return;
    
    // Save state for undo
    this.blocksManager.undoManager.addToUndoStack();
    
    // Get block IDs
    const block1 = connection1.closest('.block');
    const block2 = connection2.closest('.block');
    
    const block1Id = block1.dataset.blockId;
    const block2Id = block2.dataset.blockId;
    
    // Determine which is output and which is input
    let outputConn, inputConn;
    if (connection1.dataset.type === 'output') {
      outputConn = connection1;
      inputConn = connection2;
    } else {
      outputConn = connection2;
      inputConn = connection1;
    }
    
    // Remove any existing connections
    if (inputConn.dataset.connectedTo) {
      const oldConnBlock = document.querySelector(`.block[data-block-id="${inputConn.dataset.connectedTo}"]`);
      if (oldConnBlock) {
        oldConnBlock.querySelectorAll('.block-connection').forEach(conn => {
          if (conn.dataset.connectedTo === block2Id) {
            conn.dataset.connectedTo = '';
            conn.classList.remove('connected');
          }
        });
      }
    }
    
    // Connect them
    outputConn.dataset.connectedTo = block2Id;
    inputConn.dataset.connectedTo = block1Id;
    
    // Add connected class
    outputConn.classList.add('connected');
    inputConn.classList.add('connected');
  }
  
  selectBlock(block, addToSelection = false) {
    if (!block) return;
    
    // If not adding to selection, deselect all blocks first
    if (!addToSelection) {
      this.blocksManager.deselectAllBlocks();
    }
    
    // Select the block
    block.classList.add('selected');
  }
}

export default WorkspaceManager; 