import { createDb } from './db'
import {
  addCustomOption, addCustomOptionWithClashes, addUserTip, deleteCustomOption, deleteUserTip, hideBuiltInOption,
  loadUserData, restoreBuiltInOption, setClashes, updateCustomOptionNote,
} from './userData'

let counter = 0
function freshName() {
  counter += 1
  return `test-db-${counter}-${Date.now()}`
}

describe('custom options', () => {
  it('persists an added option across reopen', async () => {
    const name = freshName()
    const db = createDb(name)
    const id = await addCustomOption(db, { stepId: 'sauces', name: '  Chili crisp ', note: 'spicy' })
    db.close()

    const reopened = createDb(name)
    const data = await loadUserData(reopened)
    expect(data.customOptions).toEqual([{ id, stepId: 'sauces', name: 'Chili crisp', note: 'spicy' }])
    reopened.close()
  })

  it('persists a changed note and clears it with undefined', async () => {
    const name = freshName()
    const db = createDb(name)
    const id = await addCustomOption(db, { stepId: 'greens', name: 'Kale' })
    await updateCustomOptionNote(db, id, 'massaged')
    db.close()

    const reopened = createDb(name)
    expect((await loadUserData(reopened)).customOptions[0].note).toBe('massaged')
    await updateCustomOptionNote(reopened, id, undefined)
    reopened.close()

    const again = createDb(name)
    expect((await loadUserData(again)).customOptions[0].note).toBeUndefined()
    again.close()
  })

  it('deleteCustomOption removes the option, its clashes on either side, and its tips only', async () => {
    const db = createDb(freshName())
    const a = await addCustomOption(db, { stepId: 'greens', name: 'A' })
    const b = await addCustomOption(db, { stepId: 'greens', name: 'B' })
    const c = await addCustomOption(db, { stepId: 'greens', name: 'C' })
    await setClashes(db, a, [b])
    await setClashes(db, c, ['built-in-1', a])
    await setClashes(db, b, [a, 'built-in-2'])
    await addUserTip(db, a, 'tip for a')
    await addUserTip(db, b, 'tip for b')

    await deleteCustomOption(db, a)

    const data = await loadUserData(db)
    expect(data.customOptions.map((o) => o.id)).toEqual([b, c].sort((x, y) => x.localeCompare(y)))
    expect(data.userPairs.map((p) => [p.optionIdA, p.optionIdB].sort())).toEqual(
      expect.arrayContaining([[b, 'built-in-2'].sort(), [c, 'built-in-1'].sort()]),
    )
    expect(data.userPairs).toHaveLength(2)
    expect(data.userTips.map((t) => t.text)).toEqual(['tip for b'])
    db.close()
  })
})

describe('hidden built-ins', () => {
  it('hiding persists and restoring removes the row', async () => {
    const name = freshName()
    const db = createDb(name)
    await hideBuiltInOption(db, 'rice')
    await hideBuiltInOption(db, 'kale')
    db.close()

    const reopened = createDb(name)
    expect((await loadUserData(reopened)).hiddenBuiltIns.sort()).toEqual(['kale', 'rice'])
    await restoreBuiltInOption(reopened, 'rice')
    expect((await loadUserData(reopened)).hiddenBuiltIns).toEqual(['kale'])
    reopened.close()
  })

  it('hiding leaves the option pairs and tips in place', async () => {
    const db = createDb(freshName())
    await setClashes(db, 'rice', ['kale'])
    await addUserTip(db, 'rice', 'toast it first')
    await hideBuiltInOption(db, 'rice')

    const data = await loadUserData(db)
    expect(data.userPairs).toHaveLength(1)
    expect(data.userTips).toHaveLength(1)
    db.close()
  })
})

describe('setClashes', () => {
  it('replaces earlier pairs involving the option, keeps others, dedupes, ignores itself', async () => {
    const db = createDb(freshName())
    await setClashes(db, 'x', ['p', 'q'])
    await setClashes(db, 'r', ['s'])
    await setClashes(db, 'p', ['x'])

    await setClashes(db, 'x', ['t', 't', 'x', 'u'])

    const data = await loadUserData(db)
    const pairs = data.userPairs.map((row) => [row.optionIdA, row.optionIdB].sort().join('|')).sort()
    expect(pairs).toEqual(['r|s', 't|x', 'u|x'])
    db.close()
  })
})

describe('user tips', () => {
  it('come back in the order added and deleteUserTip removes only that tip', async () => {
    const name = freshName()
    const db = createDb(name)
    await addUserTip(db, 'rice', '  first ')
    await addUserTip(db, 'kale', 'second')
    await addUserTip(db, 'rice', 'third')
    db.close()

    const reopened = createDb(name)
    const data = await loadUserData(reopened)
    expect(data.userTips.map((t) => t.text)).toEqual(['first', 'second', 'third'])

    await deleteUserTip(reopened, String(data.userTips[1].id))
    expect((await loadUserData(reopened)).userTips.map((t) => t.text)).toEqual(['first', 'third'])
    reopened.close()
  })
})

describe('adding an option with its clashes', () => {
  it('saves the option and its clashes together', async () => {
    const db = createDb(freshName())
    const id = await addCustomOptionWithClashes(db, { stepId: 'sauces', name: 'Chili crisp' }, ['a', 'b'])
    const data = await loadUserData(db)
    expect(data.customOptions.map((o) => o.id)).toEqual([id])
    expect(data.userPairs.map((p) => p.optionIdB).sort()).toEqual(['a', 'b'])
    db.close()
  })

  it('leaves no option behind when saving the clashes fails', async () => {
    const db = createDb(freshName())
    // Repeated ids make the second clash row collide, so the clash write fails.
    const spy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000')
    try {
      await expect(
        addCustomOptionWithClashes(db, { stepId: 'sauces', name: 'Chili crisp' }, ['a', 'b']),
      ).rejects.toThrow()
    } finally {
      spy.mockRestore()
    }
    const data = await loadUserData(db)
    expect(data.customOptions).toEqual([])
    expect(data.userPairs).toEqual([])
    db.close()
  })
})
