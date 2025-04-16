class NotificationManager {
  constructor() {
    // No need for any initialization
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check_circle' : 
                 type === 'error' ? 'error' : 'info';
    
    notification.innerHTML = `
      <i class="material-icons">${icon}</i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}

export default NotificationManager; 