/**
 * Encrypted key-value storage, backed by the platform keystore.
 *
 * iOS uses the Keychain, Android uses Keystore-encrypted SharedPreferences.
 * SecureStore has no web implementation, so web falls back to memory: values
 * are lost on reload, which is the correct trade-off — a browser tab has no
 * equivalent of the keychain, and localStorage is readable by any script on
 * the page, so tokens must never go there.
 *
 * SecureStore keys are restricted to alphanumerics, '.', '-' and '_'.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface SecureStorage {
  /** True when values survive an app restart. */
  readonly isPersistent: boolean;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

function assertValidKey(key: string): void {
  if (!KEY_PATTERN.test(key)) {
    throw new Error(`Invalid secure storage key: ${key}`);
  }
}

class KeychainStorage implements SecureStorage {
  readonly isPersistent = true;

  private readonly options: SecureStore.SecureStoreOptions = {
    keychainService: 'blugo',
    // Readable after the first unlock so a session can be restored while the
    // app warms up in the background, but never while the device is locked.
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  };

  async getItem(key: string): Promise<string | null> {
    assertValidKey(key);
    try {
      return await SecureStore.getItemAsync(key, this.options);
    } catch {
      // A corrupt or keystore-invalidated entry is indistinguishable from an
      // absent one for our purposes: the user simply signs in again.
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    assertValidKey(key);
    await SecureStore.setItemAsync(key, value, this.options);
  }

  async removeItem(key: string): Promise<void> {
    assertValidKey(key);
    try {
      await SecureStore.deleteItemAsync(key, this.options);
    } catch {
      // Deleting something that is already gone is a success for callers.
    }
  }
}

class MemoryStorage implements SecureStorage {
  readonly isPersistent = false;
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const secureStorage: SecureStorage =
  Platform.OS === 'web' ? new MemoryStorage() : new KeychainStorage();
