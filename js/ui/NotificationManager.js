/**
 * Manages notifications in the UI
 */
class NotificationManager {
    constructor() {
        this.container = null;
        this.initContainer();
    }

    /**
     * Singleton pattern
     */
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Initialize the notification container
     */
    initContainer() {
        // Check if the container already exists
        this.container = document.getElementById('notification-container');
        
        // If not, create it
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.position = 'fixed';
            this.container.style.top = '20px';
            this.container.style.right = '20px';
            this.container.style.zIndex = '9999';
            this.container.style.display = 'flex';
            this.container.style.flexDirection = 'column';
            this.container.style.alignItems = 'flex-end';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (info, success, warning, error)
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.padding = '10px 15px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '4px';
        notification.style.maxWidth = '300px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.animation = 'fadeIn 0.3s ease-out forwards';
        notification.style.opacity = '0';
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#FFC107';
                notification.style.color = 'black';
                break;
            case 'error':
                notification.style.backgroundColor = '#F44336';
                notification.style.color = 'white';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#2196F3';
                notification.style.color = 'white';
                break;
        }
        
        // Add a close button
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.marginLeft = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.onclick = () => {
            this.removeNotification(notification);
        };
        notification.appendChild(closeButton);
        
        // Add to container
        this.container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        // Log to console as well (helpful for debugging)
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        return notification;
    }
    
    /**
     * Remove a notification
     * @param {HTMLElement} notification - The notification to remove
     */
    removeNotification(notification) {
        // Animate out
        notification.style.opacity = '0';
        
        // Then remove
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);

export default NotificationManager; 