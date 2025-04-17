class AppService {
  constructor() {
    this.apps = this.loadApps();
  }

  loadApps() {
    try {
      const storedApps = localStorage.getItem('apps');
      return storedApps ? JSON.parse(storedApps) : [];
    } catch (error) {
      console.error("Error loading apps from localStorage:", error);
      return [];
    }
  }

  saveApps() {
    try {
      localStorage.setItem('apps', JSON.stringify(this.apps));
    } catch (error) {
      console.error("Error saving apps to localStorage:", error);
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
}

export default new AppService(); 