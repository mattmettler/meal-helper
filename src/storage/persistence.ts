export async function requestPersistence(
  storage: Pick<StorageManager, 'persist'> | undefined = navigator.storage,
): Promise<boolean> {
  if (typeof storage?.persist !== 'function') return false
  try {
    return await storage.persist()
  } catch {
    return false
  }
}
