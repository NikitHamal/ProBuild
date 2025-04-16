class CodeFormatter {
  constructor() {
    this.indentSize = 2;
    this.useSpaces = true;
  }
  
  format(code, fileType) {
    if (!code) return code;
    
    switch (fileType) {
      case 'Java':
        return this.formatJava(code);
      case 'XML':
        return this.formatXml(code);
      default:
        return this.formatGeneric(code);
    }
  }
  
  formatJava(code) {
    // Basic Java formatting
    const lines = code.split('\n');
    let formattedCode = '';
    let indentLevel = 0;
    let inComment = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Handle empty lines
      if (line === '') {
        formattedCode += '\n';
        continue;
      }
      
      // Check for comment blocks
      if (line.includes('/*')) inComment = true;
      if (line.includes('*/')) inComment = false;
      
      // Indent level changes for blocks
      if (line.endsWith('{')) {
        // Add line with current indent
        formattedCode += this.getIndent(indentLevel) + line + '\n';
        indentLevel++;
      } else if (line.startsWith('}')) {
        // Decrease indent first, then add line
        indentLevel = Math.max(0, indentLevel - 1);
        formattedCode += this.getIndent(indentLevel) + line + '\n';
      } else {
        // Regular line, use current indent
        formattedCode += this.getIndent(indentLevel) + line + '\n';
      }
      
      // Handle inline braces
      if (line.endsWith('{') && line.includes('}')) {
        indentLevel--;
      }
    }
    
    return formattedCode.trim();
  }
  
  formatXml(code) {
    // Basic XML formatting
    if (!code.includes('<')) return code;
    
    const lines = code.split('\n');
    let formattedCode = '';
    let indentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        formattedCode += '\n';
        continue;
      }
      
      // Handle XML declarations
      if (line.startsWith('<?xml')) {
        formattedCode += line + '\n';
        continue;
      }
      
      // Handle self-closing tags
      if (line.includes('/>') && !line.includes('</', line.indexOf('/>'))) {
        formattedCode += this.getIndent(indentLevel) + line + '\n';
        continue;
      }
      
      // Handle opening tags
      if (line.includes('<') && !line.includes('</') && !line.includes('/>')) {
        formattedCode += this.getIndent(indentLevel) + line + '\n';
        indentLevel++;
        continue;
      }
      
      // Handle closing tags
      if (line.includes('</')) {
        if (line.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        formattedCode += this.getIndent(indentLevel) + line + '\n';
        if (!line.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        continue;
      }
      
      // Regular content
      formattedCode += this.getIndent(indentLevel) + line + '\n';
    }
    
    return formattedCode.trim();
  }
  
  formatGeneric(code) {
    // Basic indentation for any code
    const lines = code.split('\n');
    let formattedCode = '';
    let indentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        formattedCode += '\n';
        continue;
      }
      
      // Basic brace handling for most languages
      if (line.endsWith('{')) {
        formattedCode += this.getIndent(indentLevel) + line + '\n';
        indentLevel++;
      } else if (line.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
        formattedCode += this.getIndent(indentLevel) + line + '\n';
      } else {
        formattedCode += this.getIndent(indentLevel) + line + '\n';
      }
    }
    
    return formattedCode.trim();
  }
  
  getIndent(level) {
    const indentChar = this.useSpaces ? ' '.repeat(this.indentSize) : '\t';
    return indentChar.repeat(level);
  }
  
  // Utility methods that could be exposed as configuration
  setIndentSize(size) {
    this.indentSize = size > 0 ? size : 2;
  }
  
  setUseSpaces(useSpaces) {
    this.useSpaces = useSpaces;
  }
}

export default CodeFormatter; 