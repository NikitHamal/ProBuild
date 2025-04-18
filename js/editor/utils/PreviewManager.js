class PreviewManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.appService = editorView.appService;
    this.notificationManager = editorView.notificationManager;
    this.previewWindowRef = null; // Reference to the open preview window
  }

  launchAppPreview() {
    const app = this.editorView.currentApp;
    if (!app) {
      this.notificationManager.showNotification('No app loaded to preview.', 'error');
      return;
    }
    
    // If preview window exists and is open, focus and update it
    if (this.isPreviewWindowOpen()) {
      this.previewWindowRef.focus();
      this.updatePreviewContent(); 
      this.notificationManager.showNotification('Preview updated.', 'info', 1500);
      return;
    }

    // Show loading notification
    this.notificationManager.showNotification(
      `Launching preview for ${app.name}...`,
      'info'
    );
    
    // Create preview window content with app simulation
    const previewHtml = this.generatePreviewHtml();
    
    // Open a new window for the preview
    const previewWindow = window.open('', '_blank', 'width=400,height=800');
    
    if (!previewWindow) {
      this.notificationManager.showNotification(
        'Preview window was blocked by popup blocker. Please allow popups and try again.',
        'error'
      );
      return;
    }
    
    // Write the HTML to the new window
    previewWindow.document.open();
    previewWindow.document.write(previewHtml);
    previewWindow.document.close();

    // Store reference and add listener for when it closes
    this.previewWindowRef = previewWindow;
    this.previewWindowRef.addEventListener('beforeunload', () => {
        this.previewWindowRef = null; 
    });
  }
  
  isPreviewWindowOpen() {
      return this.previewWindowRef && !this.previewWindowRef.closed;
  }

  updatePreviewContent() {
    if (!this.isPreviewWindowOpen()) return;

    const app = this.editorView.currentApp;
    const currentScreen = this.editorView.currentScreen;
    let componentsHtml = '';

    // Regenerate components HTML using current data
    if (currentScreen && currentScreen.components && currentScreen.components.length > 0) {
      const componentMap = new Map(currentScreen.components.map(c => [c.id, c]));
      const allChildIds = new Set(currentScreen.components.flatMap(c => c.children || []));
      const topLevelComponents = currentScreen.components.filter(c => !allChildIds.has(c.id));
      componentsHtml = topLevelComponents.map(comp => this.generateComponentHtml(comp, componentMap)).join('');
    } else {
      componentsHtml = this.generateDemoComponents();
    }

    // Inject updated HTML into the preview window
    try {
      const appContentElement = this.previewWindowRef.document.querySelector('.app-content');
      if (appContentElement) {
        appContentElement.innerHTML = componentsHtml;
      } else {
        console.error("Could not find .app-content in preview window. Attempting reload.");
        this.previewWindowRef.location.reload(); // Fallback: reload the whole preview
      }
      
      // Update AppBar title as well
      const appBarElement = this.previewWindowRef.document.querySelector('.app-bar');
      if (appBarElement) {
         for(let node of appBarElement.childNodes) {
             if(node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                 node.textContent = ` ${currentScreen?.name || app.name}`;
                 break;
             }
         }
      }
    } catch (e) {
      console.error("Error updating preview window content:", e);
      this.previewWindowRef = null; // Assume it's dead
      this.notificationManager.showNotification('Preview connection lost. Please reopen.', 'error');
    }
  }

  generatePreviewHtml() {
    const app = this.editorView.currentApp;
    const currentScreen = this.editorView.currentScreen; // Use the actually selected screen
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // --- Generate components HTML from the current screen ---
    let componentsHtml = '';
    if (currentScreen && currentScreen.components && currentScreen.components.length > 0) {
      // Filter top-level components (those not children of other components)
      // Basic assumption: render components sequentially for now. More complex layout needs parent handling.
      const componentMap = new Map(currentScreen.components.map(c => [c.id, c]));
      const allChildIds = new Set(currentScreen.components.flatMap(c => c.children || []));
      const topLevelComponents = currentScreen.components.filter(c => !allChildIds.has(c.id));

      componentsHtml = topLevelComponents.map(comp => this.generateComponentHtml(comp, componentMap)).join('');

    } else {
      // Keep demo components as a fallback if the screen is truly empty
      componentsHtml = this.generateDemoComponents();
    }
    // --- End Component Generation ---

    // --- Get Generated Code from Blocks --- 
    let generatedJs = '// No blocks code generated';
    try {
        if (this.editorView.blocksManager) {
            const code = this.editorView.blocksManager.getGeneratedCode();
            if (code) {
                generatedJs = `
// --- Start Generated Code --- 
${code}
// --- End Generated Code --- 
`;
            }
        }
    } catch (err) {
        console.error("Error getting generated code for preview:", err);
        generatedJs = '// Error loading blocks code.';
    }
    // --- End Get Generated Code ---

    // Create complete HTML for the preview window
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${app.name} - Preview</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Roboto', sans-serif;
    }
    
    body {
      background-color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .android-device {
      width: 360px;
      height: 740px;
      background: #111;
      border-radius: 36px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      border: 8px solid #222;
    }
    
    .device-screen {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      bottom: 12px;
      background: white;
      overflow: hidden;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
    }
    
    .status-bar {
      height: 24px;
      background-color: ${app.customColors?.colorPrimaryDark || '#303F9F'}; /* Use Optional Chaining */
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      color: white;
      font-size: 12px;
    }
    
    .status-bar-icons {
      display: flex;
      gap: 4px;
    }
    
    .status-bar i {
      font-size: 14px;
    }
    
    .app-bar {
      height: 56px;
      background-color: ${app.customColors?.colorPrimary || '#3F51B5'}; /* Use Optional Chaining */
      color: white;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 20px;
      font-weight: 500;
    }
    
    .app-bar i {
      margin-right: 32px;
    }
    
    .app-content {
      flex: 1;
      background-color: #f5f5f5; /* Default background */
      overflow-y: auto;
      position: relative; /* Needed for potential absolute positioning within components */
      /* Removed padding: 16px; Let components handle their own padding/margins */
    }
    
    .navigation-bar {
      height: 48px;
      background-color: #fff;
      display: flex;
      justify-content: space-around;
      align-items: center;
      border-top: 1px solid #ddd;
    }
    
    .nav-button {
      color: #757575;
    }
    
    .nav-button.home {
      color: #212121;
    }
    
    /* Component styles */
    .component {
      /* Removed margin-bottom: 16px; Use component-specific margins */
      box-sizing: border-box; /* Ensure padding/border are included in width/height */
    }
    
    .button {
      background-color: ${app.customColors?.colorAccent || '#2196F3'}; /* Use Optional Chaining */
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      border: none;
      font-weight: 500;
      text-transform: uppercase;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      margin: 8px 0;
      display: inline-block;
      word-wrap: break-word; /* Break long words */
    }
    
    .text-view {
      margin: 8px 0;
      color: #212121;
      line-height: 1.5;
      white-space: pre-wrap; /* Allow wrapping */
      word-wrap: break-word; /* Break long words */
    }
    
    .text-view.heading {
      font-size: 24px;
      font-weight: 500;
      margin: 16px 0 8px 0;
      width: 100%; /* Default width */
    }
    
    .text-view.subheading {
      font-size: 18px;
      font-weight: 400;
      color: #424242;
      margin: 8px 0;
    }
    
    .edit-text {
      border: none;
      border-bottom: 1px solid #BDBDBD;
      padding: 12px 0 8px 0;
      margin: 8px 0 24px 0;
      width: 100%;
      font-size: 16px;
      background-color: transparent;
    }
    
    .edit-text:focus {
      border-bottom: 2px solid ${app.customColors?.colorAccent || '#2196F3'}; /* Use Optional Chaining */
      outline: none;
    }
    
    .edit-text::placeholder {
      color: #9E9E9E;
    }
    
    .image-view {
      width: 100%;
      height: 200px;
      background-color: #E0E0E0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 8px 0;
      border-radius: 4px;
      overflow: hidden;
      color: #9E9E9E;
    }
    
    .image-view i {
      font-size: 64px;
      color: #9E9E9E;
    }
    
    .checkbox, .radio-button {
      display: flex;
      align-items: center;
      margin: 8px 0;
    }
    
    .checkbox i, .radio-button i {
      margin-right: 8px;
      color: ${app.customColors?.colorAccent || '#2196F3'}; /* Use Optional Chaining */
    }
    
    .spinner {
      width: 100%; /* Default width */
      padding: 12px 0;
      margin: 8px 0;
      border-bottom: 1px solid #BDBDBD;
    }
    
    .list-view {
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      overflow: hidden;
      /* margin: 8px 0; Use component margin */
      width: 100%; /* Default width */
    }
    
    .list-item {
      padding: 16px;
      border-bottom: 1px solid #EEEEEE;
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .card-view {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
      /* margin: 16px 0; Use component margin */
      width: 100%; /* Default width */
    }
    
    .card-content {
      padding: 16px;
    }
    
    .linear-layout {
      display: flex;
      /* Default to column */
      flex-direction: column;
      width: 100%; /* Default width for layouts */
      /* Removed box-sizing - component class handles it */
    }
    
    .linear-layout.horizontal {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      z-index: 1000;
      font-size: 14px;
    }
    
    /* Basic component styles - to be expanded */
    .component-linearlayout-h, .component-linearlayout-v {
        display: flex;
        width: 100%; /* Default for now */
    }
    .component-linearlayout-h { flex-direction: row; }
    .component-linearlayout-v { flex-direction: column; }
    
    .component-textview { 
        white-space: pre-wrap; /* Respect newlines */
        word-wrap: break-word; /* Wrap long words */
    }
    
    .component-button {
        /* Use accent color defined above */
        background-color: ${app.customColors?.colorAccent || '#2196F3'};
        color: white;
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        text-align: center;
    }
    
    .component-edittext {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 100%; /* Default */
    }
    
    .component-imageview {
        display: block; /* Prevents extra space below */
        max-width: 100%;
        height: auto;
    }
    
    .component-checkbox, .component-radiobutton, .component-switch {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px; /* Basic spacing */
    }
    .component-checkbox input, .component-radiobutton input {
         margin-right: 5px;
    }

    /* Add more component styles here */

  </style>
</head>
<body>
  <div class="android-device">
    <div class="device-screen">
      <div class="status-bar">
        <span>${currentTime}</span>
        <div class="status-bar-icons">
          <i class="material-icons">signal_cellular_alt</i>
          <i class="material-icons">wifi</i>
          <i class="material-icons">battery_full</i>
        </div>
      </div>
      <div class="app-bar">
        <i class="material-icons">menu</i> ${currentScreen?.name || app.name}
      </div>
      <div class="app-content">
        ${componentsHtml}
      </div>
      <div class="navigation-bar">
        <i class="material-icons nav-button">arrow_back_ios</i>
        <i class="material-icons nav-button home">radio_button_unchecked</i>
        <i class="material-icons nav-button">check_box_outline_blank</i>
      </div>
    </div>
  </div>
  
  <!-- Inject the generated JavaScript -->
  <script>
    // Helper function for toasts (if not provided by blocks code)
    function showToast(message, duration = 3000) {
        console.log("Toast:", message); // Basic console log toast
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0,0,0,0.7)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1000';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { document.body.removeChild(toast); }, duration);
    }
    
    // Add basic component interaction helpers (can be called by generated code)
    const componentApi = {
        setText: (id, text) => {
            const element = document.getElementById(id);
            if (element) { 
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') element.value = text;
                else element.textContent = text; 
            }
        },
        getText: (id) => {
            const element = document.getElementById(id);
            if (element) { 
                return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? element.value : element.textContent;
            } 
            return '';
        },
        // Add more API functions here (e.g., setVisibility, setEnabled, etc.)
    };

    // --- Sketchware API Runtime Environment ---
    const sketchware_events = {
        onAppStart: (callback) => {
            // Execute app start event immediately
            if (callback) setTimeout(callback, 100);
        },
        onScreenCreated: (callback) => {
            // Execute screen created event after DOM is ready
            if (callback) document.addEventListener('DOMContentLoaded', callback);
        },
        onButtonClick: (buttonId, callback) => {
            // Add click listener to the button when DOM is ready
            if (!buttonId || !callback) return;
    document.addEventListener('DOMContentLoaded', () => {
                const button = document.getElementById(buttonId);
                if (button) button.addEventListener('click', callback);
            });
        }
    };
    
    // Helper functions for component properties
    function sketchware_setProp(componentId, propName, value) {
        if (!componentId || !propName) return;
        const element = document.getElementById(componentId);
        if (!element) {
            console.warn("Component not found: " + componentId);
            return;
        }
        
        switch(propName) {
            case 'text':
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') 
                    element.value = value;
                else 
                    element.textContent = value;
                break;
            case 'backgroundColor':
                element.style.backgroundColor = value;
                break;
            case 'textColor':
                element.style.color = value;
                break;
            case 'visibility':
                element.style.display = value === 'gone' ? 'none' : 
                                       (value === 'invisible' ? 'hidden' : 'block');
                break;
            case 'enabled':
                if (element.tagName === 'BUTTON' || element.tagName === 'INPUT')
                    element.disabled = !value;
                break;
            // Add more property handlers as needed
            default:
                console.warn("Property not implemented: " + propName);
        }
    }
    
    function sketchware_getProp(componentId, propName) {
        if (!componentId || !propName) return null;
        const element = document.getElementById(componentId);
        if (!element) {
            console.warn("Component not found: " + componentId);
            return null;
        }
        
        switch(propName) {
            case 'text':
                return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? 
                    element.value : element.textContent;
            case 'backgroundColor':
                return getComputedStyle(element).backgroundColor;
            case 'textColor':
                return getComputedStyle(element).color;
            case 'visibility':
                const display = getComputedStyle(element).display;
                return display === 'none' ? 'gone' : 'visible';
            case 'enabled':
                return !(element.disabled);
            // Add more property handlers as needed
            default:
                console.warn("Property getter not implemented: " + propName);
                return null;
        }
    }
    
    function sketchware_showToast(message) {
        showToast(message);
    }
    // --- End Sketchware API ---

    // Execute the generated code within a try-catch block
    try {
      ${generatedJs}
    } catch (e) {
      console.error("Error executing generated code:", e);
      alert("Error in generated code: " + e.message);
    }
  </script>
</body>
</html>`;
  }
  
  generateComponentHtml(component, componentMap) {
    if (!component) return '';
    
    const props = component.properties || {};
    let style = '';
    let classes = `component component-${component.type}`;
    let childrenHtml = '';
    let attributes = `id="${component.id}"`; // Crucial for targeting with JS
    let elementContent = '';

    // 1. Generate Style String from Properties
    // Layout Params (Width/Height)
    const layoutWidth = props.layout_width || 'wrap_content';
    const layoutHeight = props.layout_height || 'wrap_content';
    if (layoutWidth === 'match_parent') style += 'width: 100%;';
    else if (layoutWidth === 'wrap_content') style += 'width: auto; display: inline-block;'; // Or use flexbox sizing
    else if (layoutWidth) style += `width: ${layoutWidth}px;`; // Assuming numeric value is px

    if (layoutHeight === 'match_parent') style += 'height: 100%;'; // Needs parent context
    else if (layoutHeight === 'wrap_content') style += 'height: auto;';
    else if (layoutHeight) style += `height: ${layoutHeight}px;`;

    // Margins (Example - needs parsing of margin property)
    if (props.layout_margin) { 
        const margin = parseInt(props.layout_margin) || 0;
        style += `margin: ${margin}px;`; 
    }
    // Padding (Example)
    if (props.padding) { 
        const padding = parseInt(props.padding) || 0;
        style += `padding: ${padding}px;`; 
    }
    
    // Background Color
    if (props.backgroundColor) style += `background-color: ${props.backgroundColor};`;
    
    // Text Properties (for relevant components)
    if (props.text) elementContent = props.text; // Default content is text prop
    if (props.textColor) style += `color: ${props.textColor};`;
    if (props.textSize) style += `font-size: ${props.textSize}px;`; // Assuming px
    // Add alignment, style (bold, italic) later

    // 2. Handle Children (if layout component)
    if (component.children && component.children.length > 0) {
        childrenHtml = component.children
            .map(childId => componentMap.get(childId))
            .filter(child => child) // Filter out potential undefined children
            .map(child => this.generateComponentHtml(child, componentMap))
            .join('');

        // Apply layout-specific styles (Flexbox for LinearLayout)
        if (component.type === 'linearlayout-v') {
            style += 'display: flex; flex-direction: column;';
            // Add gravity/alignment later
        }
        if (component.type === 'linearlayout-h') {
            style += 'display: flex; flex-direction: row;';
             // Add gravity/alignment later
        }
    }
    
    // 3. Generate Specific Element HTML
    let html = '';
    switch (component.type) {
      case 'linearlayout-h':
      case 'linearlayout-v':
      case 'scrollview-h': // Basic ScrollView - needs overflow style
      case 'scrollview-v':
          style += component.type.includes('scroll') ? ' overflow: auto;': '';
          html = `<div ${attributes} class="${classes}" style="${style}">${childrenHtml}</div>`;
          break;
      case 'textview':
          html = `<div ${attributes} class="${classes}" style="${style}">${elementContent}</div>`;
          break;
      case 'button':
          // Button uses <button> tag
          html = `<button ${attributes} class="${classes}" style="${style}">${elementContent}</button>`;
          break;
      case 'edittext':
          // EditText uses <input> or <textarea>
          attributes += ` placeholder="${props.hint || ''}"`;
          html = `<input type="text" ${attributes} class="${classes}" style="${style}" value="${elementContent}">`;
          // Add multiline support later (<textarea>)
          break;
      case 'imageview':
          // ImageView uses <img> tag
          attributes += ` src="${props.src || ''}" alt="${props.contentDescription || 'Image'}"`;
          html = `<img ${attributes} class="${classes}" style="${style}">`;
          break;
      case 'checkbox':
          attributes += props.checked ? ' checked' : '';
          html = `<div class="${classes}" style="${style}"><label><input type="checkbox" ${attributes}> ${elementContent}</label></div>`;
          break;
      // Add other component types (RadioButton, Switch, ProgressBar, Spinner, etc.) here
      default:
          html = `<div ${attributes} class="${classes} component-unknown" style="${style}">[${component.type}] ${elementContent}${childrenHtml}</div>`;
    }

    return html;
  }
  
  generateDemoComponents() {
    // Generate sample components for the app preview
    const app = this.editorView.currentApp; // Need app context for styles
    return `
      <div class="card-view">
        <div class="card-content">
          <div class="text-view heading">${app?.name || 'App Name'}</div>
          <div class="text-view">Welcome to your app preview. This is a simulated Android environment to preview your app's UI.</div>
        </div>
      </div>
      
      <div class="text-view heading">Sample Components</div>
      
      <div class="text-view">This is a TextView component. You can use it to display text in your app.</div>
      
      <input type="text" class="edit-text" placeholder="This is an EditText component">
      
      <div class="linear-layout horizontal">
        <button class="button">Button 1</button>
        <button class="button" style="background-color: #4CAF50;">Button 2</button>
      </div>
      
      <div class="image-view">
        <i class="material-icons">photo</i>
      </div>
      
      <div class="checkbox"><i class="material-icons">check_box</i>Option 1 (Checked)</div>
      <div class="checkbox"><i class="material-icons">check_box_outline_blank</i>Option 2</div>
      
      <div class="radio-button"><i class="material-icons">radio_button_checked</i>Option A (Selected)</div>
      <div class="radio-button"><i class="material-icons">radio_button_unchecked</i>Option B</div>
      
      <div class="text-view subheading">ListView Example:</div>
      <div class="list-view">
        <div class="list-item">List Item 1</div>
        <div class="list-item">List Item 2</div>
        <div class="list-item">List Item 3</div>
      </div>
    `;
  }
}

export default PreviewManager; 