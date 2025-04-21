class DevicePreviewManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.previewElement = null; // Cache the element
    }

    init() {
        this.updateDevicePreviewSize(); // Apply initial size
    }

    updateDevicePreviewSize() {
        if (!this.previewElement) {
             // Find the element once and cache it
             this.previewElement = document.querySelector('.phone-preview');
        }
        if (this.previewElement) {
            // Hardcode the default phone size
            this.previewElement.style.width = `320px`;
            this.previewElement.style.height = `600px`;
             console.log(`Device preview size set to 320x600`);
        } else {
            console.warn('Device preview element (.phone-preview) not found.');
        }
    }

    // Method to invalidate the cached element if the DOM is rebuilt
    invalidateCache() {
        this.previewElement = null;
    }
}

export default DevicePreviewManager; 