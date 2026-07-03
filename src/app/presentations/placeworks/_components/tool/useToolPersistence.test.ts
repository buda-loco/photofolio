// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPersistedParams, savePersistedParams, STORAGE_KEY } from './useToolPersistence'

describe('persistence helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadPersistedParams()).toBeNull()
  })

  it('round-trips a saved object', () => {
    savePersistedParams({ seed: 5, lines: 10 })
    expect(loadPersistedParams()).toEqual({ seed: 5, lines: 10 })
  })

  it('returns null (not throw) on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    expect(loadPersistedParams()).toBeNull()
  })
})
