import { createDb, type MealGuideDb } from './db'
import {
  BACKUP_APP, BACKUP_FORMAT_VERSION, exportBackup, importBackup, parseBackup, serializeBackup, summarizeBackup,
  type BackupFile,
} from './backup'
import { recordBackupExport } from './settings'
import { saveMeal, setFavorite } from './savedMeals'
import { addCustomOption, addUserTip, hideBuiltInOption, setClashes } from './userData'

let counter = 0
function freshName() {
  counter += 1
  return `backup-db-${counter}-${Date.now()}`
}

async function populate(db: MealGuideDb) {
  const sauce = await addCustomOption(db, { stepId: 'sauces', name: 'Chili crisp', note: 'spicy' })
  const green = await addCustomOption(db, { stepId: 'greens', name: 'Kale' })
  await setClashes(db, sauce, [green, 'rice'])
  await addUserTip(db, sauce, 'first tip')
  await addUserTip(db, 'rice', 'second tip')
  await addUserTip(db, green, 'third tip')
  await hideBuiltInOption(db, 'tofu')
  await hideBuiltInOption(db, 'egg')
  const mealId = await saveMeal(db, {
    name: 'Cozy',
    groups: [{ stepName: 'Starch', items: [{ optionName: 'Rice', tips: ['Toast it'] }] }],
  }, 5)
  await setFavorite(db, mealId, true)
  await recordBackupExport(db, 99)
}

async function sampleFile(): Promise<BackupFile> {
  const db = createDb(freshName())
  await populate(db)
  const file = await exportBackup(db, 1234)
  db.close()
  return file
}

const NOT_A_BACKUP = { ok: false, error: "That doesn't look like a backup from this app" }

describe('export and import', () => {
  it('round-trips every table into a fresh database, keeping tip ids and order', async () => {
    const source = createDb(freshName())
    await populate(source)
    const file = await exportBackup(source, 1234)
    const text = serializeBackup(file)
    source.close()

    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const target = createDb(freshName())
    await importBackup(target, parsed.file)
    expect(await exportBackup(target, 1234)).toEqual(file)
    expect((await target.userTips.toArray()).map((tip) => tip.text)).toEqual(['first tip', 'second tip', 'third tip'])
    expect(file.data.hiddenBuiltIns).toHaveLength(2)
    expect(file.data.userPairs).toHaveLength(2)
    target.close()
  })

  it('identifies the app and format, and leaves out settings', async () => {
    const file = await sampleFile()
    expect(file).toMatchObject({ app: BACKUP_APP, formatVersion: BACKUP_FORMAT_VERSION, exportedAt: 1234 })
    expect(Object.keys(file.data).sort()).toEqual(
      ['customOptions', 'hiddenBuiltIns', 'savedMeals', 'userPairs', 'userTips'],
    )
    expect(serializeBackup(file)).not.toContain('settings')
  })

  it('replaces existing data on import', async () => {
    const file = await sampleFile()
    const target = createDb(freshName())
    await addCustomOption(target, { stepId: 'garnish', name: 'Only in old' })
    await addUserTip(target, 'rice', 'old tip')
    await hideBuiltInOption(target, 'old-hidden')
    await saveMeal(target, { name: 'Old meal', groups: [] })
    await importBackup(target, file)
    expect(await exportBackup(target, 1234)).toEqual(file)
    target.close()
  })

  it('rejects duplicate ids on import and leaves existing data intact', async () => {
    const file = await sampleFile()
    const target = createDb(freshName())
    await addCustomOption(target, { stepId: 'garnish', name: 'Keep me' })
    const before = await exportBackup(target, 1)
    const duplicated: BackupFile = {
      ...file,
      data: { ...file.data, customOptions: [file.data.customOptions[0], file.data.customOptions[0]] },
    }
    await expect(importBackup(target, duplicated)).rejects.toThrow()
    expect(await exportBackup(target, 1)).toEqual(before)
    target.close()
  })
})

describe('parseBackup', () => {
  it('accepts a serialized export', async () => {
    const file = await sampleFile()
    expect(parseBackup(serializeBackup(file))).toEqual({ ok: true, file })
  })

  it('rejects text that is not a backup', async () => {
    const file = await sampleFile()
    const text = serializeBackup(file)
    const withoutTable = { ...file, data: { ...file.data, savedMeals: undefined } }
    const nonArrayTable = { ...file, data: { ...file.data, userPairs: {} } }
    const badRow = {
      ...file,
      data: { ...file.data, savedMeals: [{ ...file.data.savedMeals[0], groups: 'nope' }] },
    }
    const cases = [
      'not json',
      text.slice(0, text.length - 10),
      'null',
      '[]',
      JSON.stringify({ ...file, app: 'something-else' }),
      JSON.stringify(withoutTable),
      JSON.stringify(nonArrayTable),
      JSON.stringify(badRow),
    ]
    for (const bad of cases) expect(parseBackup(bad)).toEqual(NOT_A_BACKUP)
  })

  it('rejects a newer format version', async () => {
    const file = await sampleFile()
    expect(parseBackup(JSON.stringify({ ...file, formatVersion: 2 }))).toEqual({
      ok: false, error: 'This backup is from a newer version of the app',
    })
  })

  it('rejects duplicate ids within one table', async () => {
    const file = await sampleFile()
    const dupOptions = { ...file, data: { ...file.data, customOptions: [file.data.customOptions[0], file.data.customOptions[0]] } }
    const dupTips = { ...file, data: { ...file.data, userTips: [file.data.userTips[0], file.data.userTips[0]] } }
    const dupHidden = { ...file, data: { ...file.data, hiddenBuiltIns: [{ optionId: 'a' }, { optionId: 'a' }] } }
    for (const bad of [dupOptions, dupTips, dupHidden]) expect(parseBackup(JSON.stringify(bad)).ok).toBe(false)
  })
})

describe('summarizeBackup', () => {
  it('counts what a restore would bring back', async () => {
    const file = await sampleFile()
    expect(summarizeBackup(file)).toEqual({ customOptions: 2, tips: 3, clashes: 2, hiddenOptions: 2, savedMeals: 1 })
  })
})
