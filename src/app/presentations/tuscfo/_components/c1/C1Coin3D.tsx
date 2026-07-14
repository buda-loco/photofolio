'use client'

/**
 * Concepto 01 — la moneda.
 *
 * The monogram extruded onto both faces of a 3D coin (three.js). Drag to
 * rotate, colour the face / relief / edge independently from the approved
 * palettes, and export a Full HD PNG (transparent background) from any
 * position — un objeto de marca listo para cualquier pieza.
 */

import { useEffect, useRef, useState } from 'react'
import EditorShell from '../EditorShell'
import { Panel, Seg, Check, Swatches } from '../ui'
import { PALETTES, getPalette, paletteWithShades, remapColor, contrastRatio, type PaletteId } from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { downloadCanvasPNG } from '../exportUtils'
import { pick } from '../rand'
import { c1SvgString, C1_VIEW } from './geometry'

const INK = '#000000'
const PAPER = '#ffffff'

const COIN_RADIUS = 2.5
const COIN_HEIGHT = 0.34
const RELIEF_DEPTH = 0.09
// ring outer radius is C1_VIEW/2 svg units → sit it at 2.2 world units,
// leaving a clean margin inside the coin edge
const SVG_SCALE = 2.2 / (C1_VIEW / 2)

type CoinApi = {
  setColors: (face: string, side: string, relief: string) => void
  exportPNG: () => Promise<void>
  dispose: () => void
}

export default function C1Coin3D() {
  const hostRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<CoinApi | null>(null)

  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [face, setFace] = useState(PAPER)
  const [side, setSide] = useState(INK)
  const [relief, setRelief] = useState(INK)

  // Latest colours, readable from the async init (which may finish after
  // several renders) without re-running it.
  const colorsRef = useRef({ face, side, relief })
  colorsRef.current = { face, side, relief }

  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c1', paletteId, (next) => applyPalette(next))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false

    ;(async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
      const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js')
      if (disposed || !host.isConnected) return

      const scene = new THREE.Scene()
      scene.background = null // transparent — exports drop straight onto any design

      const camera = new THREE.PerspectiveCamera(35, host.clientWidth / host.clientHeight, 0.1, 100)
      camera.position.set(3.2, 3.4, 6.2)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(host.clientWidth, host.clientHeight)
      host.appendChild(renderer.domElement)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.autoRotate = true
      controls.autoRotateSpeed = 1.1
      controls.enablePan = false
      controls.minDistance = 4
      controls.maxDistance = 12

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1c2e30, 1.15))
      const key = new THREE.DirectionalLight(0xffffff, 1.7)
      key.position.set(3, 5, 4)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xffffff, 0.45)
      fill.position.set(-4, 2, -3)
      scene.add(fill)

      const matFace = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.22 })
      const matSide = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.22 })
      const matRelief = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.28 })

      const coin = new THREE.Group()
      scene.add(coin)

      // Body — CylinderGeometry material groups: [side, top, bottom]
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 128),
        [matSide, matFace, matFace],
      )
      coin.add(body)

      // Relief — the monogram extruded onto both faces
      const svgPaths = new SVGLoader().parse(c1SvgString()).paths
      const shapes = svgPaths.flatMap((p) => SVGLoader.createShapes(p))
      const reliefGeo = new THREE.ExtrudeGeometry(shapes, {
        depth: RELIEF_DEPTH,
        bevelEnabled: false,
        curveSegments: 24,
      })
      reliefGeo.translate(-C1_VIEW / 2, -C1_VIEW / 2, 0)
      reliefGeo.scale(SVG_SCALE, SVG_SCALE, 1)

      const topRelief = new THREE.Mesh(reliefGeo, matRelief)
      topRelief.rotation.x = Math.PI / 2
      topRelief.position.y = COIN_HEIGHT / 2 + RELIEF_DEPTH
      coin.add(topRelief)

      const bottomRelief = new THREE.Mesh(reliefGeo, matRelief)
      bottomRelief.rotation.x = -Math.PI / 2
      bottomRelief.position.y = -COIN_HEIGHT / 2 - RELIEF_DEPTH
      coin.add(bottomRelief)

      // gentle presentation tilt so the face reads on first paint
      coin.rotation.x = 0.35

      let raf = 0
      const tick = () => {
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      tick()

      const ro = new ResizeObserver(() => {
        if (!host.isConnected) return
        camera.aspect = host.clientWidth / host.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(host.clientWidth, host.clientHeight)
      })
      ro.observe(host)

      apiRef.current = {
        setColors: (f, s, r) => {
          matFace.color.set(f)
          matSide.color.set(s)
          matRelief.color.set(r)
        },
        exportPNG: async () => {
          // Render one Full HD frame off the live loop, capture, restore.
          const prevRatio = renderer.getPixelRatio()
          renderer.setPixelRatio(1)
          renderer.setSize(1920, 1080, false)
          camera.aspect = 1920 / 1080
          camera.updateProjectionMatrix()
          renderer.render(scene, camera)
          try {
            await downloadCanvasPNG(renderer.domElement, 'tuscfo-c1-moneda.png')
          } finally {
            renderer.setPixelRatio(prevRatio)
            renderer.setSize(host.clientWidth, host.clientHeight)
            camera.aspect = host.clientWidth / host.clientHeight
            camera.updateProjectionMatrix()
          }
        },
        dispose: () => {
          cancelAnimationFrame(raf)
          ro.disconnect()
          controls.dispose()
          renderer.dispose()
          reliefGeo.dispose()
          body.geometry.dispose()
          ;[matFace, matSide, matRelief].forEach((m) => m.dispose())
          renderer.domElement.remove()
        },
      }

      const c = colorsRef.current
      apiRef.current.setColors(c.face, c.side, c.relief)
    })()

    return () => {
      disposed = true
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [])

  // Push colour state into the live scene.
  useEffect(() => {
    apiRef.current?.setColors(face, side, relief)
  }, [face, side, relief])

  /** Palette click re-dresses the coin, not just the swatch pool. */
  const applyPalette = (next: PaletteId) => {
    const from = getPalette(paletteId)
    const to = getPalette(next)
    setPaletteId(next)
    setFace((c) => remapColor(c, from, to))
    setRelief((c) => remapColor(c, from, to))
    setSide((c) => remapColor(c, from, to))
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextPool = [PAPER, INK, ...(shades ? paletteWithShades(pal) : pal.colors)]
    let f = pick(nextPool)
    let r = pick(nextPool)
    // keep the coin as punchy as the reference — never a mushy combo
    for (let i = 0; i < 40 && contrastRatio(f, r) < 3; i++) {
      f = pick(nextPool)
      r = pick(nextPool)
    }
    setPaletteId(pal.id)
    setFace(f)
    setRelief(r)
    setSide(Math.random() < 0.6 ? r : f)
  }

  return (
    <EditorShell
      onSurprise={surprise}
      onExportPNG={() => void apiRef.current?.exportPNG()}
      exportLabel="PNG (Full HD, fondo transparente)"
      stage={
        <div
          ref={hostRef}
          style={{ position: 'absolute', inset: 0, cursor: 'grab' }}
          aria-label="Moneda 3D — arrastrá para rotar"
        />
      }
      panels={
        <>
          <Panel label="Paleta">
            <Seg
              options={PALETTES.map((p) => ({ value: p.id, label: p.id }))}
              value={paletteId}
              onChange={applyPalette}
            />
            <Check label="Jugar con tonos" checked={shades} onChange={setShades} />
          </Panel>
          <Panel label="Cara">
            <Swatches colors={pickerPool} value={face} onPick={setFace} small={shades} />
          </Panel>
          <Panel label="Relieve">
            <Swatches colors={pickerPool} value={relief} onPick={setRelief} small={shades} />
          </Panel>
          <Panel label="Canto">
            <Swatches colors={pickerPool} value={side} onPick={setSide} small={shades} />
          </Panel>
        </>
      }
    />
  )
}
