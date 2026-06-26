// src/firebase/error-emitter.ts
import { EventEmitter } from 'events';

// It's safe to use a global event emitter in this context
// as Next.js will handle module scoping correctly.
const errorEmitter = new EventEmitter();

export { errorEmitter };
