// src/lib/safe-console.ts

function sanitizeCircular(val: any, seen = new WeakSet()): any {
  if (val === null || val === undefined) return val;
  
  if (typeof val === 'function') {
    return `[Function: ${val.name || 'anonymous'}]`;
  }
  
  if (typeof val !== 'object') {
    return val;
  }
  
  // Handle DOM elements safely
  if (typeof window !== 'undefined' && (val instanceof HTMLElement || val.nodeType !== undefined)) {
    const tagName = (val as any).tagName ? String((val as any).tagName).toLowerCase() : 'element';
    const id = (val as any).id ? '#' + String((val as any).id) : '';
    return `[HTMLElement: ${tagName}${id}]`;
  }
  
  // Handle standard errors
  if (val instanceof Error) {
    const errorObj: any = {
      name: val.name,
      message: val.message,
      stack: val.stack,
    };
    
    // Copy any custom properties safely
    for (const key of Object.keys(val)) {
      try {
        errorObj[key] = sanitizeCircular((val as any)[key], seen);
      } catch {
        errorObj[key] = '[Unserializable Property]';
      }
    }
    return errorObj;
  }

  if (seen.has(val)) {
    return '[Circular]';
  }
  
  seen.add(val);
  
  if (Array.isArray(val)) {
    return val.map(item => {
      try {
        return sanitizeCircular(item, seen);
      } catch {
        return '[Unserializable Item]';
      }
    });
  }
  
  const safeObj: any = {};
  for (const key of Object.keys(val)) {
    try {
      safeObj[key] = sanitizeCircular(val[key], seen);
    } catch {
      safeObj[key] = '[Unserializable Value]';
    }
  }
  return safeObj;
}

export function initSafeConsole() {
  if (typeof window === 'undefined') return;

  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function (...args: any[]) {
    const safeArgs = args.map(arg => {
      try {
        JSON.stringify(arg);
        return arg;
      } catch {
        return sanitizeCircular(arg);
      }
    });
    originalConsoleError.apply(console, safeArgs);
  };

  console.warn = function (...args: any[]) {
    const safeArgs = args.map(arg => {
      try {
        JSON.stringify(arg);
        return arg;
      } catch {
        return sanitizeCircular(arg);
      }
    });
    originalConsoleWarn.apply(console, safeArgs);
  };

  // Safe window error handler to prevent unhandled rejection serialization crashes
  const handleWindowError = (event: ErrorEvent) => {
    if (event.error) {
      try {
        JSON.stringify(event.error);
      } catch {
        // If the error object is circular, sanitize it
        const sanitizedError = sanitizeCircular(event.error);
        console.error("Unhandled error intercepted:", sanitizedError);
        event.preventDefault(); // Stop default propagation of circular error
      }
    }
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    if (event.reason) {
      try {
        JSON.stringify(event.reason);
      } catch {
        const sanitizedReason = sanitizeCircular(event.reason);
        console.error("Unhandled promise rejection intercepted:", sanitizedReason);
        event.preventDefault();
      }
    }
  };

  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleRejection);
}
