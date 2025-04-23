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
  
  showEditAppDialog(app) {
    this.implementation.showEditAppDialog(app);
  }
  
  showEditScreenDialog(screen) {
    this.implementation.showEditScreenDialog(screen);
  }
  
  showDeleteScreenDialog(screen) {
    this.implementation.showDeleteScreenDialog(screen);
  }
}

export default ScreenManager; 