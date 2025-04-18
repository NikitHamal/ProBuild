class Navbar {
  constructor() {
    this.element = document.createElement('nav');
    this.element.className = 'navbar';
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <div class="container">
        <div class="flex justify-between items-center">
          <div class="logo">
            <h1>ProBuild</h1>
          </div>
          <div class="nav-links">
            <button id="theme-toggle" class="theme-toggle">
              <i class="material-icons">brightness_6</i>
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const themeToggle = this.element.querySelector('#theme-toggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      this.updateThemeIcon();
    });
  }

  updateThemeIcon() {
    const themeIcon = this.element.querySelector('#theme-toggle i');
    if (document.body.classList.contains('dark-theme')) {
      themeIcon.textContent = 'brightness_7';
    } else {
      themeIcon.textContent = 'brightness_4';
    }
  }
}

export default Navbar; 