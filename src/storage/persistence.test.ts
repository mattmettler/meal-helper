import { requestPersistence } from './persistence'

describe('requestPersistence', () => {
  it('resolves true when the browser grants persistence', async () => {
    expect(await requestPersistence({ persist: async () => true })).toBe(true)
  })

  it('resolves false when the browser declines', async () => {
    expect(await requestPersistence({ persist: async () => false })).toBe(false)
  })

  it('resolves false without throwing when storage is undefined', async () => {
    expect(await requestPersistence(undefined)).toBe(false)
  })

  it('resolves false without throwing when persist is missing', async () => {
    expect(await requestPersistence({} as Pick<StorageManager, 'persist'>)).toBe(false)
  })
})
