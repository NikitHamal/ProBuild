class AppService {
  constructor() {
    this.apps = this.loadApps();
  }

  loadApps() {
    const storedApps = localStorage.getItem('apps');
    if (!storedApps) {
      return []; // No apps stored yet
    }
    try {
      // Added try-catch for parsing
      return JSON.parse(storedApps);
    } catch (error) {
      console.error("Error parsing apps from localStorage:", error);
      // Optionally: Notify the user, try to recover, or clear corrupted data
      // For now, returning empty array to prevent app crash
      // localStorage.removeItem('apps'); // uncomment to clear corrupted data
      return [];
    }
  }

  saveApps() {
    try {
      // Added try-catch for stringifying/saving
      localStorage.setItem('apps', JSON.stringify(this.apps));
    } catch (error) {
      console.error("Error saving apps to localStorage:", error);
      // Optionally: Notify the user
      // Consider mechanisms to prevent data loss if quota is exceeded
    }
  }

  getApps() {
    return this.apps;
  }

  getAppById(id) {
    return this.apps.find(app => app.id === id);
  }

  createApp(name, options = {}) {
    const {
      packageName = `com.example.${name.toLowerCase().replace(/\s+/g, '')}`,
      projectName = name,
      versionCode = "1",
      versionName = "1.0",
      themeColor = "colorAccent",
      customColors = {
        colorAccent: '#2196F3',
        colorPrimary: '#3F51B5',
        colorPrimaryDark: '#303F9F',
        colorControlHighlight: '#E0E0E0'
      },
      minSdk = "21",
      icon = 'android',
      customIconUrl = null
    } = options;

    const newApp = {
      id: crypto.randomUUID(),
      name: name,
      packageName: packageName,
      projectName: projectName,
      versionCode: versionCode,
      versionName: versionName,
      themeColor: themeColor,
      customColors: customColors,
      minSdk: minSdk,
      icon: icon,
      customIconUrl: customIconUrl,
      screens: [{
        id: crypto.randomUUID(),
        name: 'MainActivity',
        components: []
      }],
      lastModified: Date.now(),
      created: Date.now()
    };

    this.apps.push(newApp);
    this.saveApps();
    return newApp;
  }

  updateApp(app) {
    const index = this.apps.findIndex(a => a.id === app.id);
    if (index !== -1) {
      app.lastModified = Date.now();
      this.apps[index] = app;
      this.saveApps();
      return true;
    }
    return false;
  }

  deleteApp(id) {
    const initialLength = this.apps.length;
    this.apps = this.apps.filter(app => app.id !== id);
    
    if (this.apps.length !== initialLength) {
      this.saveApps();
      return true;
    }
    
    return false;
  }

  // Screen operations
  addScreen(appId, screenName) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const newScreen = {
      id: crypto.randomUUID(),
      name: screenName,
      components: []
    };

    app.screens.push(newScreen);
    this.updateApp(app);
    return newScreen;
  }

  updateScreen(appId, screen) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const index = app.screens.findIndex(s => s.id === screen.id);
    if (index !== -1) {
      app.screens[index] = screen;
      this.updateApp(app);
      return true;
    }
    
    return false;
  }

  deleteScreen(appId, screenId) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const initialLength = app.screens.length;
    if (initialLength <= 1) {
      return false; // Don't delete the last screen
    }

    app.screens = app.screens.filter(screen => screen.id !== screenId);
    
    if (app.screens.length !== initialLength) {
      this.updateApp(app);
      return true;
    }
    
    return false;
  }

  // Component operations
  addComponent(appId, screenId, component) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const screen = app.screens.find(s => s.id === screenId);
    if (!screen) return false;

    const newComponent = {
      id: crypto.randomUUID(),
      ...component
    };

    screen.components.push(newComponent);
    this.updateApp(app);
    return newComponent;
  }

  updateComponent(appId, screenId, component) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const screen = app.screens.find(s => s.id === screenId);
    if (!screen) return false;

    const index = screen.components.findIndex(c => c.id === component.id);
    if (index !== -1) {
      screen.components[index] = component;
      this.updateApp(app);
      return true;
    }
    
    return false;
  }

  deleteComponent(appId, screenId, componentId) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const screen = app.screens.find(s => s.id === screenId);
    if (!screen) return false;

    const initialLength = screen.components.length;
    screen.components = screen.components.filter(component => component.id !== componentId);
    
    if (screen.components.length !== initialLength) {
      this.updateApp(app);
      return true;
    }
    
    return false;
  }

  updateComponentId(appId, screenId, oldId, newId) {
    const app = this.getAppById(appId);
    if (!app) return false;

    const screen = app.screens.find(s => s.id === screenId);
    if (!screen) return false;

    // Find the component with the old ID
    const component = screen.components.find(c => c.id === oldId);
    if (!component) return false;
    
    // Update the component ID
    component.id = newId;
    
    // Update references to this component in other components (if any)
    // For example, if components have child references or layout relationships
    screen.components.forEach(c => {
      // Update children references if applicable
      if (c.properties && c.properties.children && Array.isArray(c.properties.children)) {
        const childIndex = c.properties.children.indexOf(oldId);
        if (childIndex !== -1) {
          c.properties.children[childIndex] = newId;
        }
      }
      
      // Update any other references as needed for your specific app
    });
    
    // Also update any references in blocks or code that might be stored
    // This depends on how your app's blocks/code data is structured
    
    this.updateApp(app);
    return true;
  }
}

export default new AppService(); 