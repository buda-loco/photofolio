'use client'

import { memo, useEffect, useState } from 'react'
import { deletePreset, deserializePreset, loadPresets, savePreset, serializePreset, type Preset } from './presets'
import type { ToolParams } from './BrandAssetTool'

type Props = {
  // A getter, NOT the params object: taking params as a prop would
  // re-render this panel on every canvas drag frame and defeat the memo
  // below. The getter reads a ref BrandAssetTool keeps current, so Save /
  // Copy always snapshot the exact params at click time.
  getParams: () => ToolParams
  onApply: (params: ToolParams) => void
}

function PresetsPanel({ getParams, onApply }: Props) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [name, setName] = useState('')
  const [codeText, setCodeText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  // localStorage isn't available during SSR — load after mount, same
  // reasoning as useToolPersistence.
  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3500)
    return () => clearTimeout(t)
  }, [feedback])

  const handleSave = () => {
    const trimmed = name.trim() || `Preset ${presets.length + 1}`
    setPresets(savePreset(trimmed, getParams()))
    setName('')
    setFeedback(`Saved "${trimmed}"`)
  }

  const handleCopy = async () => {
    const code = serializePreset(getParams())
    try {
      await navigator.clipboard.writeText(code)
      setFeedback('Share code copied to clipboard')
    } catch {
      // Clipboard API can be unavailable (non-secure context, packaged
      // file:// builds) — fall back to showing the code for manual copy.
      setCodeText(code)
      setFeedback('Clipboard unavailable — code shown below, copy it manually')
    }
  }

  const handleImport = () => {
    const parsed = deserializePreset(codeText)
    if (!parsed) {
      setFeedback('Not a valid share code')
      return
    }
    onApply(parsed)
    setCodeText('')
    setFeedback('Imported — canvas updated')
  }

  return (
    <div className="pw-controls" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          className="pw-text-input"
          type="text"
          placeholder="Preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
        />
        <button type="button" className="pw-btn pw-btn--solid" onClick={handleSave}>Save preset</button>
      </div>

      {presets.length === 0 ? (
        <span className="pw-preset-empty">No saved presets yet — dial in a design and save it here.</span>
      ) : (
        <ul className="pw-preset-list">
          {presets.map((p) => (
            <li key={p.id}>
              <span className="pw-preset-name" title={new Date(p.created).toLocaleString()}>{p.name}</span>
              <button
                type="button"
                className="pw-btn"
                onClick={() => {
                  onApply(p.params)
                  setFeedback(`Loaded "${p.name}"`)
                }}
              >
                Load
              </button>
              <button type="button" className="pw-btn" onClick={() => setPresets(deletePreset(p.id))}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <span className="pw-swatch-subtitle">Share code</span>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="pw-btn pw-btn--solid" onClick={handleCopy}>Copy code</button>
        <button type="button" className="pw-btn" onClick={handleImport} disabled={codeText.trim() === ''}>Import code</button>
      </div>
      <textarea
        className="pw-code-area"
        rows={3}
        placeholder="Paste a share code here, then Import"
        value={codeText}
        onChange={(e) => setCodeText(e.target.value)}
        spellCheck={false}
      />

      {feedback && <span className="pw-preset-feedback" role="status">{feedback}</span>}
    </div>
  )
}

// Memoised: both props are stable callbacks from BrandAssetTool (see the
// getParams comment above for why params itself is deliberately not a prop).
export default memo(PresetsPanel)
