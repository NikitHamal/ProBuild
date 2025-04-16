class BlocksViewport {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.notificationManager = blocksManager.notificationManager;
  }
  
  zoomIn() {
    this.scale = Math.min(2.0, this.scale + 0.1);
    this.applyZoom();
    this.notificationManager.showNotification(`Zoom: ${Math.round(this.scale * 100)}%`, 'info');
  }
  
  zoomOut() {
    this.scale = Math.max(0.3, this.scale - 0.1);
    this.applyZoom();
    this.notificationManager.showNotification(`Zoom: ${Math.round(this.scale * 100)}%`, 'info');
  }
  
  applyZoom() {
    if (this.blocksManager.blocksWorkspace) {
      this.blocksManager.blocksWorkspace.style.transform = `scale(${this.scale})`;
      this.blocksManager.blocksWorkspace.style.transformOrigin = 'top left';
      
      // Update zoom display
      const zoomLevel = document.querySelector('.blocks-zoom-level');
      if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
      }
    }
  }
  
  centerWorkspace() {
    // Center the blocks in the workspace
    if (this.blocksManager.blocksWorkspace) {
      // Reset scroll position
      const container = this.blocksManager.blocksWorkspace.parentElement;
      if (container) {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }
      
      // Reset zoom
      this.scale = 1.0;
      this.applyZoom();
    }
    
    this.notificationManager.showNotification('Workspace centered', 'info');
  }
  
  moveCanvas(dx, dy) {
    if (this.blocksManager.blocksWorkspace) {
      const container = this.blocksManager.blocksWorkspace.parentElement;
      if (container) {
        container.scrollLeft += dx;
        container.scrollTop += dy;
      }
    }
  }
  
  getRelativePosition(clientX, clientY) {
    if (!this.blocksManager.blocksWorkspace) return { x: 0, y: 0 };
    
    const workspace = this.blocksManager.blocksWorkspace;
    const rect = workspace.getBoundingClientRect();
    
    return {
      x: (clientX - rect.left) / this.scale,
      y: (clientY - rect.top) / this.scale
    };
  }
  
  getZoomLevel() {
    return this.scale;
  }
  
  setZoom(scale) {
    this.scale = Math.max(0.3, Math.min(2.0, scale));
    this.applyZoom();
  }
  
  resetZoom() {
    this.scale = 1.0;
    this.applyZoom();
  }
}

export default BlocksViewport; 