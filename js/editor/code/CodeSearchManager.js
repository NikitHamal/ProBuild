import NotificationManager from '../utils/NotificationManager.js';

class CodeSearchManager {
  constructor(codeManager) {
    this.codeManager = codeManager;
    this.notificationManager = new NotificationManager();
    this.searchResults = {
      query: '',
      matches: [],
      currentIndex: -1
    };
  }

  searchInCode(query) {
    const editorInstance = this.codeManager.editorInstance;
    if (!query || !editorInstance) return;
    
    const content = editorInstance.value;
    
    // Reset search results
    this.searchResults = {
      query,
      matches: [],
      currentIndex: -1
    };
    
    // Find all matches
    let matchIndex = content.indexOf(query);
    while (matchIndex !== -1) {
      this.searchResults.matches.push(matchIndex);
      matchIndex = content.indexOf(query, matchIndex + 1);
    }
    
    if (this.searchResults.matches.length === 0) {
      this.notificationManager.showNotification(`No matches found for "${query}"`, 'info');
      return;
    }
    
    // Set first match as current
    this.searchResults.currentIndex = 0;
    const firstMatch = this.searchResults.matches[0];
    
    // Set selection to match
    editorInstance.focus();
    editorInstance.setSelectionRange(firstMatch, firstMatch + query.length);
    
    // Scroll to match if needed
    this.scrollToSelection();
    
    // Notify user
    this.notificationManager.showNotification(
      `Found ${this.searchResults.matches.length} match${this.searchResults.matches.length !== 1 ? 'es' : ''}`,
      'info'
    );
  }

  searchNext() {
    const editorInstance = this.codeManager.editorInstance;
    if (!this.searchResults.query || this.searchResults.matches.length === 0 || !editorInstance) return;
    
    // Move to next match
    this.searchResults.currentIndex = (this.searchResults.currentIndex + 1) % this.searchResults.matches.length;
    const matchPos = this.searchResults.matches[this.searchResults.currentIndex];
    
    // Set selection
    editorInstance.focus();
    editorInstance.setSelectionRange(matchPos, matchPos + this.searchResults.query.length);
    
    // Scroll to match
    this.scrollToSelection();
  }

  searchPrev() {
    const editorInstance = this.codeManager.editorInstance;
    if (!this.searchResults.query || this.searchResults.matches.length === 0 || !editorInstance) return;
    
    // Move to previous match
    this.searchResults.currentIndex = 
      (this.searchResults.currentIndex - 1 + this.searchResults.matches.length) % this.searchResults.matches.length;
    const matchPos = this.searchResults.matches[this.searchResults.currentIndex];
    
    // Set selection
    editorInstance.focus();
    editorInstance.setSelectionRange(matchPos, matchPos + this.searchResults.query.length);
    
    // Scroll to match
    this.scrollToSelection();
  }

  scrollToSelection() {
    const editorInstance = this.codeManager.editorInstance;
    if (!editorInstance) return;
    
    // Calculate position of selection
    const textarea = editorInstance;
    const content = textarea.value.substring(0, textarea.selectionStart);
    const lines = content.split('\n');
    
    // Estimate line height (can vary by browser/font)
    const lineHeight = 18; // px, approximate
    
    // Calculate scroll position to center selection
    const linePos = lines.length * lineHeight;
    const viewportHeight = textarea.clientHeight;
    const scrollPos = linePos - (viewportHeight / 2);
    
    // Set scroll position
    if (scrollPos > 0) {
      textarea.scrollTop = scrollPos;
    }
  }

  resetSearch() {
    this.searchResults = {
      query: '',
      matches: [],
      currentIndex: -1
    };
  }
}

export default CodeSearchManager; 