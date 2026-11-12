import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SEED } from '../content/seed'
import { createDb } from '../storage/db'
import { addCustomOption } from '../storage/userData'
import { useCatalog } from './useCatalog'

let dbCount = 0
const freshDb = () => createDb(`use-catalog-${dbCount++}`)

describe('useCatalog', () => {
  it('is undefined until loaded, then holds the seed options', async () => {
    const { result } = renderHook(() => useCatalog(freshDb()))
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toBeDefined())
    expect(result.current!.options.length).toBe(SEED.options.length)
  })

  it('updates when a custom option is added', async () => {
    const db = freshDb()
    const { result } = renderHook(() => useCatalog(db))
    await waitFor(() => expect(result.current).toBeDefined())
    await addCustomOption(db, { stepId: 'starch', name: 'Purple rice' })
    await waitFor(() => expect(result.current!.options.some((o) => o.name === 'Purple rice')).toBe(true))
  })
})
