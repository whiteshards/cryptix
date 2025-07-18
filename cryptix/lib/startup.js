
import jobQueue from './jobQueue.js';

export async function initializeApplication() {
  try {
    console.log('Initializing application...');
    
    // Wait for job queue to be fully initialized
    while (!jobQueue.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Application initialization complete');
    return true;
  } catch (error) {
    console.error('Error during application initialization:', error);
    return false;
  }
}

export default initializeApplication;
