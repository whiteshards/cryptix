
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and run startup initialization
    const { initializeApplication } = await import('./lib/startup.js');
    console.log('Running server startup initialization via instrumentation...');
  }
}
