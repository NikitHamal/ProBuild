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
    const currentScreen = this.editorView.currentScreen;

    // --- Generate components HTML from the current screen ---
    let componentsHtml = '';
    if (currentScreen && currentScreen.components && currentScreen.components.length > 0) {
      const componentMap = new Map(currentScreen.components.map(c => [c.id, c]));
      const allChildIds = new Set(currentScreen.components.flatMap(c => c.children || []));
      const topLevelComponents = currentScreen.components.filter(c => !allChildIds.has(c.id));
      // Pass true to indicate these are top-level for potential root styling
      componentsHtml = topLevelComponents.map(comp => this.generateComponentHtml(comp, componentMap, true)).join(''); 
    } else {
      componentsHtml = '<div style="padding: 20px; text-align: center; color: #777;">Screen is empty. Add components in the Design tab.</div>'; // Simple empty message
    }
    // --- End Component Generation ---

    // --- Get Generated Code from Blocks --- 
    let generatedJs = '// No blocks code generated for preview.';
    // Optionally include block code if needed for simple interactions, but avoid complex simulation for now.
    /* 
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
    */
    // --- End Get Generated Code ---

    // --- Simplified HTML structure ---
    // Removed Android device frame, status bar, app bar, navigation bar.
    // Removed default component styles - styling will be inline via generateComponentHtml.
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${app.name} - Preview</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    /* Basic reset and body styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Roboto', sans-serif;
      background-color: #f0f0f0; /* Light background for the preview page itself */
      height: 100vh;
      /* Use flexbox to potentially center the content if needed, or just let it fill */
      /* display: flex; 
         justify-content: center; 
         align-items: flex-start; */ 
    }
    /* The main container for the app's visual elements */
    .app-content-container {
        width: 100%; /* Or match device width from editor? */
        max-width: 400px; /* Limit width for phone-like view */
        height: 100%; /* Or match device height from editor? */
        max-height: 800px; /* Limit height */
        background-color: ${currentScreen?.properties?.backgroundColor || 'white'}; /* Use screen background */
        border: 1px solid #ccc; /* Simple border */
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* Subtle shadow */
        margin: 20px auto; /* Center the container on the page */
        overflow: hidden; /* Prevent content spillover */
        position: relative; /* Context for absolute positioning if needed */
        display: flex; /* Default to flex container for top-level components */
        flex-direction: column; /* Default direction */
    }
    
    /* Minimal styles for basic elements if needed, but prefer inline */
    img {
        display: block; /* Prevent extra space below images */
        max-width: 100%; /* Prevent images from overflowing */
    }
    button {
        cursor: pointer;
    }
    
    /* Add specific styles for scrollviews */
    .component-scrollview-v,
    .component-scrollview-h {
        overflow: auto;
    }
    
  </style>
</head>
<body>
  <div class="app-content-container" id="app-root">
    ${componentsHtml}
  </div>
  
  <script>
    // Minimal JS, maybe for block code execution if re-enabled.
    // Avoid complex simulation code.
    ${generatedJs}
  </script>
</body>
</html>`;
  }
  
  generateComponentHtml(component, componentMap, isTopLevel = false) {
    if (!component) return '';
    
    const props = component.properties || {};
    let style = 'box-sizing: border-box; '; // Base style
    let classes = `component component-${component.type}`;
    let childrenHtml = '';
    let attributes = `id="${component.id}"`;
    let elementContent = props.text || ''; // Default content is text prop

    // --- Style Generation --- 

    // 1. Layout Parameters (Width/Height)
    const layoutWidth = props.layout_width || 'wrap_content';
    const layoutHeight = props.layout_height || 'wrap_content';
    
    if (layoutWidth === 'match_parent') style += 'width: 100%;';
    else if (layoutWidth === 'wrap_content') style += 'width: auto;';
    else if (layoutWidth) style += `width: ${this.parseSize(layoutWidth)};`;

    if (layoutHeight === 'match_parent') style += 'height: 100%;';
    else if (layoutHeight === 'wrap_content') style += 'height: auto;';
    else if (layoutHeight) style += `height: ${this.parseSize(layoutHeight)};`;

    // 2. Margins & Padding
    // Basic parsing - assumes single value or needs enhancement for individual sides
    if (props.layout_margin) style += `margin: ${this.parseSize(props.layout_margin)};`;
    if (props.padding) style += `padding: ${this.parseSize(props.padding)};`;
    // TODO: Add support for layout_marginLeft, paddingStart, etc.

    // 3. Background & Foreground Color
    if (props.backgroundColor) style += `background-color: ${props.backgroundColor};`;
    if (props.textColor) style += `color: ${props.textColor};`;

    // 4. Text Properties
    if (props.textSize) style += `font-size: ${this.parseSize(props.textSize)};`;
    if (props.textStyle) {
      if (props.textStyle.includes('bold')) style += 'font-weight: bold; ';
      if (props.textStyle.includes('italic')) style += 'font-style: italic; ';
    }
    if (props.textAlignment) { // Basic mapping
        const alignMap = { 'left': 'start', 'center': 'center', 'right': 'end' };
        style += `text-align: ${alignMap[props.textAlignment] || 'start'};`;
    }
    style += 'white-space: pre-wrap; word-wrap: break-word; '; // Common text wrapping

    // 5. Visibility
    if (props.visibility === 'gone') style += 'display: none; ';
    if (props.visibility === 'invisible') style += 'visibility: hidden; ';
    
    // --- Layout Specific Styles (Flexbox) --- 
    if (component.type.startsWith('linearlayout') || isTopLevel) {
        style += 'display: flex; ';
        style += `flex-direction: ${component.type.includes('-h') ? 'row' : 'column'}; `;
        
        // Gravity (Align Items / Justify Content)
        const gravity = props.gravity || 'top|start'; // Default if not set
        const [verticalGravity, horizontalGravity] = gravity.split('|');
        
        // Map Android gravity to CSS Flexbox properties
        const alignMap = { 'top': 'flex-start', 'center_vertical': 'center', 'bottom': 'flex-end', 'fill_vertical': 'stretch' };
        const justifyMap = { 'start': 'flex-start', 'center_horizontal': 'center', 'end': 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around' };

        if (component.type.includes('-v')) { // Vertical LinearLayout
            style += `align-items: ${justifyMap[horizontalGravity] || 'flex-start'}; `;
            style += `justify-content: ${alignMap[verticalGravity] || 'flex-start'}; `;
        } else { // Horizontal LinearLayout
            style += `align-items: ${alignMap[verticalGravity] || 'flex-start'}; `;
            style += `justify-content: ${justifyMap[horizontalGravity] || 'flex-start'}; `;
        }
    }

    // --- Child Layout Properties (Applied to the child element's style) ---
    // These are set by the PARENT layout
    if (props.layout_gravity) { // Gravity of this component within its parent
        const [vg, hg] = (props.layout_gravity || 'top|start').split('|');
        const alignSelfMap = {
            'top': 'flex-start', 'center_vertical': 'center', 'bottom': 'flex-end', 'fill_vertical': 'stretch',
            'start': 'flex-start', 'center_horizontal': 'center', 'end': 'flex-end', 'fill_horizontal': 'stretch'
        };
        // Note: align-self depends on the parent's flex-direction
        // This simplified version might need adjustment based on parent type
        style += `align-self: ${alignSelfMap[vg] || alignSelfMap[hg] || 'auto'}; `;
        if (props.layout_gravity.includes('center')) style += 'margin-left: auto; margin-right: auto; '; // Basic centering helper
    }
    if (props.layout_weight && parseFloat(props.layout_weight) > 0) {
        style += `flex-grow: ${props.layout_weight}; flex-basis: 0; `; // Allow growing
    }
    
    // --- Handle Children Recursively --- 
    if (component.children && component.children.length > 0) {
        childrenHtml = component.children
            .map(childId => componentMap.get(childId))
            .filter(child => child)
            .map(child => this.generateComponentHtml(child, componentMap)) // isTopLevel is false for children
            .join('');
    }
    
    // --- Generate Specific Element HTML --- 
    let html = '';
    switch (component.type) {
      case 'linearlayout-h':
      case 'linearlayout-v':
      case 'scrollview-h':
      case 'scrollview-v':
          html = `<div ${attributes} class="${classes}" style="${style}">${childrenHtml}</div>`;
          break;
      case 'textview':
          html = `<div ${attributes} class="${classes}" style="${style}">${elementContent}</div>`;
          break;
      case 'button':
          attributes += props.enabled === false ? ' disabled' : '';
          style += 'appearance: button; -webkit-appearance: button; '; // Basic button appearance
          html = `<button ${attributes} class="${classes}" style="${style}">${elementContent}</button>`;
          break;
      case 'edittext':
          attributes += ` placeholder="${props.hint || ''}"`;
          attributes += props.enabled === false ? ' disabled' : '';
          if (props.inputType === 'textMultiLine') {
             html = `<textarea ${attributes} class="${classes}" style="${style} resize: vertical;">${elementContent}</textarea>`;
          } else {
             html = `<input type="${this.mapInputType(props.inputType)}" ${attributes} class="${classes}" style="${style}" value="${elementContent}">`;
          }
          break;
      case 'imageview':
          attributes += ` src="${props.src || 'img/placeholder.png'}" alt="${props.contentDescription || 'Image'}"`; // Use placeholder
          // Map scaleType to object-fit
          const scaleTypeMap = { 'fitXY': 'fill', 'fitStart': 'contain', 'fitCenter': 'contain', 'fitEnd': 'contain', 'center': 'none', 'centerCrop': 'cover', 'centerInside': 'contain' };
          style += `object-fit: ${scaleTypeMap[props.scaleType || 'fitCenter'] || 'contain'}; `; 
          if (props.scaleType === 'center' || props.scaleType === 'centerInside') style += 'object-position: center center; ';
          // Ensure images don't exceed bounds by default if size is wrap_content
          if (layoutWidth === 'wrap_content' || layoutHeight === 'wrap_content') {
              style += 'max-width: 100%; max-height: 100%; ';
          }
          html = `<img ${attributes} class="${classes}" style="${style}">`;
          break;
      case 'checkbox':
          attributes += props.checked ? ' checked' : '';
          attributes += props.enabled === false ? ' disabled' : '';
          // Wrap in a label for better click handling
          html = `<div class="${classes}-container" style="display: flex; align-items: center; ${style}">
                    <input type="checkbox" ${attributes} style="margin-right: 8px;">
                    <label for="${component.id}">${elementContent}</label>
                  </div>`; // Note: label `for` needs input id if we want that connection
          break;
      case 'switch': // Basic switch rendering
          attributes += props.checked ? ' checked' : '';
          attributes += props.enabled === false ? ' disabled' : '';
          html = `<div class="${classes}-container" style="display: flex; align-items: center; justify-content: space-between; ${style}">
                    <span>${elementContent}</span>
                    <input type="checkbox" role="switch" ${attributes}>
                  </div>`; 
          break;
      // Add other component types here (ProgressBar, Spinner, etc.)
      default:
          html = `<div ${attributes} class="${classes} component-unknown" style="border: 1px dashed red; padding: 5px; ${style}">[${component.type}] ${elementContent}${childrenHtml}</div>`;
    }

    return html;
  }
  
  // Helper to parse size values (e.g., "16dp", "16px", "16")
  parseSize(value) {
      if (typeof value === 'number') return `${value}px`;
      if (typeof value === 'string') {
          if (value.endsWith('dp') || value.endsWith('dip')) {
              return `${parseInt(value)}px`; // Basic 1:1 mapping for preview
          }
          if (value.endsWith('px')) {
              return value;
          }
          if (!isNaN(value)) { // If it's just a number string
              return `${value}px`;
          }
      }
      return value; // Return original if not parseable
  }
  
  // Helper to map Android input types to HTML types
  mapInputType(inputType) {
      switch (inputType) {
          case 'textPassword': return 'password';
          case 'numberPassword': return 'password'; // No direct numeric password type
          case 'number': return 'number';
          case 'numberSigned': return 'number';
          case 'numberDecimal': return 'number'; // Step attribute could be added
          case 'phone': return 'tel';
          case 'textEmailAddress': return 'email';
          case 'textUri': return 'url';
          default: return 'text';
      }
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