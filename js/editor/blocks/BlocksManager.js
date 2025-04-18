import NotificationManager from '../utils/NotificationManager.js';

// Define the basic toolbox structure directly here or load from XML
const toolboxXml = `
<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
  <category name="Events" colour="%{BKY_LOGIC_HUE}">
    <!-- Add event blocks here -->
    <block type="event_app_starts"></block>
    <block type="event_screen_created"></block>
    <block type="event_button_clicked"></block>
  </category>
  <category name="Control" colour="%{BKY_LOOPS_HUE}">
    <block type="controls_if"></block>
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
    </block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for">
      <value name="FROM">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="TO">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
      <value name="BY">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
    </block>
    <block type="controls_flow_statements"></block>
  </category>
  <category name="Logic" colour="%{BKY_LOGIC_HUE}">
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
    <block type="logic_null"></block>
    <block type="logic_ternary"></block>
  </category>
  <category name="Math" colour="%{BKY_MATH_HUE}">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
    <block type="math_single"></block>
    <block type="math_trig"></block>
    <block type="math_constant"></block>
    <block type="math_number_property"></block>
    <block type="math_round"></block>
    <block type="math_on_list"></block>
    <block type="math_modulo"></block>
    <block type="math_constrain">
      <value name="LOW">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="HIGH">
        <shadow type="math_number">
          <field name="NUM">100</field>
        </shadow>
      </value>
    </block>
    <block type="math_random_int">
      <value name="FROM">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="TO">
        <shadow type="math_number">
          <field name="NUM">100</field>
        </shadow>
      </value>
    </block>
    <block type="math_random_float"></block>
  </category>
  <category name="Text" colour="%{BKY_TEXTS_HUE}">
    <block type="text"></block>
    <block type="text_join"></block>
    <block type="text_append">
      <value name="TEXT">
        <shadow type="text"></shadow>
      </value>
    </block>
    <block type="text_length"></block>
    <block type="text_isEmpty"></block>
    <block type="text_indexOf">
      <value name="VALUE">
        <shadow type="text"></shadow>
      </value>
    </block>
    <block type="text_charAt">
      <value name="VALUE">
        <shadow type="text"></shadow>
      </value>
    </block>
    <block type="text_getSubstring"></block>
    <block type="text_changeCase"></block>
    <block type="text_trim"></block>
    <block type="text_print">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
    <block type="text_prompt_ext">
       <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
  </category>
  <category name="Lists" colour="%{BKY_LISTS_HUE}">
    <block type="lists_create_with">
      <mutation items="0"></mutation>
    </block>
    <block type="lists_create_with"></block>
    <block type="lists_repeat">
      <value name="NUM">
        <shadow type="math_number">
          <field name="NUM">5</field>
        </shadow>
      </value>
    </block>
    <block type="lists_length"></block>
    <block type="lists_isEmpty"></block>
    <block type="lists_indexOf">
      <value name="VALUE">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_getIndex">
      <value name="VALUE">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_setIndex">
      <value name="LIST">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_getSublist">
      <value name="LIST">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_split">
      <value name="DELIM">
        <shadow type="text">
          <field name="TEXT">,</field>
        </shadow>
      </value>
    </block>
    <block type="lists_sort"></block>
  </category>
  <sep></sep>
  <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
  <category name="Functions" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"></category>
  <sep></sep>
  <category name="Components" colour="#4a6cd4">
    <!-- Add component-specific blocks here later -->
    <block type="component_set_property"></block>
    <block type="component_get_property"></block>
    <block type="component_show_toast"></block>
  </category>
  <category name="Advanced" colour="#757575">
     <!-- Add advanced blocks here -->
     <block type="advanced_custom_code"></block>
  </category>
</xml>
`;

// --- Custom Block Definitions (Placeholders for now) ---
// Need to define these using Blockly.Blocks['block_name'] = { init: function() { ... } };
// and the corresponding generators Blockly.JavaScript['block_name'] = function(block) { ... };

// REMOVE ALL BLOCK DEFINITIONS FROM HERE ...
/*
Blockly.Blocks['event_app_starts'] = { ... };

Blockly.Blocks['event_screen_created'] = { ... };

Blockly.Blocks['event_button_clicked'] = { ... };

Blockly.Blocks['component_set_property'] = { ... };

Blockly.Blocks['component_get_property'] = { ... };

Blockly.Blocks['advanced_custom_code'] = { ... };
*/
// ... TO HERE.

// --- End Custom Block Definitions ---


class BlocksManager {
  constructor(editorView) {
    this.editorView = editorView;
    this.currentApp = editorView.currentApp;
    this.currentScreen = editorView.currentScreen;
    this.blocklyWorkspace = null; // Renamed from blocksWorkspace
    this.notificationManager = new NotificationManager();
    // Removed old component initializations

    // Initialize Block Definitions & Generators
    this.initCustomBlocks(); 
  }

  // --- Dynamic Dropdown Helpers ---
  getComponentOptions(types = null) {
      if (!this.currentScreen || !this.currentScreen.components) {
          return [[ '(No Components)', 'NONE' ]];
      }
      let components = this.currentScreen.components;
      if (types) {
          components = components.filter(c => types.includes(c.type));
      }
      if (components.length === 0) {
           return types ? [[ `(No ${types.join('/')})`, 'NONE' ]] : [[ ' (No Components)', 'NONE' ]];
      }
      return components.map(c => [ c.id || '(Unnamed)', c.id ]); // Use ID for both display and value
  }
  
  getButtonOptions() {
      return this.getComponentOptions(['button']);
  }
  
  getPropertyOptions(componentId) {
       if (!this.currentScreen || !this.currentScreen.components || !componentId || componentId === 'NONE') {
          return [[ '(Select Component)', 'NONE' ]];
      }
      const component = this.currentScreen.components.find(c => c.id === componentId);
      if (!component || !component.properties) {
          return [[ '(No Properties)', 'NONE' ]];
      }
      // Basic common properties - expand this list
      const commonProps = ['text', 'visibility', 'enabled', 'bgColor', 'textColor', 'textSize'];
      // Add component-specific properties
      let specificProps = [];
      switch(component.type) {
          case 'textview': specificProps = ['text']; break;
          case 'button': specificProps = ['text', 'enabled']; break;
          case 'edittext': specificProps = ['text', 'hint', 'enabled']; break;
          case 'imageview': specificProps = ['src', 'scaleType']; break;
          case 'checkbox': specificProps = ['checked', 'text', 'enabled']; break;
          // ... add for other types
      }
      const allProps = [...new Set([...Object.keys(component.properties), ...commonProps, ...specificProps])]; // Combine and unique
      if (allProps.length === 0) {
           return [[ '(No Properties)', 'NONE' ]];
      }
      return allProps.map(prop => [ prop, prop ]); // Use prop name for display and value
  }
  
  // --- Custom Block Definitions & Generators ---
  initCustomBlocks() {
      const self = this; // Capture 'this' for use inside block definitions

      // Event Blocks
      Blockly.Blocks['event_app_starts'] = {
        init: function() {
          this.appendDummyInput()
              .appendField("When App Starts");
          this.appendStatementInput("DO")
              .setCheck(null);
          this.setColour("%{BKY_LOGIC_HUE}");
          this.setTooltip("Triggered when the app is opened");
          this.setHelpUrl("");
          this.setDeletable(false); // Usually you can't delete the main event handlers
        }
      };
      Blockly.JavaScript['event_app_starts'] = function(block) {
        const statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
        // In a real runtime, this would register a callback
        const code = `sketchware_events.onAppStart(() => {\n${statements_do}});\n`; 
        return code;
      };

      Blockly.Blocks['event_screen_created'] = {
        init: function() {
          this.appendDummyInput()
              .appendField("When Screen Created");
          this.appendStatementInput("DO")
              .setCheck(null);
          this.setColour("%{BKY_LOGIC_HUE}");
          this.setTooltip("Triggered when the screen is created");
          this.setHelpUrl("");
          this.setDeletable(false);
        }
      };
      Blockly.JavaScript['event_screen_created'] = function(block) {
        const statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
        const code = `sketchware_events.onScreenCreated(() => {\n${statements_do}});\n`;
        return code;
      };

      Blockly.Blocks['event_button_clicked'] = {
        init: function() {
          // TODO: Add dropdown for selecting button ID
          this.appendDummyInput()
              .appendField("When Button")
              .appendField(new Blockly.FieldDropdown(() => self.getButtonOptions()), "BUTTON_ID")
              .appendField("Clicked");
          this.appendStatementInput("DO")
              .setCheck(null);
          this.setPreviousStatement(true, null); // Allow stacking events? Maybe not.
          this.setNextStatement(true, null); // Allow stacking events? Maybe not.
          this.setColour("%{BKY_LOGIC_HUE}");
          this.setTooltip("Triggered when a button is clicked");
          this.setHelpUrl("");
        }
      };
       Blockly.JavaScript['event_button_clicked'] = function(block) {
        const dropdown_button_id = block.getFieldValue('BUTTON_ID');
        const statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
        if (!dropdown_button_id || dropdown_button_id === 'NONE') return '// Button not selected\n';
        const code = `sketchware_events.onButtonClick('${dropdown_button_id}', () => {\n${statements_do}});\n`;
        return code;
      };
      
      // Component Blocks
      Blockly.Blocks['component_set_property'] = {
          init: function() {
              // TODO: Add dropdowns for component ID and property name, and value input
              this.appendValueInput("VALUE")
                  .setCheck(null)
                  .appendField("set")
                  .appendField(new Blockly.FieldDropdown(() => self.getComponentOptions()), "COMPONENT_ID")
                  .appendField(".")
                  .appendField(new Blockly.FieldDropdown(function() { 
                      // Check if the source block exists before getting field value
                      const sourceBlock = this.getSourceBlock();
                      if (!sourceBlock) return [['(N/A)', 'NONE']]; 
                      const compId = sourceBlock.getFieldValue('COMPONENT_ID');
                      return self.getPropertyOptions(compId);
                  }), "PROPERTY")
                  .appendField("to");
              this.setPreviousStatement(true, null);
              this.setNextStatement(true, null);
              this.setColour("#4a6cd4");
              this.setTooltip("Set a property of a component");
              this.setHelpUrl("");
              // Ensure property dropdown updates if component is changed
              this.getField('COMPONENT_ID').setValidator(function(newValue) {
                  const propField = this.getSourceBlock().getField('PROPERTY');
                  // Re-initialize options - this might reset selection, needs refinement
                  // A better approach might involve storing/restoring selection if possible
                  propField.getOptions(false); // Force refresh of options
                  return newValue; // Accept the change
              });
          }
      };
      Blockly.JavaScript['component_set_property'] = function(block) {
          const componentId = block.getFieldValue('COMPONENT_ID');
          const propertyName = block.getFieldValue('PROPERTY');
          const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || 'null'; // Get connected value
          if (!componentId || componentId === 'NONE' || !propertyName || propertyName === 'NONE') return '// Component or property not selected\n';
          // Use a helper function in the runtime environment
          const code = `sketchware_setProp('${componentId}', '${propertyName}', ${value});\n`;
          return code;
      };

      Blockly.Blocks['component_get_property'] = {
        init: function() {
          // TODO: Add dropdowns for component ID and property name
          this.appendDummyInput()
              .appendField("get")
              .appendField(new Blockly.FieldDropdown(() => self.getComponentOptions()), "COMPONENT_ID")
              .appendField(".")
              .appendField(new Blockly.FieldDropdown(function() { 
                  // Check if the source block exists before getting field value
                  const sourceBlock = this.getSourceBlock();
                  if (!sourceBlock) return [['(N/A)', 'NONE']]; 
                  const compId = sourceBlock.getFieldValue('COMPONENT_ID');
                  return self.getPropertyOptions(compId);
               }), "PROPERTY");
          this.setOutput(true, null); // This block returns a value
          this.setColour("#4a6cd4");
          this.setTooltip("Get a property of a component");
          this.setHelpUrl("");
          // Ensure property dropdown updates if component is changed
          this.getField('COMPONENT_ID').setValidator(function(newValue) {
               // Check if the source block exists before getting field value
               const sourceBlock = this.getSourceBlock();
               if (!sourceBlock) return newValue; // Allow change if block not ready
               const propField = sourceBlock.getField('PROPERTY');
               if(propField) propField.getOptions(false); // Force refresh of options
               return newValue; 
           });
        }
      };
      Blockly.JavaScript['component_get_property'] = function(block) {
        const componentId = block.getFieldValue('COMPONENT_ID');
        const propertyName = block.getFieldValue('PROPERTY');
        if (!componentId || componentId === 'NONE' || !propertyName || propertyName === 'NONE') return ['null', Blockly.JavaScript.ORDER_ATOMIC];
        // Use a helper function in the runtime environment
        const code = `sketchware_getProp('${componentId}', '${propertyName}')`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL]; // Return code and precedence
      };
      
      // Example: Toast Block
       Blockly.Blocks['component_show_toast'] = {
        init: function() {
          this.appendValueInput("MESSAGE")
              .setCheck("String") // Expect a string input
              .appendField("show toast message");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour("#4a6cd4");
          this.setTooltip("Display a short message (toast)");
          this.setHelpUrl("");
        }
      };
       Blockly.JavaScript['component_show_toast'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || '';
        // Use a helper function
        const code = `sketchware_showToast(${message});\n`;
        return code;
      };

      // Advanced Blocks
      Blockly.Blocks['advanced_custom_code'] = {
        init: function() {
          this.appendDummyInput()
              .appendField("Custom JS Code:");
          // Input field for code - Use FieldMultilineInput
          this.appendDummyInput().appendField(new Blockly.FieldMultilineInput("// Your code here"), "CUSTOM_CODE");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour("#757575");
          this.setTooltip("Add custom JavaScript code (Use with caution!)");
          this.setHelpUrl("");
        }
      };
      Blockly.JavaScript['advanced_custom_code'] = function(block) {
          const customCode = block.getFieldValue('CUSTOM_CODE') || '';
          // Return the code directly, assuming it's valid JS
          // Use single backslash for newline in template literal
          return `// Custom Code Block Start\n${customCode}\n// Custom Code Block End\n`; 
      };
  }

  renderBlocksTab() {
    // Simple structure: a div for Blockly and the toolbox definition
    // The toolbox XML is now defined above
    return `
      <div class="blocks-editor" style="display: flex; height: 100%;">
        <!-- Toolbox XML is included in the JS -->
        <!-- The main area where Blockly will be injected -->
        <div id="blockly-div" style="flex-grow: 1; height: 100%;"></div>
      </div>
    `;
  }

  initializeBlockly() {
    const blocklyDiv = document.getElementById('blockly-div');
    if (!blocklyDiv) {
        console.error("Blockly container div not found!");
        return;
    }
    if (this.blocklyWorkspace) {
        // Dispose of existing workspace if re-initializing
        this.blocklyWorkspace.dispose();
    }

    // Inject Blockly
    try {
      // --- Force initialization of JavaScript generators ---
      if (typeof Blockly !== 'undefined' && typeof Blockly.JavaScript !== 'undefined') {
        // Force register all event handlers
        Object.keys(Blockly.Blocks).forEach(blockType => {
          if (!Blockly.JavaScript[blockType]) {
            console.warn(`Missing JavaScript generator for block type: ${blockType}`);
            // Create a simple placeholder generator for missing types
            Blockly.JavaScript[blockType] = function(block) {
              return `// Missing generator for ${blockType}\n`;
            };
          }
        });
      }
      // --- End Force initialization ---

      // --- Override default Blockly dialogs ---
      const dialogManager = this.editorView.dialogManager;
      Blockly.dialog.setPrompt((title, defaultValue, callback) => {
        dialogManager.showPromptDialog('Blockly Prompt', title, defaultValue, callback);
      });
      Blockly.dialog.setConfirm((message, callback) => {
        dialogManager.showConfirmDialog('Blockly Confirm', message, callback);
      });
      Blockly.dialog.setAlert((message, callback) => {
        // Use confirm dialog for alert, as we don't have a dedicated one
        // Callback for alert is optional and usually just closes it
        dialogManager.showConfirmDialog('Blockly Alert', message, () => { if (callback) callback(); });
      });
      // --- End Override ---

      this.blocklyWorkspace = Blockly.inject(blocklyDiv, {
        toolbox: toolboxXml,
        renderer: 'geras', // Popular renderer
        theme: Blockly.Themes.Zelos, // Changed from Classic to Zelos
        grid: {
          spacing: 25, // Slightly wider grid spacing
          length: 3,
          colour: '#ccc',
          snap: true
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        },
        trashcan: true // Use Blockly's built-in trashcan
      });
      
      // --- Initialize JavaScript Generator for this Workspace ---
      Blockly.JavaScript.init(this.blocklyWorkspace);
      // --- End Initialization ---

      // Load initial state (if any)
      this.loadBlocks();

      // Add listener for changes to save state or mark dirty
      this.blocklyWorkspace.addChangeListener((event) => {
          // Auto-save or mark as dirty on changes
          if (event.type !== Blockly.Events.UI) { // Ignore UI events like clicks/scrolls
              // Could implement auto-save here or just mark as needing save
              // console.log("Blockly workspace changed", event);
          }
          // Example: Save on block move/create/delete/change
          if (event.type == Blockly.Events.BLOCK_MOVE ||
              event.type == Blockly.Events.BLOCK_CREATE ||
              event.type == Blockly.Events.BLOCK_DELETE ||
              event.type == Blockly.Events.BLOCK_CHANGE) {
             this.saveBlocks(); // Example: Autosave
             
             // --- Add code generation and update trigger ---
             const generatedCode = this.getGeneratedCode();
             if (generatedCode !== null && this.editorView.codeManager) {
                 // We need a method in CodeManager to accept this update
                 this.editorView.codeManager.updateCodeFromBlocks(generatedCode); 
             }
             // --- End added code ---
          }
      });

      // console.log("Blockly workspace initialized.");

    } catch (e) {
        console.error("Error initializing Blockly:", e);
        this.notificationManager.showNotification("Failed to initialize blocks editor.", "error");
    }

    // Remove or adapt old event listeners - Blockly handles zoom, trashcan etc.
    // You might need listeners for custom buttons if you add them back.
  }

  setupEventListeners() {
    // This method should now primarily focus on initializing Blockly
    this.initializeBlockly();

    // Keep listeners for custom toolbar buttons if you add them back, e.g. Run, Save
    // const runBtn = document.getElementById('blocks-run-btn');
    // const saveBtn = document.getElementById('blocks-save-btn');
    // if (runBtn) runBtn.addEventListener('click', () => this.runBlocks());
    // if (saveBtn) saveBtn.addEventListener('click', () => this.saveBlocks());
  }
  
  saveBlocks() {
    if (!this.blocklyWorkspace) return;

    try {
      const workspaceState = Blockly.serialization.workspaces.save(this.blocklyWorkspace);
      const screenId = this.currentScreen.id;
      // Use localStorage or a more robust method to save per screen
      localStorage.setItem(`blocklyWorkspace_${screenId}`, JSON.stringify(workspaceState));
      // console.log(`Blocks saved for screen ${screenId}`);
      // this.notificationManager.showNotification('Blocks saved.', 'info', 1500); // Optional feedback
    } catch (e) {
      console.error("Error saving Blockly workspace:", e);
      this.notificationManager.showNotification('Error saving blocks!', 'error');
    }
  }

  loadBlocks() {
      if (!this.blocklyWorkspace) return;

      const screenId = this.currentScreen.id;
      const savedState = localStorage.getItem(`blocklyWorkspace_${screenId}`);

      if (savedState) {
          try {
              const workspaceState = JSON.parse(savedState);
              Blockly.serialization.workspaces.load(workspaceState, this.blocklyWorkspace);
              // console.log(`Blocks loaded for screen ${screenId}`);
          } catch (e) {
              console.error("Error loading Blockly workspace:", e);
              this.notificationManager.showNotification('Could not load saved blocks.', 'error');
              // Clear corrupted state?
              localStorage.removeItem(`blocklyWorkspace_${screenId}`);
              this.blocklyWorkspace.clear(); // Clear the workspace
          }
      } else {
          // Optional: Load default blocks if no saved state exists
          // For example, add the 'When App Starts' block automatically
          this.loadDefaultBlocks();
          // console.log(`No saved blocks found for screen ${screenId}. Loaded defaults.`);
      }
  }

  loadDefaultBlocks() {
      if (!this.blocklyWorkspace) return;
      // Example: Add essential event blocks if the workspace is empty
      const topBlocks = this.blocklyWorkspace.getTopBlocks(false);
      if (topBlocks.length === 0) {
          const appStartsBlock = this.blocklyWorkspace.newBlock('event_app_starts');
          appStartsBlock.initSvg();
          appStartsBlock.render();
          appStartsBlock.moveBy(50, 50); // Position it nicely

          const screenCreatedBlock = this.blocklyWorkspace.newBlock('event_screen_created');
          screenCreatedBlock.initSvg();
          screenCreatedBlock.render();
          screenCreatedBlock.moveBy(50, 150); // Position below the first one
      }
  }

  // Renamed from runBlocks
  getGeneratedCode() {
    if (!this.blocklyWorkspace) {
        this.notificationManager.showNotification('Blocks workspace not initialized.', 'warning');
        return null;
    }
    try {
        // Generate JavaScript code
        window.LoopTrap = 1000; // Basic infinite loop protection
        Blockly.JavaScript.INFINITE_LOOP_TRAP = 'if (--window.LoopTrap == 0) throw "Infinite loop.";\n';
        const code = Blockly.JavaScript.workspaceToCode(this.blocklyWorkspace);
        // console.log("--- Generated JavaScript Code ---\n", code); // Keep logging for debugging
        return code;
    } catch (e) {
        console.error("Error generating code from Blockly workspace:", e);
        this.notificationManager.showNotification(`Code Generation Error: ${e}`, 'error');
        return null;
    }
  }
  
  changeScreen(screenId) {
    if (this.currentScreen && this.currentScreen.id === screenId) {
      return; // No change
    }
    
    // Save current workspace before switching
    this.saveBlocks();
    
    // Update current screen
    const newScreen = this.editorView.currentApp.screens.find(s => s.id === screenId);
    if (newScreen) {
      this.currentScreen = newScreen;
      
      if (this.blocklyWorkspace) {
        this.blocklyWorkspace.clear(); // Clear the visual workspace
        this.loadBlocks(); // Load the state for the new screen
      } else {
        // If workspace isn't ready yet (e.g., during initial load)
        // console.warn("Blockly workspace not ready during screen change.");
      }
    } else {
      console.error(`Screen with ID ${screenId} not found.`);
    }
  }

  // Method to update screen references when a screen is renamed
  updateScreenReferences(screenId, oldName, newName) {
    // This method needs to find blocks that reference the old screen name and update them
    // e.g., blocks that navigate to a screen or get data from a screen
    // console.log(`BlocksManager: Updating references for screen ${screenId} from ${oldName} to ${newName}`);
    
    // Get XML of the workspace
    const xml = Blockly.Xml.workspaceToDom(this.blocklyWorkspace);
    
    // Update references in the workspace
    const blocks = this.blocklyWorkspace.getAllBlocks();
    blocks.forEach(block => {
      if (block.type === 'intent_goto' && block.getFieldValue('SCREEN') === oldName) {
        block.setFieldValue('SCREEN', newName);
      }
    });
    
    // Save the updated workspace
    Blockly.Xml.domToWorkspace(xml, this.blocklyWorkspace);
    this.saveBlocks();
    
    // console.log(`Updated component references in blocks from ${oldId} to ${newId}`);
  }

  // Add a method to handle component ID changes
  handleComponentIdChange(oldId, newId) {
    // Get the workspace
    const workspace = this.blocklyWorkspace;
    if (!workspace) return;
    
    // Find all blocks that reference the old component ID
    const allBlocks = workspace.getAllBlocks();
    
    allBlocks.forEach(block => {
      // Check if the block is related to components (e.g., event handlers, property getters/setters)
      if (block.type && (
          block.type.startsWith('component_') || 
          block.type.includes('_component_') ||
          block.type.endsWith('_component')
      )) {
        // Look for fields that might contain component IDs
        const fields = block.inputList.flatMap(input => input.fieldRow);
        
        fields.forEach(field => {
          if (field && field.getValue && field.getValue() === oldId) {
            // Update the field value to the new ID
            field.setValue(newId);
          }
        });
      }
    });
    
    // Force workspace update
    workspace.render();
    
    // If you have any cached data about components, update it too
    // ...
    
    // console.log(`Updated component references in blocks from ${oldId} to ${newId}`);
  }

  // --- Old methods removed or commented out ---
  /*
  refreshBlocks(blocks) {
    // Old method - Needs reimplementation if specific refresh logic is needed with Blockly
  }
  
  addBlock(blockType, position) {
    // Old method - Blockly handles block creation via toolbox drag/drop or workspace.newBlock()
  }

  setupWorkspaceEvents() {
    // Old method - Blockly handles internal events. Use workspace.addChangeListener for custom logic.
  }

  searchBlocks(query) {
    // Old method - Blockly doesn't have a built-in search across toolbox + workspace like this.
    // Would require custom implementation if needed.
  }

  deleteSelectedBlocks() {
    // Old method - Blockly handles deletion via trashcan or context menu / delete key.
    // Use workspace.getSelected().dispose() if needed programmatically.
  }

  disconnectBlock(block) {
    // Old method - Blockly handles connections internally.
  }

  refreshConnections() {
    // Old method - Blockly handles connection rendering.
  }

  deselectAllBlocks() {
     // Old method - Use workspace.clearSelection() if needed.
  }
  */
}

export default BlocksManager; 
