// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { serializePreset, deserializePreset, loadPresets, savePreset, deletePreset } from './presets'
import { DEFAULT_PARAMS, mergeParamsWithDefaults, type ToolParams } from './BrandAssetTool'

describe('mergeParamsWithDefaults', () => {
  it('backfills nested fields added after the data was saved (the v2 avoidance bug)', () => {
    // Simulates state persisted under the v2 key BEFORE mask.avoid /
    // avoidStrength / logo.visible / breadth / messMultiplier existed.
    const old = JSON.parse(JSON.stringify(DEFAULT_PARAMS)) as Record<string, unknown>
    const oldMask = old.mask as Record<string, unknown>
    delete oldMask.avoid
    delete oldMask.avoidStrength
    const oldLogo = old.logo as Record<string, unknown>
    delete oldLogo.visible
    delete old.breadth
    delete old.messMultiplier
    oldMask.x = 111 // saved values must survive the merge

    const merged = mergeParamsWithDefaults(old as Partial<ToolParams>)
    expect(merged.mask.avoid).toBe(DEFAULT_PARAMS.mask.avoid)
    expect(merged.mask.avoidStrength).toBe(DEFAULT_PARAMS.mask.avoidStrength)
    expect(merged.logo.visible).toBe(DEFAULT_PARAMS.logo.visible)
    expect(merged.breadth).toBe(DEFAULT_PARAMS.breadth)
    expect(merged.messMultiplier).toBe(DEFAULT_PARAMS.messMultiplier)
    expect(merged.mask.x).toBe(111)
  })

  it('is an identity for complete, current-schema params', () => {
    expect(mergeParamsWithDefaults(DEFAULT_PARAMS)).toEqual(DEFAULT_PARAMS)
  })
})

describe('share codes', () => {
  it('round-trips the full params object', () => {
    const code = serializePreset(DEFAULT_PARAMS)
    expect(deserializePreset(code)).toEqual(DEFAULT_PARAMS)
  })

  it('codes are single-line printable ASCII (safe to paste in chat/email)', () => {
    const code = serializePreset(DEFAULT_PARAMS)
    expect(code).toMatch(/^PW1\.[A-Za-z0-9+/=]+$/)
  })

  it('rejects garbage, wrong prefixes, and non-params JSON', () => {
    expect(deserializePreset('')).toBeNull()
    expect(deserializePreset('hello world')).toBeNull()
    expect(deserializePreset('XX1.' + btoa('{}'))).toBeNull() // wrong prefix
    expect(deserializePreset('PW1.not-base64!!!')).toBeNull()
    expect(deserializePreset('PW1.' + btoa('{"foo": 1}'))).toBeNull() // valid JSON, not tool params
    expect(deserializePreset('PW1.' + btoa('[1,2,3]'))).toBeNull()
  })

  it('tolerates surrounding whitespace (as pasted from chat)', () => {
    const code = serializePreset(DEFAULT_PARAMS)
    expect(deserializePreset(`  ${code}\n`)).toEqual(DEFAULT_PARAMS)
  })
})

describe('preset storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(loadPresets()).toEqual([])
  })

  it('save → load → delete round trip', () => {
    const afterSave = savePreset('My tangle', DEFAULT_PARAMS)
    expect(afterSave).toHaveLength(1)
    expect(afterSave[0].name).toBe('My tangle')
    expect(afterSave[0].params).toEqual(DEFAULT_PARAMS)

    expect(loadPresets()).toEqual(afterSave)

    const afterDelete = deletePreset(afterSave[0].id)
    expect(afterDelete).toEqual([])
    expect(loadPresets()).toEqual([])
  })

  it('drops corrupt entries instead of failing the whole list', () => {
    savePreset('good', DEFAULT_PARAMS)
    const raw = JSON.parse(localStorage.getItem('pw-tool-presets-v1')!)
    raw.push({ id: 'bad' }) // missing name/params
    raw.push('not even an object')
    localStorage.setItem('pw-tool-presets-v1', JSON.stringify(raw))
    const loaded = loadPresets()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('good')
  })

  it('returns [] (not throw) on corrupt storage', () => {
    localStorage.setItem('pw-tool-presets-v1', '{broken')
    expect(loadPresets()).toEqual([])
  })
})
