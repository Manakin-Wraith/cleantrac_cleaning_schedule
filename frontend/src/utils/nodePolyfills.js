// Polyfills for Node.js globals needed by Node.js libraries in browser environments
if (typeof window !== 'undefined') {
  // Add global object
  window.global = window;
  
  // Add process object
  window.process = window.process || { env: {} };
  
  // Add Buffer object
  window.Buffer = window.Buffer || { isBuffer: () => false };
}

export default {};
