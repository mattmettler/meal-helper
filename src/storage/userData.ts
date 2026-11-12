import type { StepId, UserData } from '../logic/types'
import type { MealGuideDb } from './db'

export async function loadUserData(db: MealGuideDb): Promise<UserData> {
  const [customOptions, hidden, userPairs, userTips] = await Promise.all([
    db.customOptions.toArray(),
    db.hiddenBuiltIns.toArray(),
    db.userPairs.toArray(),
    db.userTips.toArray(),
  ])
  return { customOptions, hiddenBuiltIns: hidden.map((row) => row.optionId), userPairs, userTips }
}

export async function addCustomOption(
  db: MealGuideDb,
  input: { stepId: StepId; name: string; note?: string },
): Promise<string> {
  const id = crypto.randomUUID()
  const note = input.note?.trim()
  await db.customOptions.add({
    id,
    stepId: input.stepId,
    name: input.name.trim(),
    ...(note ? { note } : {}),
  })
  return id
}

export async function updateCustomOptionNote(db: MealGuideDb, optionId: string, note?: string): Promise<void> {
  const trimmed = note?.trim()
  await db.customOptions.update(optionId, { note: trimmed || undefined })
}

export async function hideBuiltInOption(db: MealGuideDb, optionId: string): Promise<void> {
  await db.hiddenBuiltIns.put({ optionId })
}

export async function restoreBuiltInOption(db: MealGuideDb, optionId: string): Promise<void> {
  await db.hiddenBuiltIns.delete(optionId)
}

async function deletePairsInvolving(db: MealGuideDb, optionId: string): Promise<void> {
  await db.userPairs.where('optionIdA').equals(optionId).delete()
  await db.userPairs.where('optionIdB').equals(optionId).delete()
}

export async function deleteCustomOption(db: MealGuideDb, optionId: string): Promise<void> {
  await db.transaction('rw', [db.customOptions, db.userPairs, db.userTips], async () => {
    await db.customOptions.delete(optionId)
    await deletePairsInvolving(db, optionId)
    await db.userTips.where('optionId').equals(optionId).delete()
  })
}

export async function setClashes(db: MealGuideDb, optionId: string, otherIds: string[]): Promise<void> {
  const distinctOthers = [...new Set(otherIds)].filter((id) => id !== optionId)
  await db.transaction('rw', db.userPairs, async () => {
    await deletePairsInvolving(db, optionId)
    await db.userPairs.bulkAdd(
      distinctOthers.map((otherId) => ({ id: crypto.randomUUID(), optionIdA: optionId, optionIdB: otherId })),
    )
  })
}

export async function addUserTip(db: MealGuideDb, optionId: string, text: string): Promise<void> {
  await db.userTips.add({ optionId, text: text.trim() })
}

export async function deleteUserTip(db: MealGuideDb, tipId: string): Promise<void> {
  await db.userTips.delete(Number(tipId))
}
