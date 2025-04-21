class DialogUtility {
    static createDialog(title, contentHtml, actionsHtml, width = '550px') {
        // Close any existing dialogs first
        const existingDialogs = document.querySelectorAll('.dialog-overlay');
        existingDialogs.forEach(dialog => dialog.remove());
        
        // Ensure dialog.css is loaded
        if (!document.getElementById('dialog-css')) {
            const link = document.createElement('link');
            link.id = 'dialog-css';
            link.rel = 'stylesheet';
            link.href = 'css/dialog.css';
            document.head.appendChild(link);
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'dialog-title');
        
        dialog.innerHTML = `
            <div class="dialog" style="width: ${width}; max-width: 90%;">
                <div class="dialog-header">
                    <div class="dialog-title" id="dialog-title">${title}</div>
                </div>
                <div class="dialog-content">${contentHtml}</div>
                ${actionsHtml ? `<div class="dialog-actions">${actionsHtml}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Focus handling for better keyboard accessibility
        const focusableElements = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            setTimeout(() => {
                focusableElements[0].focus();
            }, 100);
        }
        
        // Allow ESC key to close the dialog
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDialog(dialog);
            }
        });
        
        return dialog;
    }

    static closeDialog(dialog) {
        if (dialog) {
            dialog.remove();
        }
    }

    static addCloseOnClickOutside(dialog, callback) {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                callback();
            }
        });
    }
    
    // Helper to show a simple confirmation dialog
    static showConfirmDialog(message, onConfirm, onCancel) {
        const contentHtml = `<p>${message}</p>`;
        const actionsHtml = `
            <button class="dialog-btn cancel-btn">Cancel</button>
            <button class="dialog-btn primary confirm-btn">Confirm</button>
        `;
        
        const dialog = this.createDialog('Confirm', contentHtml, actionsHtml);
        
        dialog.querySelector('.confirm-btn').addEventListener('click', () => {
            this.closeDialog(dialog);
            if (onConfirm) onConfirm();
        });
        
        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeDialog(dialog);
            if (onCancel) onCancel();
        });
        
        this.addCloseOnClickOutside(dialog, () => {
            this.closeDialog(dialog);
            if (onCancel) onCancel();
        });
        
        return dialog;
    }
}

export default DialogUtility; 