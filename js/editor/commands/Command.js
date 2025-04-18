/**
 * Base Command class for implementing the Command pattern
 * Used for undo/redo operations
 */
class Command {
  constructor(editorView) {
    this.editorView = editorView;
  }
  
  /**
   * Execute the command. 
   * Must be implemented by subclasses.
   * @returns {boolean} True if successful, false otherwise.
   */
  execute() {
    throw new Error('execute() method must be implemented by subclass');
  }
  
  /**
   * Undo the command. 
   * Must be implemented by subclasses.
   * @returns {boolean} True if successful, false otherwise.
   */
  undo() {
    throw new Error('undo() method must be implemented by subclass');
  }
}

export default Command; 