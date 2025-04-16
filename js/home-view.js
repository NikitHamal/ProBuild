import AppService from './app-service.js';
import AppCard from '../components/app-card.js';
import Navbar from '../components/navbar.js';

class HomeView {
  constructor() {
    this.appService = AppService;
    this.init();
  }

  init() {
    // Add navbar
    const navbar = new Navbar();
    document.body.insertBefore(navbar.element, document.body.firstChild);

    this.renderAppList();
    this.setupEventListeners();
  }

  renderAppList() {
    const apps = this.appService.getApps();
    const container = document.createElement('div');
    container.className = 'container app-list-container';
    
    container.innerHTML = `
      <div class="app-list-header">
        <h2 class="app-list-title">My Apps</h2>
        <button class="new-app-btn">
          <i class="material-icons">add</i>
          Create New App
        </button>
      </div>
      <div class="app-grid"></div>
    `;

    const appGrid = container.querySelector('.app-grid');
    
    if (apps.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <i class="material-icons">phone_android</i>
        <h2 class="empty-state-title">No apps yet</h2>
        <p class="empty-state-text">Create your first app to get started</p>
      `;
      appGrid.appendChild(emptyState);
    } else {
      apps.forEach(app => {
        const appCard = new AppCard(app);
        appGrid.appendChild(appCard.element);
      });
    }

    document.body.appendChild(container);
  }

  setupEventListeners() {
    // Create new app button
    document.addEventListener('click', (e) => {
      if (e.target.closest('.new-app-btn')) {
        this.showCreateAppDialog();
      }
    });
  }

  showCreateAppDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog fullscreen new-project">
        <div class="dialog-header">
          <button class="back-btn">
            <i class="material-icons">arrow_back</i>
          </button>
          <div class="dialog-title">New Project</div>
        </div>
        
        <div class="dialog-content">
          <div class="app-icon-selector">
            <div class="app-icon-preview" id="icon-preview">
              <i class="material-icons">android</i>
            </div>
            <span class="app-icon-hint">Tap to change icon</span>
          </div>
          
          <div class="form-group">
            <input type="text" id="app-name" placeholder="App Name">
          </div>
          
          <div class="form-group">
            <input type="text" id="package-name" placeholder="Package Name">
          </div>
          
          <div class="form-group">
            <input type="text" id="project-name" placeholder="Project Name">
          </div>
          
          <div class="color-selector">
            <div class="color-option colorAccent selected" data-color="colorAccent">
              <div class="color-tooltip">Accent Color (Buttons, Links)</div>
            </div>
            <div class="color-option colorPrimary" data-color="colorPrimary">
              <div class="color-tooltip">Primary Color (App Bar)</div>
            </div>
            <div class="color-option colorPrimaryDark" data-color="colorPrimaryDark">
              <div class="color-tooltip">Primary Dark (Status Bar)</div>
            </div>
            <div class="color-option colorControlHighlight" data-color="colorControlHighlight">
              <div class="color-tooltip">Control Highlight (Ripple)</div>
            </div>
            <div class="color-selector-more" id="custom-color-btn">
              <i class="material-icons">palette</i>
            </div>
          </div>
          
          <div class="custom-color-picker" id="custom-color-picker">
            <div class="form-group">
              <label for="custom-color">Custom Color</label>
              <input type="color" id="custom-color" value="#2196F3">
            </div>
            <div class="form-group">
              <label for="color-type">Apply To</label>
              <select id="color-type">
                <option value="colorAccent">Accent Color</option>
                <option value="colorPrimary">Primary Color</option>
                <option value="colorPrimaryDark">Primary Dark</option>
                <option value="colorControlHighlight">Control Highlight</option>
              </select>
            </div>
            <button class="dialog-btn" id="apply-custom-color">Apply</button>
          </div>
          
          <div class="version-fields">
            <div class="form-group">
              <input type="number" id="version-code" placeholder="Version code" min="1" value="1">
            </div>
            <div class="form-group">
              <input type="text" id="version-name" placeholder="Version name" value="1.0">
            </div>
          </div>
          
          <div class="api-selector">
            <label>Minimum SDK</label>
            <div class="api-options">
              <div class="api-option" data-api="16">API 16 (Jelly Bean)</div>
              <div class="api-option" data-api="19">API 19 (KitKat)</div>
              <div class="api-option selected" data-api="21">API 21 (Lollipop)</div>
              <div class="api-option" data-api="23">API 23 (Marshmallow)</div>
              <div class="api-option" data-api="26">API 26 (Oreo)</div>
              <div class="api-option" data-api="29">API 29 (Android 10)</div>
              <div class="api-option" data-api="30">API 30 (Android 11)</div>
              <div class="api-option" data-api="31">API 31 (Android 12)</div>
              <div class="api-option" data-api="33">API 33 (Android 13)</div>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn cancel">Cancel</button>
          <button class="dialog-btn primary">New Project</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Handle dialog actions
    const cancelBtn = dialog.querySelector('.cancel');
    const createBtn = dialog.querySelector('.primary');
    const backBtn = dialog.querySelector('.back-btn');
    const nameInput = dialog.querySelector('#app-name');
    const packageInput = dialog.querySelector('#package-name');
    const projectNameInput = dialog.querySelector('#project-name');
    const versionCodeInput = dialog.querySelector('#version-code');
    const versionNameInput = dialog.querySelector('#version-name');
    const colorOptions = dialog.querySelectorAll('.color-option');
    const apiOptions = dialog.querySelectorAll('.api-option');
    const iconPreview = dialog.querySelector('#icon-preview');
    const customColorBtn = dialog.querySelector('#custom-color-btn');
    const customColorPicker = dialog.querySelector('#custom-color-picker');
    const applyCustomColorBtn = dialog.querySelector('#apply-custom-color');
    const customColorInput = dialog.querySelector('#custom-color');
    const colorTypeSelect = dialog.querySelector('#color-type');
    
    // Set packageName based on app name
    nameInput.addEventListener('input', () => {
      const appName = nameInput.value.trim();
      if (appName && !packageInput.value.trim()) {
        packageInput.value = `com.example.${appName.toLowerCase().replace(/\s+/g, '')}`;
      }
      
      if (appName && !projectNameInput.value.trim()) {
        projectNameInput.value = appName;
      }
    });
    
    // Handle color selection
    let selectedColor = 'colorAccent';
    let customColors = {
      colorAccent: '#2196F3',
      colorPrimary: '#3F51B5',
      colorPrimaryDark: '#303F9F',
      colorControlHighlight: '#E0E0E0'
    };
    
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected class to clicked option
        option.classList.add('selected');
        selectedColor = option.dataset.color;
      });
    });
    
    // Toggle custom color picker
    customColorBtn.addEventListener('click', () => {
      customColorPicker.classList.toggle('active');
      if (customColorPicker.classList.contains('active')) {
        const currentType = colorTypeSelect.value;
        customColorInput.value = customColors[currentType];
      }
    });
    
    // Apply custom color
    applyCustomColorBtn.addEventListener('click', () => {
      const colorType = colorTypeSelect.value;
      const color = customColorInput.value;
      customColors[colorType] = color;
      
      // Update color option visually
      const colorOption = dialog.querySelector(`.color-option.${colorType}`);
      if (colorOption) {
        colorOption.style.backgroundColor = color;
        // Select this color
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        colorOption.classList.add('selected');
        selectedColor = colorType;
      }
      
      // Hide picker
      customColorPicker.classList.remove('active');
    });
    
    // Handle API selection
    let selectedApi = '21';
    apiOptions.forEach(option => {
      option.addEventListener('click', () => {
        apiOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedApi = option.dataset.api;
      });
    });
    
    // Icon selection
    let selectedIcon = 'android';
    let customIconUrl = null;
    
    iconPreview.addEventListener('click', () => {
      this.showIconPicker(iconSelected => {
        if (iconSelected.type === 'material') {
          selectedIcon = iconSelected.icon;
          customIconUrl = null;
          iconPreview.innerHTML = `<i class="material-icons">${selectedIcon}</i>`;
        } else if (iconSelected.type === 'custom') {
          selectedIcon = null;
          customIconUrl = iconSelected.url;
          iconPreview.innerHTML = `<img src="${customIconUrl}" alt="App Icon">`;
        }
      });
    });

    // Handle close buttons
    const closeDialog = () => {
      dialog.remove();
    };
    
    cancelBtn.addEventListener('click', closeDialog);
    backBtn.addEventListener('click', closeDialog);

    // Handle create button
    createBtn.addEventListener('click', () => {
      const appName = nameInput.value.trim();
      const packageName = packageInput.value.trim();
      const projectName = projectNameInput.value.trim() || appName;
      const versionCode = versionCodeInput.value.trim() || "1";
      const versionName = versionNameInput.value.trim() || "1.0";
      
      if (appName && packageName) {
        const newApp = this.appService.createApp(appName, {
          packageName,
          projectName,
          versionCode,
          versionName,
          themeColor: selectedColor,
          customColors,
          minSdk: selectedApi,
          icon: selectedIcon,
          customIconUrl
        });
        
        // Redirect to editor with new app ID
        window.location.href = `editor.html?id=${newApp.id}`;
      } else {
        if (!appName) {
          nameInput.classList.add('error');
          nameInput.placeholder = 'App name is required';
        }
        if (!packageName) {
          packageInput.classList.add('error');
          packageInput.placeholder = 'Package name is required';
        }
      }
    });

    // Focus input
    nameInput.focus();
  }
  
  showIconPicker(callback) {
    const materialIcons = [
      'android', 'adb', 'brush', 'bug_report', 'build', 'camera',
      'desktop_windows', 'devices', 'flash_on', 'games', 'group',
      'home', 'language', 'phone_android', 'photo_camera', 'public',
      'school', 'security', 'settings', 'shopping_cart', 'smartphone',
      'speed', 'store', 'tag_faces', 'theaters', 'toys',
      'videogame_asset', 'watch', 'wb_sunny', 'work'
    ];
    
    const picker = document.createElement('div');
    picker.className = 'icon-picker';
    picker.innerHTML = `
      <div class="icon-picker-content">
        <div class="icon-picker-header">
          <div class="icon-picker-title">Select an Icon</div>
          <button class="icon-picker-close">&times;</button>
        </div>
        <div class="icon-picker-grid">
          ${materialIcons.map(icon => 
            `<div class="icon-option" data-icon="${icon}">
              <i class="material-icons">${icon}</i>
            </div>`
          ).join('')}
        </div>
        <div class="icon-upload">
          <label class="icon-upload-btn">
            Upload Custom Icon
            <input type="file" id="icon-upload" accept="image/*" style="display: none;">
          </label>
        </div>
      </div>
    `;
    
    document.body.appendChild(picker);
    
    // Close button
    const closeBtn = picker.querySelector('.icon-picker-close');
    closeBtn.addEventListener('click', () => {
      picker.remove();
    });
    
    // Material icon selection
    const iconOptions = picker.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
      option.addEventListener('click', () => {
        const icon = option.dataset.icon;
        callback({ type: 'material', icon });
        picker.remove();
      });
    });
    
    // Custom icon upload
    const uploadInput = picker.querySelector('#icon-upload');
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          callback({ type: 'custom', url: event.target.result });
          picker.remove();
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Close when clicking outside
    picker.addEventListener('click', (e) => {
      if (e.target === picker) {
        picker.remove();
      }
    });
  }
}

export default HomeView; 