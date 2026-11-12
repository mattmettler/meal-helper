import { backupFileName } from './backupFileName'

describe('backupFileName', () => {
  it('names the file after the local date', () => {
    expect(backupFileName(new Date(2026, 10, 5, 23, 59))).toBe('meal-guide-backup-2026-11-05.json')
  })
})
