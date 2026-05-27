const STORAGE_KEY = 'active-provider-key-id';
export const ACTIVE_PROVIDER_KEY_EVENT = 'active-provider-key-changed';

export function getActiveProviderKeyId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveProviderKeyId(keyId: string): void {
  localStorage.setItem(STORAGE_KEY, keyId);
  window.dispatchEvent(new CustomEvent(ACTIVE_PROVIDER_KEY_EVENT));
}

export function clearActiveProviderKeyId(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ACTIVE_PROVIDER_KEY_EVENT));
}
