/**
 * IndexedDBManager for handling image storage in the browser database
 */
class IndexedDBManager {
    constructor() {
        this.dbName = 'ProBuildStorage';
        this.version = 1;
        this.imagesStoreName = 'images';
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the database connection
     * @returns {Promise} Promise that resolves when DB is ready
     */
    async init() {
        if (this.isInitialized) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject('Failed to open IndexedDB');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create images object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.imagesStoreName)) {
                    const store = db.createObjectStore(this.imagesStoreName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('appId', 'appId', { unique: false });
                }
            };
        });
    }

    /**
     * Store an image in the database
     * @param {File} file - The image file to store
     * @param {string} appId - The app ID this image belongs to
     * @returns {Promise<object>} - Promise with the stored image info
     */
    async storeImage(file, appId) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                const imageData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    appId: appId,
                    timestamp: Date.now()
                };
                
                try {
                    const transaction = this.db.transaction([this.imagesStoreName], 'readwrite');
                    const store = transaction.objectStore(this.imagesStoreName);
                    
                    const request = store.add(imageData);
                    
                    request.onsuccess = (event) => {
                        const imageId = event.target.result;
                        resolve({
                            id: imageId,
                            name: file.name,
                            dataUrl: event.target.result,
                            appId: appId
                        });
                    };
                    
                    request.onerror = (event) => {
                        reject('Error storing image: ' + event.target.error);
                    };
                } catch (error) {
                    reject(`Transaction error: ${error.message}`);
                }
            };
            
            reader.onerror = () => {
                reject('Error reading file');
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get an image by its ID
     * @param {number} id - The image ID
     * @returns {Promise<object>} - Promise with the image data
     */
    async getImage(id) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.imagesStoreName], 'readonly');
            const store = transaction.objectStore(this.imagesStoreName);
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                if (event.target.result) {
                    resolve(event.target.result);
                } else {
                    reject(`Image with ID ${id} not found`);
                }
            };
            
            request.onerror = (event) => {
                reject('Error retrieving image: ' + event.target.error);
            };
        });
    }

    /**
     * Get all images for a specific app
     * @param {string} appId - The app ID
     * @returns {Promise<Array>} - Promise with array of images
     */
    async getAppImages(appId) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.imagesStoreName], 'readonly');
            const store = transaction.objectStore(this.imagesStoreName);
            const index = store.index('appId');
            const request = index.getAll(appId);
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                reject('Error retrieving images: ' + event.target.error);
            };
        });
    }

    /**
     * Delete an image by its ID
     * @param {number} id - The image ID to delete
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async deleteImage(id) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.imagesStoreName], 'readwrite');
            const store = transaction.objectStore(this.imagesStoreName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject('Error deleting image: ' + event.target.error);
            };
        });
    }
}

export default new IndexedDBManager(); 