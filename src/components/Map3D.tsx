'use client'

import { useEffect, useRef } from 'react'
// types only — the runtime module is imported inside the effect, on demand
import type * as THREE from 'three'

/**
 * The Shoreline lot map, as a portfolio exhibit rather than a sales tool.
 *
 * Same GLB and palette as the client's site, but no UI: the camera orbits on
 * its own and the lots ripple up and down in sequence — a demo of the hover
 * behaviour for a visitor who never moves the mouse. Real hover still works
 * and wins over the ripple while the pointer is on a lot.
 *
 * three is imported on demand so pages without a map never download it.
 */
type Props = {
  model: string
  parcels?: string
  caption?: string
  mode?: 'site' | 'blueprint'
  aerial?: string
  aspect?: number       // width / height of the stage, for camera framing
}

const BP = {
  bg: 0x08192b,
  paper: 0x0c2438,
  grid: 0x18405e,
  line: 0x4fb6e0,
  lotEdge: 0xcdeeff,
  stage: { 1: 0x8fdcf2, 2: 0x3e9bd0, 3: 0x1e5a8c } as Record<number, number>,
  status: { reserved: 0xe8b54a, sold: 0xe0605f } as Record<string, number>,
}

// Warm scheme for the aerial view — the blueprint blues vanish against a photo
const SITE = {
  bg: 0xefeae0,
  road: 0x8c949b,
  verge: 0xa8c96e,
  stage: { 1: 0xe3b183, 2: 0xbfc9c2, 3: 0x6e7a80 } as Record<number, number>,
}

const LIFT = 14          // world units a hovered lot rises, matching the client build
const RIPPLE_SPEED = 1.7 // radians per second along the wave
const RIPPLE_PHASE = 0.42 // phase step between neighbouring lots
const ORBIT_SPEED = 0.11 // radians per second around the site

export default function Map3D({ model, parcels, caption, mode = 'site', aerial, aspect = 1 }: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      if (disposed) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.NoToneMapping
      el.appendChild(renderer.domElement)

      const blue = mode === 'blueprint'
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(blue ? BP.bg : SITE.bg)
      scene.fog = new THREE.Fog(blue ? BP.bg : SITE.bg, 900, 2200)

      const camera = new THREE.PerspectiveCamera(42, 1, 1, 4000)
      const target = new THREE.Vector3(30, 0, 0)
      // a wider frame needs less distance to hold the whole site
      const radius = aspect >= 1.4 ? 520 : 620
      const polar = THREE.MathUtils.degToRad(50)

      scene.add(new THREE.HemisphereLight(0x9fd8f5, 0x0a1d30, 1.15))
      const sun = new THREE.DirectionalLight(0xbfe6ff, 0.85)
      sun.position.set(-220, 380, 240)
      scene.add(sun)

      if (blue) {
        const grid = new THREE.GridHelper(1400, 56, BP.grid, BP.grid)
        ;(grid.material as THREE.Material).transparent = true
        ;(grid.material as THREE.Material).opacity = 0.35
        grid.position.y = -0.4
        scene.add(grid)
      }

      // lot status from the same parcels.json the site reads, so a sold lot is
      // red here too — the demo shows the real state, not a decorative one
      let status: Record<number, string> = {}
      let stage: Record<number, number> = {}
      let aer: Record<string, any> | null = null
      if (parcels) {
        try {
          const j = await fetch(parcels).then(r => r.json())
          for (const l of j.lots ?? []) { status[l.lot] = l.status; stage[l.lot] = l.stage }
          aer = j.aerial ?? null
        } catch { /* map still renders, just without status colours */ }
      }

      // The aerial photo, placed exactly as the client build places it:
      // origin_px lands on the world origin, then the photo rotates under the
      // estate. The plane keeps rotation.x = -90° inside a group that carries
      // the yaw, which is what keeps that mapping true for any angle.
      if (!blue && aerial && aer && aer.show !== false) {
        const tex = await new THREE.TextureLoader().loadAsync(aerial).catch(() => null)
        if (tex && !disposed) {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
          const m = aer.m_per_px ?? 1.25, W = aer.width_px ?? 1601, H = aer.height_px ?? 982
          const [ox, oy] = aer.origin_px ?? [0, 0]
          const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(W * m, H * m),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: aer.opacity ?? 0.97, depthWrite: false, toneMapped: false })
          )
          plane.rotation.x = -Math.PI / 2
          plane.renderOrder = -1
          plane.position.set((W / 2 - ox) * m, 0, (H / 2 - oy) * m)
          const g = new THREE.Group()
          g.position.y = aer.y_offset_m ?? -1.7
          g.rotation.y = -THREE.MathUtils.degToRad(aer.rotation_deg ?? 0)
          g.add(plane)
          scene.add(g)
        }
      }

      type Lot = { mesh: THREE.Mesh; y0: number; lift: number; target: number; base: THREE.Color; idx: number }
      const lots: Lot[] = []
      const gltf = await new GLTFLoader().loadAsync(model)
      if (disposed) return
      const root = gltf.scene
      root.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return
        const m = o as THREE.Mesh
        const hit = /^Lot_(\d+)/.exec(m.name)
        if (hit) {
          const n = parseInt(hit[1], 10)
          const st = status[n]
          const pal = blue ? BP.stage : SITE.stage
          const col = new THREE.Color(BP.status[st] ?? pal[stage[n] ?? 1] ?? pal[1])
          m.material = new THREE.MeshStandardMaterial({ color: col, roughness: 0.92, metalness: 0 })
          if (blue) m.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(m.geometry, 20),
            new THREE.LineBasicMaterial({ color: BP.lotEdge, transparent: true, opacity: 0.55 })
          ))
          lots.push({ mesh: m, y0: m.position.y, lift: 0, target: 0, base: col.clone(), idx: n })
        } else if (m.name.startsWith('Terrain')) {
          if (blue) {
            m.material = new THREE.MeshStandardMaterial({ color: BP.paper, roughness: 1, metalness: 0 })
            m.add(new THREE.LineSegments(
              new THREE.WireframeGeometry(m.geometry),
              new THREE.LineBasicMaterial({ color: 0x2c6e96, transparent: true, opacity: 0.18 })
            ))
          } else {
            m.visible = false           // the photo is the ground in site mode
          }
        } else if (blue) {
          m.material = new THREE.MeshStandardMaterial({ color: BP.paper, roughness: 1, metalness: 0 })
          m.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(m.geometry, 25),
            new THREE.LineBasicMaterial({ color: BP.line, transparent: true, opacity: 0.7 })
          ))
        } else {
          const c = m.name.startsWith('Verge') ? SITE.verge : SITE.road
          m.material = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 })
        }
      })
      scene.add(root)
      // ripple runs in lot-number order, which is the order they sit along the road
      lots.sort((a, b) => a.idx - b.idx)

      // hover: real raycast against the lot meshes, wins over the ripple
      const ray = new THREE.Raycaster()
      const ptr = new THREE.Vector2(-9, -9)
      let hovered: Lot | null = null
      const onMove = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect()
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      }
      const onLeave = () => ptr.set(-9, -9)
      renderer.domElement.addEventListener('pointermove', onMove)
      renderer.domElement.addEventListener('pointerleave', onLeave)

      const resize = () => {
        const w = el.clientWidth || 1
        const h = el.clientHeight || w
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      const ro = new ResizeObserver(resize)
      ro.observe(el)
      resize()

      // only spend GPU while the block is on screen
      let visible = true
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting }, { threshold: 0.05 })
      io.observe(el)

      let raf = 0
      let t0 = performance.now()
      let theta = THREE.MathUtils.degToRad(12)
      // a real Color: lerping toward a Vector3 read NaN from .r/.g/.b and
      // turned every lot black on the first frame
      const white = new THREE.Color(1, 1, 1)

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame)
        if (!visible) return
        const dt = Math.min((now - t0) / 1000, 0.05)
        t0 = now
        const t = now / 1000

        if (!reduced) theta += ORBIT_SPEED * dt
        camera.position.set(
          target.x + radius * Math.sin(polar) * Math.sin(theta),
          target.y + radius * Math.cos(polar),
          target.z + radius * Math.sin(polar) * Math.cos(theta)
        )
        camera.lookAt(target)

        ray.setFromCamera(ptr, camera)
        const hits = ray.intersectObjects(lots.map(l => l.mesh), false)
        hovered = hits.length ? lots.find(l => l.mesh === hits[0].object) ?? null : null

        lots.forEach((L, i) => {
          // a travelling wave, squared so each key pops and settles rather than
          // rolling — the piano-key read comes from the sharp attack
          const w = reduced ? 0 : Math.max(0, Math.sin(t * RIPPLE_SPEED - i * RIPPLE_PHASE))
          L.target = L === hovered ? LIFT : w * w * LIFT * 0.75
          L.lift += (L.target - L.lift) * 0.12
          L.mesh.position.y = L.y0 + L.lift
          const k = THREE.MathUtils.clamp(L.lift / LIFT, 0, 1)
          const mat = L.mesh.material as THREE.MeshStandardMaterial
          mat.color.copy(L.base).lerp(white, k * 0.18)
          mat.emissive.setScalar(k * 0.07)
        })

        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(frame)

      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect(); io.disconnect()
        renderer.domElement.removeEventListener('pointermove', onMove)
        renderer.domElement.removeEventListener('pointerleave', onLeave)
        renderer.dispose()
        root.traverse((o) => {
          const m = o as THREE.Mesh
          if (m.geometry) m.geometry.dispose()
          const mats = Array.isArray(m.material) ? m.material : [m.material]
          mats.forEach(mm => mm && (mm as THREE.Material).dispose())
        })
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
      }
    })()

    return () => { disposed = true; cleanup() }
  }, [model, parcels])

  return (
    <div className="map3d">
      <div ref={host} className="map3d-stage" aria-label={caption ?? 'Interactive 3D lot map'} role="img" />
      {caption && <p className="block-caption label">{caption}</p>}
    </div>
  )
}
