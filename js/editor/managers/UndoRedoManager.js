import Command from '../commands/Command.js'; // Assuming a base Command class exists

class UndoRedoManager {
    constructor(editorView) {
        this.editorView = editorView;
        this.undoStack = [];
        this.redoStack = [];
    }

    init() {
        this.setupEventListeners();
        this.updateButtons(); // Initial state
    }

    setupEventListeners() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }
        // Potentially listen for keyboard shortcuts (Ctrl+Z, Ctrl+Y) here or delegate from EditorView
    }

    /**
     * Executes a command, adds it to the undo stack, and updates UI.
     * @param {Command} command - The command to execute.
     */
    executeCommand(command) {
        console.log('Executing command:', command); // Debug log
        if (!command || typeof command.execute !== 'function') {
            console.error("Invalid command provided to executeCommand:", command);
            return;
        }
        if (command.execute()) { // Only push if execution succeeds
            this.undoStack.push(command);
            this.redoStack = []; // Clear redo stack when a new command is executed
            this.updateButtons();
            // Potentially trigger save or preview update here if needed
            this.editorView.saveApp(); // Example: Trigger save after command execution
        } else {
            console.warn("Command execution failed, not adding to undo stack:", command);
            // Optionally show a notification to the user
            this.editorView.notificationManager?.showNotification('Action could not be completed.', 'warning');
        }
    }

    undo() {
        if (this.undoStack.length === 0) {
            return;
        }
        const command = this.undoStack.pop();
        console.log('Undoing command:', command); // Debug log
        if (!command || typeof command.undo !== 'function') {
             console.error("Invalid command found in undo stack during undo:", command);
             this.updateButtons();
             return;
        }
        
        if (command.undo()) {
             this.redoStack.push(command);
              // Potentially trigger save or preview update here if needed
             this.editorView.saveApp(); // Example: Trigger save after undo
        } else {
            console.warn("Command undo failed:", command);
            // If undo fails, should we put it back? Generally no.
            // Notify the user
            this.editorView.notificationManager?.showNotification('Could not undo the last action.', 'warning');
        }
        this.updateButtons();
    }

    redo() {
        if (this.redoStack.length === 0) {
            return;
        }
        const command = this.redoStack.pop();
         console.log('Redoing command:', command); // Debug log
        if (!command || typeof command.execute !== 'function') {
            console.error("Invalid command found in redo stack during redo:", command);
            this.updateButtons();
            return;
        }
        
        if (command.execute()) {
            this.undoStack.push(command);
             // Potentially trigger save or preview update here if needed
            this.editorView.saveApp(); // Example: Trigger save after redo
        } else {
            console.warn("Command redo (re-execute) failed:", command);
             // If redo fails, should we put it back? Generally no.
             // Notify the user
            this.editorView.notificationManager?.showNotification('Could not redo the last action.', 'warning');
        }
        this.updateButtons();
    }

    updateButtons() {
        // Use requestAnimationFrame to ensure buttons exist after initial render
        requestAnimationFrame(() => {
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            if (undoBtn) {
                undoBtn.disabled = this.undoStack.length === 0;
                // console.log('Undo button disabled:', undoBtn.disabled); // Debug
            } else {
                 // console.log('Undo button not found for update'); // Debug
            }
            if (redoBtn) {
                redoBtn.disabled = this.redoStack.length === 0;
                // console.log('Redo button disabled:', redoBtn.disabled); // Debug
            } else {
                 // console.log('Redo button not found for update'); // Debug
            }
        });
    }

    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }

    hasUnsavedChanges() {
      return this.undoStack.length > 0;
    }
}

export default UndoRedoManager; 