import { requireOptionalNativeModule } from 'expo';

/**
 * Hides Expo’s floating blue tools/gear button. Shake or ⌘D still opens the menu.
 * No-ops in production and when the native module is missing (web).
 */
export function hideFloatingDevToolsButton() {
  if (!__DEV__) return;
  try {
    const prefs = requireOptionalNativeModule('DevMenuPreferences') as {
      setPreferencesAsync?: (next: { showFloatingActionButton: boolean }) => Promise<void>;
    } | null;
    void prefs?.setPreferencesAsync?.({ showFloatingActionButton: false });
  } catch {
    // Keep the rest of the app running if the menu module is unavailable.
  }
}
