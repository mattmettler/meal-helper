import { backupReminder } from './backupReminder'

const DAY = 24 * 60 * 60 * 1000
const now = 1_700_000_000_000

describe('backupReminder', () => {
  it('is false when never backed up and no meals are saved', () => {
    expect(backupReminder({ lastBackupAt: null, now, savedMealCount: 0 })).toBe(false)
  })

  it('is true when never backed up and a meal is saved', () => {
    expect(backupReminder({ lastBackupAt: null, now, savedMealCount: 1 })).toBe(true)
  })

  it('is false 29 days after the last backup', () => {
    expect(backupReminder({ lastBackupAt: now - 29 * DAY, now, savedMealCount: 3 })).toBe(false)
  })

  it('is false exactly 30 days after the last backup', () => {
    expect(backupReminder({ lastBackupAt: now - 30 * DAY, now, savedMealCount: 3 })).toBe(false)
  })

  it('is true 31 days after the last backup', () => {
    expect(backupReminder({ lastBackupAt: now - 31 * DAY, now, savedMealCount: 3 })).toBe(true)
  })

  it('is false when the last backup is in the future', () => {
    expect(backupReminder({ lastBackupAt: now + DAY, now, savedMealCount: 3 })).toBe(false)
  })
})
