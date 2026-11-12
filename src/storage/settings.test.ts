import { createDb } from './db'
import { getLastBackupAt, recordBackupExport } from './settings'

let counter = 0
function freshName() {
  counter += 1
  return `settings-db-${counter}-${Date.now()}`
}

describe('backup settings', () => {
  it('has no last backup time at first', async () => {
    const db = createDb(freshName())
    expect(await getLastBackupAt(db)).toBeNull()
    db.close()
  })

  it('returns the time recorded by the last export', async () => {
    const name = freshName()
    const db = createDb(name)
    await recordBackupExport(db, 111)
    await recordBackupExport(db, 222)
    db.close()

    const reopened = createDb(name)
    expect(await getLastBackupAt(reopened)).toBe(222)
    reopened.close()
  })
})
