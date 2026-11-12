import { useLiveQuery } from 'dexie-react-hooks'
import { SEED } from '../content/seed'
import { buildCatalog } from '../logic/catalog'
import type { Catalog } from '../logic/types'
import type { MealGuideDb } from '../storage/db'
import { db as appDb } from '../storage/instance'
import { loadUserData } from '../storage/userData'

export function useCatalog(db: MealGuideDb = appDb): Catalog | undefined {
  return useLiveQuery(async () => buildCatalog(SEED, await loadUserData(db)), [db])
}
