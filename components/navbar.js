class Navbar {
  constructor() {
    this.element = document.createElement('nav');
    this.element.className = 'navbar';
    this.currentTheme = this.getStoredTheme();
    this.mobileMenuOpen = false;
    this.render();
    this.setupEventListeners();
    this.applyTheme();
  }

  getStoredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  render() {
    this.element.innerHTML = `
      <div class="container">
        <div class="navbar-brand">
          <div class="navbar-logo">
            <div class="navbar-logo-icon">
              <i class="material-icons">smartphone</i>
            </div>
            <h1>ProBuild</h1>
          </div>
        </div>
        
        <div class="navbar-nav">
          <div class="nav-links">
            <a href="index.html" class="nav-link ${this.isCurrentPage('index.html') ? 'active' : ''}">
              <i class="material-icons">home</i>
              <span>Home</span>
            </a>
            <a href="#" class="nav-link" id="docs-link">
              <i class="material-icons">description</i>
              <span>Docs</span>
            </a>
            <a href="#" class="nav-link" id="help-link">
              <i class="material-icons">help</i>
              <span>Help</span>
            </a>
          </div>
          
          <div class="navbar-actions">
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
              <i class="material-icons">${this.currentTheme === 'dark' ? 'light_mode' : 'dark_mode'}</i>
            </button>
            
            <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu" title="Menu">
              <i class="material-icons">menu</i>
            </button>
          </div>
        </div>
        
        <div class="nav-mobile" id="nav-mobile">
          <div class="nav-links">
            <a href="index.html" class="nav-link ${this.isCurrentPage('index.html') ? 'active' : ''}">
              <i class="material-icons">home</i>
              <span>Home</span>
            </a>
            <a href="#" class="nav-link" id="docs-link-mobile">
              <i class="material-icons">description</i>
              <span>Documentation</span>
            </a>
            <a href="#" class="nav-link" id="help-link-mobile">
              <i class="material-icons">help</i>
              <span>Help & Support</span>
            </a>
            <div class="nav-divider"></div>
            <button class="nav-link theme-toggle-mobile" id="theme-toggle-mobile">
              <i class="material-icons">${this.currentTheme === 'dark' ? 'light_mode' : 'dark_mode'}</i>
              <span>${this.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  isCurrentPage(path) {
    const currentPath = window.location.pathname;
    if (path === 'index.html') {
      return currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('/');
    }
    return currentPath.endsWith(path);
  }

  setupEventListeners() {
    // Theme toggle buttons
    const themeToggle = this.element.querySelector('#theme-toggle');
    const themeToggleMobile = this.element.querySelector('#theme-toggle-mobile');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', () => {
        this.toggleTheme();
        this.closeMobileMenu();
      });
    }

    // Mobile menu toggle
    const menuToggle = this.element.querySelector('#menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.mobileMenuOpen && !this.element.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Handle navigation links
    this.setupNavigationLinks();

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme();
          this.updateThemeIcons();
        }
      });
    }

    // Handle scroll effects
    this.setupScrollEffects();
  }

  setupNavigationLinks() {
    // Documentation links
    const docsLinks = this.element.querySelectorAll('#docs-link, #docs-link-mobile');
    docsLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showComingSoonDialog('Documentation');
        if (e.target.closest('.nav-mobile')) {
          this.closeMobileMenu();
        }
      });
    });

    // Help links
    const helpLinks = this.element.querySelectorAll('#help-link, #help-link-mobile');
    helpLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHelpDialog();
        if (e.target.closest('.nav-mobile')) {
          this.closeMobileMenu();
        }
      });
    });

    // Mobile menu links
    const mobileLinks = this.element.querySelectorAll('.nav-mobile .nav-link:not(.theme-toggle-mobile)');
    mobileLinks.forEach(link => {
      if (!link.id.includes('toggle')) {
        link.addEventListener('click', () => {
          this.closeMobileMenu();
        });
      }
    });
  }

  setupScrollEffects() {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavbar = () => {
      const scrollY = window.scrollY;
      
      if (scrollY > 50) {
        this.element.classList.add('scrolled');
      } else {
        this.element.classList.remove('scrolled');
      }

      lastScrollY = scrollY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.applyTheme();
    this.updateThemeIcons();
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: this.currentTheme } 
    }));
  }

  applyTheme() {
    // Remove existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    document.documentElement.removeAttribute('data-theme');
    
    // Apply new theme
    if (this.currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const primaryColor = this.currentTheme === 'dark' ? '#D0BCFF' : '#6750A4';
      metaThemeColor.setAttribute('content', primaryColor);
    }
  }

  updateThemeIcons() {
    const themeIcons = this.element.querySelectorAll('.theme-toggle i, .theme-toggle-mobile i');
    const themeTexts = this.element.querySelectorAll('.theme-toggle-mobile span');
    
    const newIcon = this.currentTheme === 'dark' ? 'light_mode' : 'dark_mode';
    const newText = this.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    
    themeIcons.forEach(icon => {
      icon.textContent = newIcon;
    });
    
    themeTexts.forEach(text => {
      text.textContent = newText;
    });

    // Update tooltips
    const themeToggle = this.element.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.setAttribute('title', `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`);
      themeToggle.setAttribute('aria-label', `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    const mobileMenu = this.element.querySelector('#nav-mobile');
    const menuToggle = this.element.querySelector('#menu-toggle');
    
    if (this.mobileMenuOpen) {
      mobileMenu.classList.add('open');
      menuToggle.querySelector('i').textContent = 'close';
      menuToggle.setAttribute('aria-expanded', 'true');
      
      // Focus management
      const firstLink = mobileMenu.querySelector('.nav-link');
      if (firstLink) {
        firstLink.focus();
      }
    } else {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    const mobileMenu = this.element.querySelector('#nav-mobile');
    const menuToggle = this.element.querySelector('#menu-toggle');
    
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
    }
    
    if (menuToggle) {
      menuToggle.querySelector('i').textContent = 'menu';
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  }

  showComingSoonDialog(feature) {
    const dialog = this.createDialog({
      title: 'Coming Soon',
      content: `
        <div class="dialog-alert">
          <div class="dialog-alert-icon info">
            <i class="material-icons">info</i>
          </div>
          <div class="dialog-alert-content">
            <h3>${feature} Coming Soon</h3>
            <p>We're working hard to bring you comprehensive ${feature.toLowerCase()}. Stay tuned for updates!</p>
          </div>
        </div>
      `,
      actions: [
        { text: 'Got it', action: 'close', style: 'filled' }
      ]
    });
    
    this.showDialog(dialog);
  }

  showHelpDialog() {
    const dialog = this.createDialog({
      title: 'Help & Support',
      content: `
        <div class="dialog-content-section">
          <h3>Getting Started</h3>
          <p>ProBuild is a visual app builder that helps you create mobile applications without coding. Here are some quick tips:</p>
          
          <ul style="margin: 16px 0; padding-left: 20px;">
            <li>Create a new app from the home page</li>
            <li>Drag and drop components to build your UI</li>
            <li>Use the properties panel to customize components</li>
            <li>Preview your app in real-time</li>
            <li>Build and export your app when ready</li>
          </ul>
          
          <h3>Keyboard Shortcuts</h3>
          <div style="font-family: monospace; font-size: 0.875rem; margin: 12px 0;">
            <div style="margin: 8px 0;"><strong>Ctrl/Cmd + S</strong> - Save project</div>
            <div style="margin: 8px 0;"><strong>Ctrl/Cmd + Z</strong> - Undo</div>
            <div style="margin: 8px 0;"><strong>Ctrl/Cmd + Y</strong> - Redo</div>
            <div style="margin: 8px 0;"><strong>Delete</strong> - Delete selected component</div>
          </div>
          
          <h3>Need More Help?</h3>
          <p>For additional support, check out our documentation or reach out to our community.</p>
        </div>
      `,
      actions: [
        { text: 'Close', action: 'close', style: 'filled' }
      ]
    });
    
    this.showDialog(dialog);
  }

  createDialog({ title, content, actions = [] }) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h2 class="dialog-title">${title}</h2>
        <button class="dialog-close" aria-label="Close dialog">
          <i class="material-icons">close</i>
        </button>
      </div>
      <div class="dialog-content">
        ${content}
      </div>
      ${actions.length > 0 ? `
        <div class="dialog-actions">
          ${actions.map(action => `
            <button class="dialog-action-btn ${action.style || ''}" data-action="${action.action}">
              ${action.text}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    dialogOverlay.appendChild(dialog);
    return dialogOverlay;
  }

  showDialog(dialogElement) {
    document.body.appendChild(dialogElement);
    
    // Setup event listeners
    const closeBtn = dialogElement.querySelector('.dialog-close');
    const actionBtns = dialogElement.querySelectorAll('.dialog-action-btn');
    
    const closeDialog = () => {
      dialogElement.remove();
    };
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeDialog);
    }
    
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'close') {
          closeDialog();
        }
      });
    });
    
    // Close on overlay click
    dialogElement.addEventListener('click', (e) => {
      if (e.target === dialogElement) {
        closeDialog();
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Focus management
    const firstFocusable = dialogElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  // Public method to update active navigation
  updateActiveNav(path) {
    const navLinks = this.element.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === path || 
          (path === 'index.html' && (link.getAttribute('href') === '/' || link.getAttribute('href') === 'index.html'))) {
        link.classList.add('active');
      }
    });
  }

  // Public method to show loading state
  setLoading(loading) {
    if (loading) {
      this.element.classList.add('loading');
    } else {
      this.element.classList.remove('loading');
    }
  }

  // Cleanup method
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default Navbar; 