'use client'

import { useEffect, useRef, useState } from 'react'

/* Concept 01 — "A window to what's possible".
   The W from the wordmark becomes a solid-walled tray. Kernels pop up from
   inside the walls, tumble with real physics, and settle into the letter —
   the mark as a container that holds whatever a project brings to it. */

const W_PATH =
  'M1812.466,1107.628C1817.163,1107.628 1821.57,1109.9 1824.295,1113.726C1827.019,1117.552 1827.725,1122.46 1826.189,1126.898C1812.326,1166.957 1780.437,1259.099 1765.39,1302.578C1760.516,1316.66 1747.253,1326.105 1732.352,1326.105C1730.313,1326.105 1728.27,1326.105 1726.274,1326.105C1714.37,1326.105 1703.837,1318.397 1700.236,1307.051C1687.508,1266.952 1659.121,1177.515 1659.121,1177.515C1659.121,1177.515 1630.337,1260.686 1615.839,1302.578C1610.966,1316.66 1597.702,1326.105 1582.801,1326.105C1580.763,1326.105 1578.72,1326.105 1576.724,1326.105C1564.82,1326.105 1554.287,1318.397 1550.685,1307.051C1537.54,1265.637 1506.496,1167.83 1493.392,1126.542C1491.991,1122.128 1492.779,1117.311 1495.514,1113.574C1498.249,1109.837 1502.602,1107.628 1507.233,1107.628C1567.979,1107.628 1750.992,1107.628 1812.466,1107.628Z'

const WALL_COLOR = 0x95c1c8 // stone blue — the brand's W
// Kernel palette — PlaceWorks brand swatches.
const KERNEL_COLORS = [
  0xe8c883, // sand
  0xd9a49f, // dusty rose
  0xd2875e, // terracotta
  0xaaa8d7, // periwinkle
  0xaaccce, // stone blue
  0x3d3d6b, // indigo
  0x2a2434, // plum
]
const SCALE = 0.02
const WALL_H = 2.4
const WALL_T = 0.16
const MAX_PIECES = 240
const SUN_AZ0 = 130 // default sun azimuth (deg)
const SUN_EL0 = 30 // low sun → long, hard shadows

type RoomApi = {
  pop: (n: number) => void
  clear: () => void
  setSun: (azDeg: number, elDeg: number) => void
  exportPNG: () => void
}

export default function Concept1Room() {
  const mountRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RoomApi | null>(null)
  const sizeRef = useRef(0.34)
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState(0)
  const [size, setSize] = useState(0.34)
  const [azimuth, setAzimuth] = useState(SUN_AZ0)
  const [elevation, setElevation] = useState(SUN_EL0)

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const THREE = await import('three')
      const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js')
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js')
      const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js')
      const CANNON = await import('cannon-es')
      if (disposed || !mountRef.current) return

      const mount = mountRef.current
      const width = mount.clientWidth
      const height = mount.clientHeight

      // ── Renderer (filmic tone-mapping, soft shadows) ──
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // PNG export
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height)
      renderer.setClearColor(0x0b0b0b, 1)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      mount.appendChild(renderer.domElement)
      renderer.domElement.style.display = 'block'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'

      const scene = new THREE.Scene()

      // ── Image-based lighting → soft global-illumination feel ──
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
      camera.position.set(0.5, 8.6, 7.4)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, 0.5, 0)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.enablePan = false
      controls.minDistance = 6
      controls.maxDistance = 22
      controls.minPolarAngle = 0
      controls.maxPolarAngle = 1.28
      controls.update()

      // ── Lights ──
      // Harsh sun: strong key, minimal fill, crisp shadows.
      scene.add(new THREE.HemisphereLight(0xffffff, 0x080808, 0.08))
      const key = new THREE.DirectionalLight(0xffffff, 4.2)
      key.castShadow = true
      key.shadow.mapSize.set(2048, 2048)
      key.shadow.radius = 1.2
      key.shadow.bias = -0.0004
      key.shadow.normalBias = 0.02
      const sc = key.shadow.camera as InstanceType<typeof THREE.OrthographicCamera>
      sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6
      sc.near = 0.5; sc.far = 40
      scene.add(key)
      scene.add(key.target)

      // Move the "sun" around the tray on a sphere → live shadows.
      const applyLight = (azDeg: number, elDeg: number) => {
        const az = (azDeg * Math.PI) / 180
        const el = (elDeg * Math.PI) / 180
        const R = 13
        key.position.set(
          Math.cos(az) * Math.cos(el) * R,
          Math.sin(el) * R + 0.5,
          Math.sin(az) * Math.cos(el) * R,
        )
        key.target.position.set(0, 0, 0)
        key.target.updateMatrixWorld()
      }
      applyLight(SUN_AZ0, SUN_EL0)

      // ── Parse the W outline ──
      const loader = new SVGLoader()
      const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${W_PATH}"/></svg>`
      const shapes = loader.parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p))
      const wShape = shapes[0]
      const outline = wShape.getPoints(6) // glyph space, Y-down

      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity
      for (const p of outline) {
        minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x)
        miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y)
      }
      const cx = (minx + maxx) / 2
      const cy = (miny + maxy) / 2
      // glyph (gx,gy) → world (x, z) on the floor plane
      const toWorld = (gx: number, gy: number) =>
        new THREE.Vector3((gx - cx) * SCALE, 0, -(gy - cy) * SCALE)

      const inside = (gx: number, gy: number) => {
        let hit = false
        for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
          const xi = outline[i].x, yi = outline[i].y
          const xj = outline[j].x, yj = outline[j].y
          if ((yi > gy) !== (yj > gy) && gx < ((xj - xi) * (gy - yi)) / (yj - yi) + xi) hit = !hit
        }
        return hit
      }
      const randInterior = () => {
        for (let i = 0; i < 240; i++) {
          const gx = minx + Math.random() * (maxx - minx)
          const gy = miny + Math.random() * (maxy - miny)
          if (inside(gx, gy)) return toWorld(gx, gy)
        }
        return toWorld(cx, cy)
      }

      const stoneMat = new THREE.MeshStandardMaterial({
        color: WALL_COLOR,
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.25,
      })

      // ── Floor: the filled W as the tray bottom ──
      const floorGeo = new THREE.ShapeGeometry(wShape)
      floorGeo.rotateX(-Math.PI / 2)
      floorGeo.translate(-cx, 0, cy)
      floorGeo.scale(SCALE, 1, SCALE)
      const floor = new THREE.Mesh(floorGeo, stoneMat)
      floor.receiveShadow = true
      floor.position.y = 0.001
      scene.add(floor)

      // ── Walls: box segments along the outline (one merged mesh + one
      //    compound static body — visual and collider are identical) ──
      const wallBody = new CANNON.Body({ mass: 0 })
      const wallGeos: InstanceType<typeof THREE.BoxGeometry>[] = []
      const up = new CANNON.Vec3(0, 1, 0)
      for (let i = 0; i < outline.length; i++) {
        const a = toWorld(outline[i].x, outline[i].y)
        const b = toWorld(outline[(i + 1) % outline.length].x, outline[(i + 1) % outline.length].y)
        const dx = b.x - a.x, dz = b.z - a.z
        const len = Math.hypot(dx, dz)
        if (len < 1e-4) continue
        const yaw = Math.atan2(-dz, dx)
        const midx = (a.x + b.x) / 2, midz = (a.z + b.z) / 2

        const g = new THREE.BoxGeometry(len + 0.05, WALL_H, WALL_T)
        g.applyMatrix4(new THREE.Matrix4().makeRotationY(yaw).setPosition(midx, WALL_H / 2, midz))
        wallGeos.push(g)

        const q = new CANNON.Quaternion().setFromAxisAngle(up, yaw)
        wallBody.addShape(
          new CANNON.Box(new CANNON.Vec3((len + 0.05) / 2, WALL_H / 2, WALL_T / 2)),
          new CANNON.Vec3(midx, WALL_H / 2, midz),
          q,
        )
      }
      const wallGeo = mergeGeometries(wallGeos)!
      wallGeos.forEach((g) => g.dispose())
      const walls = new THREE.Mesh(wallGeo, stoneMat)
      walls.castShadow = true
      walls.receiveShadow = true
      scene.add(walls)

      // ── Physics world ──
      const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) })
      world.broadphase = new CANNON.SAPBroadphase(world)
      world.allowSleep = true

      const popMat = new CANNON.Material('pop')
      const envMat = new CANNON.Material('env')
      world.addContactMaterial(new CANNON.ContactMaterial(popMat, envMat, { restitution: 0.38, friction: 0.4 }))
      world.addContactMaterial(new CANNON.ContactMaterial(popMat, popMat, { restitution: 0.2, friction: 0.35 }))
      wallBody.material = envMat
      world.addBody(wallBody)

      // Floor collider is the W footprint itself (trimesh) — anything that
      // slips outside the walls has no floor, falls, and gets recycled.
      const fpos = Array.from(floorGeo.attributes.position.array as Float32Array)
      const fidx = Array.from(floorGeo.index!.array as Uint16Array | Uint32Array)
      const floorBody = new CANNON.Body({ mass: 0, material: envMat })
      floorBody.addShape(new CANNON.Trimesh(fpos, fidx))
      world.addBody(floorBody)

      // ── Kernels ──
      const kernelGeo = new THREE.IcosahedronGeometry(1, 0) // shared unit kernel
      type Piece = { mesh: InstanceType<typeof THREE.Mesh>; body: InstanceType<typeof CANNON.Body>; r: number }
      const pieces: Piece[] = []

      const spawnOne = () => {
        const r = sizeRef.current * (0.8 + Math.random() * 0.5)
        const mat = new THREE.MeshStandardMaterial({
          color: KERNEL_COLORS[Math.floor(Math.random() * KERNEL_COLORS.length)],
          roughness: 0.5,
          metalness: 0.04,
          envMapIntensity: 0.25,
        })
        const mesh = new THREE.Mesh(kernelGeo, mat)
        mesh.scale.set(r * (0.85 + Math.random() * 0.3), r * (0.85 + Math.random() * 0.3), r * (0.85 + Math.random() * 0.3))
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)

        const spot = randInterior()
        const body = new CANNON.Body({
          mass: 0.4,
          material: popMat,
          shape: new CANNON.Sphere(r),
          linearDamping: 0.06,
          angularDamping: 0.2,
        })
        body.position.set(spot.x, 0.25 + Math.random() * 0.3, spot.z)
        // the pop
        body.velocity.set((Math.random() - 0.5) * 2.2, 3.2 + Math.random() * 1.8, (Math.random() - 0.5) * 2.2)
        body.angularVelocity.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)
        world.addBody(body)

        pieces.push({ mesh, body, r })

        if (pieces.length > MAX_PIECES) {
          const old = pieces.shift()!
          scene.remove(old.mesh)
          ;(old.mesh.material as InstanceType<typeof THREE.Material>).dispose()
          world.removeBody(old.body)
        }
        setCount(pieces.length)
      }

      const pop = (n: number) => { for (let i = 0; i < n; i++) spawnOne() }
      const clear = () => {
        for (const p of pieces) {
          scene.remove(p.mesh)
          ;(p.mesh.material as InstanceType<typeof THREE.Material>).dispose()
          world.removeBody(p.body)
        }
        pieces.length = 0
        setCount(0)
      }

      // Popcorn machine — start popping on its own and keep the W topped up.
      pop(6)
      const AUTO_TARGET = 140
      const autoTimer = setInterval(() => {
        if (disposed || pieces.length >= AUTO_TARGET) { clearInterval(autoTimer); return }
        pop(4)
      }, 550)

      apiRef.current = {
        pop,
        clear,
        setSun: applyLight,
        exportPNG: () => {
          renderer.render(scene, camera)
          const a = document.createElement('a')
          a.href = renderer.domElement.toDataURL('image/png')
          a.download = 'placeworks-popcorn.png'
          a.click()
        },
      }
      setReady(true)

      // ── Loop ──
      const clock = new THREE.Clock()
      const escapeR2 = (Math.max(maxx - minx, maxy - miny) * SCALE) ** 2 * 1.4
      let raf = 0
      const tick = () => {
        const dt = Math.min(clock.getDelta(), 1 / 30)
        world.step(1 / 60, dt, 4)
        for (const p of pieces) {
          // keep everything inside the walls: recycle escapees
          if (p.body.position.y < -0.5 || p.body.position.x ** 2 + p.body.position.z ** 2 > escapeR2) {
            const spot = randInterior()
            p.body.position.set(spot.x, 0.4, spot.z)
            p.body.velocity.set(0, 0, 0)
            p.body.angularVelocity.set(0, 0, 0)
            p.body.wakeUp()
          }
          const bp = p.body.position, bq = p.body.quaternion
          p.mesh.position.set(bp.x, bp.y, bp.z)
          p.mesh.quaternion.set(bq.x, bq.y, bq.z, bq.w)
        }
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      tick()

      const ro = new ResizeObserver(() => {
        const w = mount.clientWidth
        const h = mount.clientHeight
        if (!w || !h) return
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      })
      ro.observe(mount)

      cleanup = () => {
        cancelAnimationFrame(raf)
        clearInterval(autoTimer)
        ro.disconnect()
        clear()
        controls.dispose()
        kernelGeo.dispose()
        wallGeo.dispose()
        floorGeo.dispose()
        stoneMat.dispose()
        envTex.dispose()
        pmrem.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="pw-tool">
      <div
        ref={mountRef}
        className="pw-tool-stage"
        style={{ height: 'clamp(380px, 58vh, 660px)' }}
        aria-label="Interactive physics popcorn filling the PlaceWorks W"
        role="img"
      />
      <div className="pw-controls">
        <button className="pw-btn pw-btn--solid" onClick={() => apiRef.current?.pop(18)} disabled={!ready}>Pop</button>
        <button className="pw-btn" onClick={() => apiRef.current?.pop(60)} disabled={!ready}>Pop &times;60</button>
        <button className="pw-btn" onClick={() => apiRef.current?.clear()} disabled={!ready}>Clear</button>

        <span className="pw-slider">
          Kernel&nbsp;size
          <input
            type="range" min={0.09} max={0.34} step={0.01} value={size}
            onChange={(e) => { const v = +e.target.value; setSize(v); sizeRef.current = v }}
          />
        </span>

        <span className="pw-slider">
          Sun&nbsp;angle
          <input
            type="range" min={0} max={360} value={azimuth}
            onChange={(e) => { const v = +e.target.value; setAzimuth(v); apiRef.current?.setSun(v, elevation) }}
          />
        </span>
        <span className="pw-slider">
          Sun&nbsp;height
          <input
            type="range" min={6} max={88} value={elevation}
            onChange={(e) => { const v = +e.target.value; setElevation(v); apiRef.current?.setSun(azimuth, v) }}
          />
        </span>

        <button className="pw-btn" onClick={() => apiRef.current?.exportPNG()} disabled={!ready} style={{ marginLeft: 'auto' }}>
          Save PNG
        </button>
        <span className="pw-credit" style={{ minWidth: '5ch' }}>{count} pcs</span>
      </div>
    </div>
  )
}
