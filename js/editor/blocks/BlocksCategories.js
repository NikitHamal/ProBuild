class BlocksCategories {
  constructor(blocksManager) {
    this.blocksManager = blocksManager;
    this.categories = [
      { id: 'events', name: 'Events', icon: 'event', color: '#FFA000' },
      { id: 'control', name: 'Control', icon: 'share', color: '#FF8F00' },
      { id: 'logic', name: 'Logic', icon: 'code', color: '#00BCD4' },
      { id: 'math', name: 'Math', icon: 'calculate', color: '#4CAF50' },
      { id: 'text', name: 'Text', icon: 'text_fields', color: '#9C27B0' },
      { id: 'lists', name: 'Lists', icon: 'list', color: '#FF5722' },
      { id: 'variables', name: 'Variables', icon: 'category', color: '#E91E63' },
      { id: 'functions', name: 'Functions', icon: 'functions', color: '#3F51B5' },
      { id: 'components', name: 'Components', icon: 'widgets', color: '#607D8B' },
      { id: 'advanced', name: 'Advanced', icon: 'extension', color: '#795548' }
    ];
    this.activeCategory = 'events';
  }
  
  render() {
    return `
      <div class="blocks-categories-list">
        ${this.categories.map(category => `
          <div class="blocks-category ${category.id === this.activeCategory ? 'active' : ''}" 
               data-category="${category.id}" 
               style="--category-color: ${category.color}">
            <i class="material-icons">${category.icon}</i>
            <span class="category-name">${category.name}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  setupEventListeners() {
    document.querySelectorAll('.blocks-category').forEach(categoryEl => {
      categoryEl.addEventListener('click', () => {
        const categoryId = categoryEl.dataset.category;
        this.setActiveCategory(categoryId);
      });
    });
  }
  
  setActiveCategory(categoryId) {
    this.activeCategory = categoryId;
    
    // Update UI to show active category
    document.querySelectorAll('.blocks-category').forEach(categoryEl => {
      if (categoryEl.dataset.category === categoryId) {
        categoryEl.classList.add('active');
      } else {
        categoryEl.classList.remove('active');
      }
    });
    
    // Update the toolbox to show blocks for this category
    this.blocksManager.blocksToolbox.updateToolboxForCategory(categoryId);
  }
  
  getCategoryById(categoryId) {
    return this.categories.find(category => category.id === categoryId);
  }
}

export default BlocksCategories; 