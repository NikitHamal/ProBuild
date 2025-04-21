import NotificationManager from '../utils/NotificationManager.js';

// Function to define custom blocks and generators
function defineCustomBlocks(Blockly, dropdownHelper) {
    const notificationManager = new NotificationManager(); // For error reporting

    // Ensure Blockly and Blockly.JavaScript are available
    if (!Blockly || typeof Blockly.JavaScript === 'undefined') {
        console.error('Blockly or Blockly.JavaScript is not loaded before defining custom blocks!');
        notificationManager.showNotification('Error: Blockly libraries not loaded.', 'error');
        return;
    }

    // --- Event Blocks --- 
    Blockly.Blocks['event_app_starts'] = {
      init: function() {
        this.appendDummyInput().appendField("When App Starts (in onCreate)");
        this.appendStatementInput("DO").setCheck(null);
        this.setColour("%{BKY_LOGIC_HUE}");
        this.setTooltip("Code here runs when the screen is first created.");
        this.setDeletable(false);
        this.setMovable(false); // Typically fixed
      }
    };
    Blockly.JavaScript['event_app_starts'] = function(block) {
      const statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
      return statements_do;
    };

    Blockly.Blocks['event_screen_created'] = {
      init: function() {
        this.appendDummyInput().appendField("When Screen Created (in onCreate)");
        this.appendStatementInput("DO").setCheck(null);
        this.setColour("%{BKY_LOGIC_HUE}");
        this.setTooltip("Code here runs when the screen is first created.");
        this.setDeletable(false);
        this.setMovable(false); // Typically fixed
      }
    };
    Blockly.JavaScript['event_screen_created'] = function(block) {
      const statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
      return statements_do;
    };

    Blockly.Blocks['event_button_clicked'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("When Button")
                // Use the dropdown helper passed into the function
                .appendField(new Blockly.FieldDropdown(() => dropdownHelper.getButtonOptions()), "BUTTON_ID")
                .appendField("Clicked");
            this.appendStatementInput("DO").setCheck(null);
            this.setColour("%{BKY_LOGIC_HUE}");
            this.setTooltip("Triggered when a button is clicked.");
        }
        // Note: No need for getButtonOptions here anymore, it uses the helper
    };
    Blockly.JavaScript['event_button_clicked'] = function(block) {
        const buttonId = block.getFieldValue('BUTTON_ID');
        const statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
        if (!buttonId || buttonId === 'NONE') return '// Button not selected for click event\n';
        
        const buttonVar = buttonId; 
        
        return `${buttonVar}.setOnClickListener(new View.OnClickListener() {\n    @Override\n    public void onClick(View v) {\n${statements_do}    }\n});\n`;
    };

    // --- Component Blocks --- 
    Blockly.Blocks['component_set_property'] = {
        init: function() {
            this.appendValueInput("VALUE")
                .setCheck(null)
                .appendField("set")
                .appendField(new Blockly.FieldDropdown(() => dropdownHelper.getComponentOptions()), "COMPONENT_ID")
                .appendField(".")
                .appendField(new Blockly.FieldDropdown((compId) => dropdownHelper.getPropertyOptions(compId || this.getSourceBlock()?.getFieldValue('COMPONENT_ID'))), "PROPERTY") // Pass compId directly
                .appendField("to");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a6cd4");
            this.setTooltip("Set a property of a component.");
            
            // Validator to update property dropdown when component changes
            this.getField('COMPONENT_ID').setValidator((newComponentId) => {
                const propField = this.getSourceBlock()?.getField('PROPERTY');
                if (propField) {
                    // Trigger refresh of options for the new component ID
                    // The dropdown function itself now handles fetching based on the ID
                    propField.getOptions(false); // Force refresh if needed, though function call usually does
                    propField.setValue('NONE'); // Reset selection
                }
                return newComponentId; // Accept the new value
            });
        }
        // Note: No need for getComponentOptions/getPropertyOptions here anymore
    };
    Blockly.JavaScript['component_set_property'] = function(block) {
        const componentId = block.getFieldValue('COMPONENT_ID');
        const propertyName = block.getFieldValue('PROPERTY');
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || 'null';
        
        if (!componentId || componentId === 'NONE' || !propertyName || propertyName === 'NONE') {
            return '// Component or property not selected for set operation\n';
        }
        
        const componentVar = componentId;
        
        // Map property names to Java methods (Needs Expansion & Type Handling)
        switch (propertyName) {
            case 'text':
                return `${componentVar}.setText(${value});\n`;
            case 'enabled':
                return `${componentVar}.setEnabled(${value});\n`; 
            case 'visibility': 
                // Needs blocks for View.VISIBLE, View.INVISIBLE, View.GONE
                return `${componentVar}.setVisibility(${value}); // TODO: Map value block to View constants\n`;
            case 'textColor': 
                 return `${componentVar}.setTextColor(${value}); // TODO: Map color block to integer\n`;
            case 'backgroundColor':
            case 'bgColor': // Handle alias
                 return `${componentVar}.setBackgroundColor(${value}); // TODO: Map color block to integer\n`;
            case 'src': // ImageView source
                 return `${componentVar}.setImageResource(${value}); // TODO: Map image resource block to R.drawable ID or handle URL with Glide/Picasso\n`;
            case 'checked': // CheckBox / Switch
                 return `${componentVar}.setChecked(${value});\n`;
            case 'progress': // ProgressBar / SeekBar
                 return `${componentVar}.setProgress(${value});\n`;
            // ... add more property mappings ...
            default:
                return `// Unknown property '${propertyName}' for ${componentId}\n`;
        }
    };

    Blockly.Blocks['component_get_property'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("get")
                .appendField(new Blockly.FieldDropdown(() => dropdownHelper.getComponentOptions()), "COMPONENT_ID")
                .appendField(".")
                .appendField(new Blockly.FieldDropdown((compId) => dropdownHelper.getPropertyOptions(compId || this.getSourceBlock()?.getFieldValue('COMPONENT_ID'))), "PROPERTY");
            this.setOutput(true, null); 
            this.setColour("#4a6cd4");
            this.setTooltip("Get a property of a component.");

            this.getField('COMPONENT_ID').setValidator((newComponentId) => {
                const propField = this.getSourceBlock()?.getField('PROPERTY');
                if (propField) {
                    propField.getOptions(false);
                    propField.setValue('NONE');
                }
                return newComponentId;
            });
        }
    };
    Blockly.JavaScript['component_get_property'] = function(block) {
        const componentId = block.getFieldValue('COMPONENT_ID');
        const propertyName = block.getFieldValue('PROPERTY');
        
        if (!componentId || componentId === 'NONE' || !propertyName || propertyName === 'NONE') {
            return ['null /* Component or property not selected */', Blockly.JavaScript.ORDER_ATOMIC];
        }
        
        const componentVar = componentId;
        let javaCode = '';
        let order = Blockly.JavaScript.ORDER_MEMBER; 

        switch (propertyName) {
            case 'text':
                javaCode = `${componentVar}.getText().toString()`;
                break;
            case 'enabled':
                javaCode = `${componentVar}.isEnabled()`;
                order = Blockly.JavaScript.ORDER_FUNCTION_CALL;
                break;
            case 'visibility':
                javaCode = `${componentVar}.getVisibility()`; 
                order = Blockly.JavaScript.ORDER_FUNCTION_CALL;
                break;
             case 'width':
                javaCode = `${componentVar}.getWidth()`; 
                order = Blockly.JavaScript.ORDER_FUNCTION_CALL;
                break;
             case 'height':
                javaCode = `${componentVar}.getHeight()`; 
                order = Blockly.JavaScript.ORDER_FUNCTION_CALL;
                break;
             case 'checked': // CheckBox / Switch
                 javaCode = `${componentVar}.isChecked()`;
                 order = Blockly.JavaScript.ORDER_FUNCTION_CALL;
                 break;
             case 'progress': // ProgressBar / SeekBar
                 javaCode = `${componentVar}.getProgress()`;
                 order = Blockly.JavaScript.ORDER_FUNCTION_CALL;
                 break;
            // ... add more property mappings ...
            default:
                javaCode = `null /* Unknown property '${propertyName}' */`;
                order = Blockly.JavaScript.ORDER_ATOMIC;
        }
        return [javaCode, order];
    };

    Blockly.Blocks['component_show_toast'] = {
        init: function() {
            this.appendValueInput("MESSAGE")
                .setCheck('String') 
                .appendField("show toast message");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a6cd4");
            this.setTooltip("Display a short message pop-up (Toast).");
        }
    };
    Blockly.JavaScript['component_show_toast'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || '""';
        // Assuming 'this' context is the Activity. Might need getApplicationContext() if used elsewhere.
        return `Toast.makeText(this, ${message}, Toast.LENGTH_SHORT).show();\n`;
    };

    // --- Advanced Blocks --- 
    Blockly.Blocks['advanced_custom_code'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Custom Java Code:");
            this.appendDummyInput()
                .appendField(new Blockly.FieldMultilineInput('// Your Java code here'), 'CODE');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#757575");
            this.setTooltip("Insert raw Java code. Use with caution!");
        }
    };
    Blockly.JavaScript['advanced_custom_code'] = function(block) {
        const code = block.getFieldValue('CODE') || '';
        return code + '\n'; 
    };
    
    console.log('Custom blocks defined.');
}

export { defineCustomBlocks }; 