
import jobQueue from './jobQueue.js';

let isInitialized = false;

export async function initializeApplication() {
  if (isInitialized) {
    console.log('Application already initialized, skipping...');
    return true;
  }

  try {
    console.log('Initializing application...');
    
    // Wait for job queue to be fully initialized
    while (!jobQueue.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    isInitialized = true;
    console.log('Application initialization complete');
    return true;
  } catch (error) {
    console.error('Error during application initialization:', error);
    return false;
  }
}

// Auto-initialize on server startup (only in server environment)
if (typeof window === 'undefined') {
  initializeApplication().then((success) => {
    if (success) {
      console.log('Server startup initialization completed');
    } else {
      console.error('Server startup initialization failed');
    }
  });
}

export default initializeApplication;
