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
  </style>
</head>
<body>
  <div class="android-device">
    <div class="device-screen">
      <div class="status-bar">
        <div class="status-time">${currentTime}</div>
        <div class="status-bar-icons">
          <i class="material-icons">signal_cellular_alt</i>
          <i class="material-icons">wifi</i>
          <i class="material-icons">battery_full</i>
        </div>
      </div>
      
      <div class="app-bar">
        <i class="material-icons">menu</i>
        ${currentScreen?.name || app.name}
      </div>
      
      <div class="app-content">
        ${componentsHtml}
      </div>
      
      <div class="navigation-bar">
        <i class="material-icons nav-button">arrow_back</i>
        <i class="material-icons nav-button home">home</i>
        <i class="material-icons nav-button">apps</i>
      </div>
    </div>
  </div>
  
  <script>
    // Add interactivity to the preview
    document.addEventListener('DOMContentLoaded', () => {
      // Make buttons show toast messages when clicked
      const buttons = document.querySelectorAll('.button');
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          showToast(button.textContent + ' clicked');
        });
      });
      
      // Make menu button show toast
      document.querySelector('.app-bar i').addEventListener('click', () => {
        showToast('Menu opened');
      });
      
      // Make navigation buttons show toast
      document.querySelectorAll('.nav-button').forEach(navButton => {
        navButton.addEventListener('click', () => {
          const action = navButton.classList.contains('home') ? 'Home' : 
                        (navButton.textContent === 'arrow_back' ? 'Back' : 'Recent Apps');
          showToast(action + ' button pressed');
        });
      });
      
      // Show initial toast
      setTimeout(() => {
        showToast('${app.name} preview loaded');
      }, 500);
    });
    
    function showToast(message) {
      // Remove existing toast if any
      const existingToast = document.querySelector('.toast');
      if (existingToast) {
        existingToast.remove();
      }
      
      // Create and add new toast
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      // Auto-remove toast after 3 seconds
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  </script>
</body>
</html>`;
  }
  
  generateComponentHtml(component, componentMap) { // Added componentMap
    if (!component || !component.type) return '';
    
    // Ensure properties exist and provide defaults
    const props = component.properties || {};

    // --- Style Generation ---
    // More accurately reflect common properties
    let style = `
      position: absolute;
      left: ${props.x || 0}px;
      top: ${props.y || 0}px;
      width: ${props.width ? (props.width === 'match_parent' ? '100%' : (props.width === 'wrap_content' ? 'auto' : props.width + 'px')) : 'auto'};
      height: ${props.height ? (props.height === 'match_parent' ? '100%' : (props.height === 'wrap_content' ? 'auto' : props.height + 'px')) : 'auto'};
      margin: ${props.margin || 0}px; /* Use component margin */
      padding: ${props.padding || 0}px; /* Use component padding */
      background-color: ${props.bgColor || 'transparent'};
      border-radius: ${props.borderRadius || '0px'};
      border: ${props.borderWidth || 0}px solid ${props.borderColor || 'transparent'};
      box-shadow: ${props.boxShadow || 'none'};
      font-size: ${props.textSize || 14}px;
      color: ${props.textColor || '#212121'}; /* Default to dark text */
      text-align: ${props.textAlign || 'left'};
      /* Add more style properties as needed */
      ${props.weight ? `font-weight: ${props.weight};` : ''}
      ${props.visibility === 'gone' ? 'display: none;' : (props.visibility === 'invisible' ? 'visibility: hidden;' : '')}
    `;

    // --- Handle Layout Specifics ---
    // Note: This is a basic interpretation. Real Android layout is complex.
    // For now, absolute positioning is removed in favor of flow layout + specific layout styles.
    // Add specific layout properties if needed later (e.g., gravity, weight within LinearLayout)

    // --- Generate HTML based on type ---
    let innerHtml = '';
    let baseClass = 'component'; // Base class for all

    switch (component.type) {
      case 'button':
        baseClass = 'button component'; // Use existing button style + base
        innerHtml = props.text || 'Button';
        // Apply specific button styles, prioritizing properties
        const buttonBgColor = (props.bgColor && props.bgColor !== 'transparent') ? props.bgColor : (this.editorView.currentApp.customColors?.colorAccent || '#2196F3');
        const buttonTextColor = props.textColor || 'white'; // Default to white if not specified
        style += `background-color: ${buttonBgColor}; color: ${buttonTextColor}; border: none; text-transform: uppercase; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: inline-block;`;
        return `<button class="${baseClass}" style="${style}">${innerHtml}</button>`;

      case 'textview':
        baseClass = 'text-view component';
        if (props.textSize && props.textSize > 20) {
          baseClass += ' heading'; // Reuse existing heading style if applicable
        } else if (props.textSize && props.textSize > 16) {
          baseClass += ' subheading'; // Reuse existing subheading style
        }
        innerHtml = (props.text || 'Text').replace(/\n/g, '<br>'); // Handle newlines
        style += `line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;`;
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'edittext':
        baseClass = 'edit-text component';
        // Use existing EditText styles + component styles
        style += `border: none; border-bottom: 1px solid #BDBDBD; padding: 12px 0 8px 0; width: 100%; background-color: transparent;`; // Ensure width is handled
        // Add focus style if needed via JS or keep simple for preview
        return `<input type="text" class="${baseClass}" style="${style}" placeholder="${props.hint || 'Enter text here'}" value="${props.text || ''}">`;

      case 'imageview':
        baseClass = 'image-view component';
        // Use existing ImageView styles + component styles
        // Basic placeholder, actual image src would need handling
        innerHtml = `<i class="material-icons" style="font-size: ${Math.min(parseInt(props.width || 64), parseInt(props.height || 64))}px; color: #9E9E9E;">image</i>`;
        style += `display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: #E0E0E0;`;
        // Add src handling if image property exists: style += `background-image: url(${props.src}); background-size: cover; background-position: center;`
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'checkbox':
        baseClass = 'checkbox component';
        innerHtml = `<i class="material-icons" style="margin-right: 8px; color: ${this.editorView.currentApp.customColors?.colorAccent || '#2196F3'};">${props.checked ? 'check_box' : 'check_box_outline_blank'}</i>${props.text || 'Checkbox'}`;
        style += `display: flex; align-items: center;`;
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'radiobutton':
        baseClass = 'radio-button component';
        innerHtml = `<i class="material-icons" style="margin-right: 8px; color: ${this.editorView.currentApp.customColors?.colorAccent || '#2196F3'};">${props.checked ? 'radio_button_checked' : 'radio_button_unchecked'}</i>${props.text || 'Radio Button'}`;
        style += `display: flex; align-items: center;`;
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'spinner':
        baseClass = 'spinner component';
        // Use existing spinner style + component style
        style += `width: 100%; padding: 12px 0; border-bottom: 1px solid #BDBDBD;`;
        innerHtml = `${props.text || 'Dropdown'} <i class="material-icons" style="font-size: 16px; vertical-align: middle;">arrow_drop_down</i>`;
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'listview':
        baseClass = 'list-view component';
        // Use existing listview styles + component style
        innerHtml = ''; // Children would be specific list items, complex to simulate accurately
        for (let i = 0; i < 3; i++) { // Basic placeholder
          innerHtml += `<div class="list-item" style="padding: 16px; border-bottom: 1px solid #EEEEEE;">List Item ${i + 1}</div>`;
        }
        style += `background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); overflow: hidden; width: 100%;`;
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'cardview':
        baseClass = 'card-view component';
        // Use existing cardview styles + component style
        // Render children inside the card content area
        let cardChildrenHtml = component.children ? component.children.map(childId => {
            const childComp = componentMap.get(childId); // Use map for efficiency
            return this.generateComponentHtml(childComp, componentMap);
          }).join('') : '';
        innerHtml = `<div class="card-content" style="padding: ${props.cardPadding || 16}px;">${cardChildrenHtml || this.generateDemoComponents()}</div>`; // Fallback demo if no children
        style += `background: white; border-radius: ${props.cardCornerRadius || 4}px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; width: 100%;`;
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'linearlayout-v':
      case 'linearlayout-h':
        baseClass = 'linear-layout component';
        const direction = component.type === 'linearlayout-h' ? 'row' : 'column';
        style += `display: flex; flex-direction: ${direction};`;
        if (direction === 'row') {
          style += `align-items: ${props.alignItems || 'flex-start'}; flex-wrap: wrap; gap: 8px;`; // Basic horizontal layout
        } else {
           style += `align-items: ${props.alignItems || 'stretch'};`; // Basic vertical layout
        }
        // Render children
        innerHtml = component.children ? component.children.map(childId => {
            const childComp = componentMap.get(childId); // Use map
            return this.generateComponentHtml(childComp, componentMap);
          }).join('') : '';
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      // Add cases for ScrollView (H/V) - needs overflow styles
      case 'scrollview-v':
        baseClass = 'scrollview-v component';
        style += `overflow-y: auto; overflow-x: hidden; height: ${props.height ? props.height + 'px' : '200px'};`; // Default height or specified
         innerHtml = component.children ? component.children.map(childId => {
            const childComp = componentMap.get(childId);
            // Wrap children in a container div if there's more than one, or if the child isn't a layout itself.
            // Note: ScrollView in Android expects *one* direct child, usually a LinearLayout.
            return this.generateComponentHtml(childComp, componentMap);
          }).join('') : '';
         // Simple approach: just render children sequentially inside. Proper Android behavior needs one child layout.
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      case 'scrollview-h':
         baseClass = 'scrollview-h component';
         style += `overflow-x: auto; overflow-y: hidden; width: ${props.width ? props.width + 'px' : '100%'}; display: flex; flex-direction: row;`; // Use flex for horizontal scroll
         innerHtml = component.children ? component.children.map(childId => {
            const childComp = componentMap.get(childId);
             // Children should likely have fixed widths or wrap_content for horizontal scrolling
             let childStyle = 'flex-shrink: 0; '; // Prevent shrinking
             const childHtml = this.generateComponentHtml(childComp, componentMap);
             // A bit hacky: inject style into the child element string if possible
             if (childHtml.startsWith('<div')) {
                return childHtml.replace('<div', `<div style="${childStyle}"`);
             } else if (childHtml.startsWith('<button')) {
                 return childHtml.replace('<button', `<button style="${childStyle}"`);
             } // etc. for other tags
             return childHtml; // Return as is if cannot inject style easily
          }).join('') : '';
        return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      // Add other component types (Switch, ProgressBar, SeekBar, WebView etc.) here
      // For complex ones like WebView, just a placeholder might be sufficient for preview
      case 'webview':
          baseClass = 'webview component';
          style += 'border: 1px dashed #ccc; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; text-align: center; color: #666;';
          innerHtml = 'WebView Placeholder<br>(Content loads in actual app)';
          return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

       case 'switch':
            baseClass = 'switch component';
            // Basic visual representation
            const switchThumbColor = props.checked ? (this.editorView.currentApp.customColors?.colorAccent || '#2196F3') : '#bdbdbd';
            const switchTrackColor = props.checked ? (this.editorView.currentApp.customColors?.colorAccent || '#2196F3') + '80' : '#ccc'; // Semi-transparent accent or grey
            innerHtml = `
                <div style="display: flex; align-items: center;">
                    <span style="margin-right: 8px;">${props.text || 'Switch'}</span>
                    <div style="width: 36px; height: 20px; background-color: ${switchTrackColor}; border-radius: 10px; position: relative; cursor: pointer;">
                        <div style="width: 16px; height: 16px; background-color: ${switchThumbColor}; border-radius: 50%; position: absolute; top: 2px; left: ${props.checked ? '18px' : '2px'}; transition: left 0.2s;"></div>
                    </div>
                </div>`;
            return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

        case 'progressbar':
             baseClass = 'progressbar component';
             const progress = props.progress || 50; // Default 50%
             const progressBg = this.editorView.currentApp.customColors?.colorAccent || '#2196F3';
             style += 'height: 4px; background-color: #e0e0e0; border-radius: 2px; overflow: hidden; width: 100%;';
             innerHtml = `<div style="width: ${progress}%; height: 100%; background-color: ${progressBg};"></div>`;
             return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

       case 'seekbar':
             baseClass = 'seekbar component';
             const seekProgress = props.progress || 30; // Default 30%
             const seekBg = this.editorView.currentApp.customColors?.colorAccent || '#2196F3';
             style += 'width: 100%; height: 20px; display: flex; align-items: center; cursor: pointer;';
             innerHtml = `
                <div style="flex-grow: 1; height: 4px; background-color: #e0e0e0; border-radius: 2px; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${seekProgress}%; background-color: ${seekBg}; border-radius: 2px;"></div>
                    <div style="position: absolute; top: -6px; left: ${seekProgress}%; transform: translateX(-50%); width: 16px; height: 16px; background-color: ${seekBg}; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                </div>`;
             return `<div class="${baseClass}" style="${style}">${innerHtml}</div>`;

      default:
        // Fallback for unknown types
        return `<div class="component" style="${style}">Unsupported Component: ${component.type}</div>`;
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