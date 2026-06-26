// src/firebase/errors.ts
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  path: string;
  operation: string;

  constructor(context: SecurityRuleContext, serverError?: any) {
    let contextStr = '';
    const safeContext = {
      path: context.path,
      operation: context.operation,
      hasData: !!context.requestResourceData
    };

    try {
      contextStr = JSON.stringify(safeContext, null, 2);
    } catch (e) {
      contextStr = `Path: ${context.path}, Operation: ${context.operation}`;
    }

    const serverErrorMessage = serverError?.message || (serverError ? String(serverError) : '');
    const message = `FirestoreError: Missing or insufficient permissions. The following request was denied by Firestore Security Rules:\n${contextStr}${serverErrorMessage ? `\nServer Error: ${serverErrorMessage}` : ''}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.path = context.path;
    this.operation = context.operation;

    // This is to ensure the stack trace is captured correctly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }

  /**
   * Prevents circular structure errors when this error is stringified by dev tools.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      path: this.path,
      operation: this.operation,
    };
  }
}
