'use client'

import { useEffect, useRef, useState } from 'react'

/* Concept 04 — "Threads", panel 1.
   A bed of parallel white threads. The R is never drawn: it is pressed into
   the bed as a height field, so the letter exists only as the deformation of
   the channels. It presses in and lifts out on a loop; drag to orbit, and at
   a low angle along the threads the letter disappears entirely.

   Built on `three/webgpu` only — no addons, for the two-instance reason
   documented in ShadowSundial.tsx. Glow is additive halo tubes rather than a
   bloom pass, which avoids the post-processing node stack.

   The press is animated by lerping cached vertex positions between a flat
   bed and a fully pressed one. Rebuilding 90 TubeGeometries per frame is not
   affordable; two cached position arrays per mesh are. */

type T = typeof import('three/webgpu')

/* The R, as an SVG path in a 182 x 200 box. Even-odd so the counter stays open. */
const LETTER = {
  path: 'M0 0 H100 A66 66 0 0 1 100 132 H130 L182 200 H134 L84 132 H46 V200 H0 Z M46 46 H100 A20 20 0 0 1 100 86 H46 Z',
  w: 182,
  h: 200,
  scale: 0.62,
}

const BED = 6
const SEG = 110
const THREADS = 30
const SEP = 0.19
const DEPTH = 1.25
const RADIUS = 0.016
const PERIOD = 7 // seconds for one press-and-lift cycle
const AUTO_SPIN = 0.16 // rad/s, until the viewer takes over

function heightField(size = 160) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  const s = (size * LETTER.scale) / LETTER.h
  ctx.save()
  ctx.translate((size - LETTER.w * s) / 2, (size - LETTER.h * s) / 2)
  ctx.scale(s, s)
  ctx.fill(new Path2D(LETTER.path), 'evenodd')
  ctx.restore()

  const px = ctx.getImageData(0, 0, size, size).data
  const mask = new Float32Array(size * size)
  for (let i = 0; i < size * size; i++) mask[i] = px[i * 4] / 255

  const blur = (m: Float32Array, r: number) => {
    if (r <= 0) return m
    const tmp = new Float32Array(size * size)
    const out = new Float32Array(size * size)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let a = 0, n = 0
        for (let k = -r; k <= r; k++) {
          const xx = x + k
          if (xx < 0 || xx >= size) continue
          a += m[y * size + xx]; n++
        }
        tmp[y * size + x] = a / n
      }
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let a = 0, n = 0
        for (let k = -r; k <= r; k++) {
          const yy = y + k
          if (yy < 0 || yy >= size) continue
          a += tmp[yy * size + x]; n++
        }
        out[y * size + x] = a / n
      }
    return out
  }

  const soft = blur(blur(mask, 3), 3)
  const hard = blur(mask, 1)
  return (u: number, v: number) => {
    const x = Math.max(0, Math.min(size - 1, Math.round(u * (size - 1))))
    const y = Math.max(0, Math.min(size - 1, Math.round(v * (size - 1))))
    const i = y * size + x
    return 0.55 * soft[i] + 0.45 * hard[i]
  }
}

/* smootherstep, so the press eases at both ends instead of moving linearly */
const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

export default function ThreadsBed() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [backend, setBackend] = useState<'loading' | 'WebGPU' | 'WebGL' | 'error'>('loading')

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      try {
        const THREE: T = await import('three/webgpu')
        const TSL = await import('three/tsl')
        if (disposed || !mountRef.current) return
        const mount = mountRef.current

        const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
        await renderer.init()
        if (disposed) { renderer.dispose(); return }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 1)
        mount.appendChild(renderer.domElement)
        setBackend((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL')

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200)

        const h = heightField()

        // The press lives on the GPU: each geometry carries an `aPress` offset
        // (fully-pressed minus flat) and the shader scales it by one uniform.
        // Rewriting position buffers per frame does not work here — the buffer
        // is uploaded on the first needsUpdate and never again.
        const pressU = TSL.uniform(0) as unknown as { value: number }
        // TSL's typings are loose about node arithmetic; the runtime accepts it
        const tsl = TSL as unknown as {
          uniform: (v: number) => { value: number }
          attribute: (n: string, t: string) => { mul: (o: unknown) => unknown }
          positionLocal: { add: (o: unknown) => unknown }
        }
        const displace = tsl.positionLocal.add(tsl.attribute('aPress', 'vec3').mul(pressU))
        const withPress = <M extends { positionNode: unknown }>(m: M) => {
          m.positionNode = displace
          return m
        }

        const core = withPress(new THREE.MeshBasicMaterial({ color: 0xffffff }))
        const halo1 = withPress(new THREE.MeshBasicMaterial({
          color: 0xbfd8ff, transparent: true, opacity: 0.22,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }))
        const halo2 = withPress(new THREE.MeshBasicMaterial({
          color: 0x6f9dff, transparent: true, opacity: 0.09,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }))

        const group = new THREE.Group()
        scene.add(group)

        const geos: import('three').BufferGeometry[] = []

        const line = (z: number, press: number) => {
          const pts: import('three').Vector3[] = []
          for (let i = 0; i <= SEG; i++) {
            const x = -BED / 2 + (i / SEG) * BED
            const u = (x + BED / 2) / BED
            const v = (z + BED / 2) / BED
            pts.push(new THREE.Vector3(x, -h(u, v) * DEPTH * press, z))
          }
          return new THREE.CatmullRomCurve3(pts)
        }

        for (let t = 0; t < THREADS; t++) {
          const z = (t - (THREADS - 1) / 2) * SEP
          if (Math.abs(z) > BED / 2) continue
          const flatCurve = line(z, 0)
          const deepCurve = line(z, 1)
          for (const [r, mat] of [[RADIUS, core], [RADIUS * 2.6, halo1], [RADIUS * 6, halo2]] as const) {
            // base geometry is the flat bed; aPress carries the offset to the
            // fully pressed shape, so the shader can blend between the two
            const geo = new THREE.TubeGeometry(flatCurve, SEG, r as number, 6, false)
            const deepGeo = new THREE.TubeGeometry(deepCurve, SEG, r as number, 6, false)
            const flat = geo.getAttribute('position').array as Float32Array
            const deep = deepGeo.getAttribute('position').array as Float32Array
            const off = new Float32Array(flat.length)
            for (let i = 0; i < off.length; i++) off[i] = deep[i] - flat[i]
            geo.setAttribute('aPress', new THREE.BufferAttribute(off, 3))
            deepGeo.dispose()
            geos.push(geo)
            group.add(new THREE.Mesh(geo, mat))
          }
        }

        const setPress = (p: number) => { pressU.value = p }

        // ── free orbit ────────────────────────────────────────────────
        let az = (26 * Math.PI) / 180
        let el = (32 * Math.PI) / 180
        let dist = 15.5
        let userSpun = false
        const place = () => {
          camera.position.set(
            dist * Math.cos(el) * Math.sin(az),
            dist * Math.sin(el),
            dist * Math.cos(el) * Math.cos(az),
          )
          camera.lookAt(0, -0.45, 0)
        }
        place()

        const el0 = renderer.domElement
        let dragging = false
        let last: [number, number] = [0, 0]
        const onDown = (e: PointerEvent) => {
          dragging = true
          userSpun = true
          last = [e.clientX, e.clientY]
          el0.setPointerCapture(e.pointerId)
        }
        const onMove = (e: PointerEvent) => {
          if (!dragging) return
          az -= (e.clientX - last[0]) * 0.006
          // clamp just shy of the poles so the bed never flips
          el = Math.max(-1.5, Math.min(1.5, el + (e.clientY - last[1]) * 0.006))
          last = [e.clientX, e.clientY]
          place()
        }
        const onUp = () => { dragging = false }
        const onWheel = (e: WheelEvent) => {
          e.preventDefault()
          userSpun = true
          dist = Math.max(8, Math.min(40, dist + e.deltaY * 0.02))
          place()
        }
        el0.style.cursor = 'grab'
        el0.addEventListener('pointerdown', onDown)
        el0.addEventListener('pointermove', onMove)
        el0.addEventListener('pointerup', onUp)
        el0.addEventListener('pointercancel', onUp)
        el0.addEventListener('wheel', onWheel, { passive: false })

        const fit = () => {
          const w = mount.clientWidth
          renderer.setSize(w, w, false)
          renderer.domElement.style.width = '100%'
          renderer.domElement.style.height = '100%'
        }
        fit()
        const ro = new ResizeObserver(fit)
        ro.observe(mount)

        const clock = new THREE.Clock()
        let t = 0
        renderer.setAnimationLoop(() => {
          const dt = clock.getDelta()
          t += dt
          // Trapezoid: press in, hold pressed, lift out, short flat beat.
          // A plain triangle spends most of the cycle near flat, which reads
          // as a dead panel; the hold keeps the R on screen.
          const ph = (t % PERIOD) / PERIOD
          let raw: number
          if (ph < 0.22) raw = ph / 0.22
          else if (ph < 0.62) raw = 1
          else if (ph < 0.84) raw = 1 - (ph - 0.62) / 0.22
          else raw = 0
          setPress(ease(raw))
          if (!userSpun) { az += dt * AUTO_SPIN; place() }
          renderer.render(scene, camera)
        })

        cleanup = () => {
          ro.disconnect()
          renderer.setAnimationLoop(null)
          el0.removeEventListener('pointerdown', onDown)
          el0.removeEventListener('pointermove', onMove)
          el0.removeEventListener('pointerup', onUp)
          el0.removeEventListener('pointercancel', onUp)
          el0.removeEventListener('wheel', onWheel)
          for (const g of geos) g.dispose()
          core.dispose(); halo1.dispose(); halo2.dispose()
          renderer.dispose()
          if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
        }
      } catch (err) {
        console.error('ThreadsBed', err)
        setBackend('error')
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div className="rs-live">
      <div
        className="rs-live-stage rs-live-stage--dark"
        ref={mountRef}
        aria-label="The R pressed into a bed of threads, live"
      >
        {backend === 'loading' && <span className="rs-live-note">Loading</span>}
        {backend === 'error' && <span className="rs-live-note">3D unavailable in this browser</span>}
      </div>
      <div className="rs-live-controls rs-live-controls--hint">
        <span className="rs-caption">Drag to orbit &middot; scroll to zoom</span>
      </div>
      {(backend === 'WebGPU' || backend === 'WebGL') && (
        <span className="rs-live-badge">{backend}</span>
      )}
    </div>
  )
}
