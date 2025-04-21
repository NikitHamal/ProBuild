class BlockDropdowns {
    constructor(blocksManager) {
        // We need access to the currentScreen via blocksManager or editorView
        this.blocksManager = blocksManager;
        this.editorView = blocksManager.editorView;
    }

    getCurrentScreen() {
        return this.editorView?.currentScreen;
    }

    getComponentOptions(types = null) {
        const currentScreen = this.getCurrentScreen();
        if (!currentScreen || !currentScreen.components) {
            return [[ '(No Components)', 'NONE' ]];
        }
        let components = currentScreen.components;
        if (types) {
            components = components.filter(c => types.includes(c.type));
        }
        if (components.length === 0) {
             return types ? [[ `(No ${types.join('/')})`, 'NONE' ]] : [[ ' (No Components)', 'NONE' ]];
        }
        // Use component ID for both display name and value
        return components.map(c => [ c.id || '(Unnamed)', c.id ]); 
    }
  
    getButtonOptions() {
        return this.getComponentOptions(['button']);
    }
  
    getPropertyOptions(componentId) {
        const currentScreen = this.getCurrentScreen();
        if (!currentScreen || !currentScreen.components || !componentId || componentId === 'NONE') {
            return [[ '(Select Component)', 'NONE' ]];
        }
        const component = currentScreen.components.find(c => c.id === componentId);
        if (!component || !component.properties) {
            return [[ '(No Properties)', 'NONE' ]];
        }
        
        // Basic common properties - should match properties defined in ComponentManager/PropertyPanel
        const commonProps = [
            'width', 'height', 'margin', 'padding', 
            'bgColor', 'opacity', 'borderRadius', 
            'borderColor', 'boxShadow',
            'text', 'textSize', 'textColor', 'font', 
            'hint', 'hintColor',
            'src', 'scaleType', 
            'checked', 
            'progress', 'max',
            'items', 
            'orientation',
            'url',
            'id', 'visibility', 'enabled' // From component structure directly?
        ];
        
        // Combine known properties from the component object and common list
        const allProps = [...new Set([...Object.keys(component.properties), ...commonProps])];
        
        // Filter out internal/non-user-facing properties if necessary (e.g., x, y?)
        const filteredProps = allProps.filter(prop => !['x', 'y'].includes(prop));
        
        if (filteredProps.length === 0) {
             return [[ '(No Properties)', 'NONE' ]];
        }
        // Use property name for display and value
        return filteredProps.map(prop => [ prop, prop ]); 
    }
}

export default BlockDropdowns; 