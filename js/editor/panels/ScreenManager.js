import ScreenManagerImpl from './screens/ScreenManager.js';

class ScreenManager {
  constructor(editorView) {
    this.implementation = new ScreenManagerImpl(editorView);
    this.editorView = editorView;
  }
  
  renderScreensList() {
    return this.implementation.renderScreensList();
  }
  
  setupScreenEventListeners() {
    this.implementation.setupScreenEventListeners();
  }
  
  setCurrentScreen(screenId) {
    this.implementation.setCurrentScreen(screenId);
  }
  
  showAddScreenDialog() {
    this.implementation.showAddScreenDialog();
  }
}

export default ScreenManager; 