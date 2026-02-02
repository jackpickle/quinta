import { scheduleAutomaticCleanup } from './cleanup';

let cleanupInitialized = false;
let cleanupDispose: (() => void) | null = null;

/**
 * Initialize automatic room cleanup
 * Call this once when your app starts
 */
export function initializeCleanup(intervalMinutes: number = 60): void {
  if (cleanupInitialized) {
    console.warn('Cleanup already initialized');
    return;
  }
  
  cleanupDispose = scheduleAutomaticCleanup(intervalMinutes);
  cleanupInitialized = true;
  
  console.log('✓ Room cleanup initialized');
}

/**
 * Stop automatic cleanup
 */
export function stopCleanup(): void {
  if (cleanupDispose) {
    cleanupDispose();
    cleanupDispose = null;
    cleanupInitialized = false;
    console.log('✓ Room cleanup stopped');
  }
}