'use client'

import { useEffect, useRef, useState } from 'react'

/* Concept 01 — second example. The W becomes a planter: a low stone-blue
   border in the shape of the mark, filled with a little forest. Same idea as
   the popcorn study — the mark as a container — but holding place itself. */

const W_PATH =
  'M1812.466,1107.628C1817.163,1107.628 1821.57,1109.9 1824.295,1113.726C1827.019,1117.552 1827.725,1122.46 1826.189,1126.898C1812.326,1166.957 1780.437,1259.099 1765.39,1302.578C1760.516,1316.66 1747.253,1326.105 1732.352,1326.105C1730.313,1326.105 1728.27,1326.105 1726.274,1326.105C1714.37,1326.105 1703.837,1318.397 1700.236,1307.051C1687.508,1266.952 1659.121,1177.515 1659.121,1177.515C1659.121,1177.515 1630.337,1260.686 1615.839,1302.578C1610.966,1316.66 1597.702,1326.105 1582.801,1326.105C1580.763,1326.105 1578.72,1326.105 1576.724,1326.105C1564.82,1326.105 1554.287,1318.397 1550.685,1307.051C1537.54,1265.637 1506.496,1167.83 1493.392,1126.542C1491.991,1122.128 1492.779,1117.311 1495.514,1113.574C1498.249,1109.837 1502.602,1107.628 1507.233,1107.628C1567.979,1107.628 1750.992,1107.628 1812.466,1107.628Z'

const WALL_COLOR = 0x95c1c8
const SCALE = 0.02
const WALL_H = 0.55 // low planter border
const WALL_T = 0.16
const MAX_TREES = 220
const DEFAULT_TREES = 110 // start as a packed mini-forest
const SUN_AZ0 = 130
const SUN_EL0 = 30 // low sun → long, hard shadows

type ForestApi = {
  plant: (n: number) => void
  setSun: (azDeg: number, elDeg: number) => void
  exportPNG: () => void
}

export default function Concept1Forest() {
  const mountRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<ForestApi | null>(null)
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState(0)
  const [trees, setTrees] = useState(DEFAULT_TREES)
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
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
      const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js')
      if (disposed || !mountRef.current) return

      const mount = mountRef.current
      const width = mount.clientWidth
      const height = mount.clientHeight

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
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
      const pmrem = new THREE.PMREMGenerator(renderer)
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
      camera.position.set(0.5, 7.4, 7.6)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, 0.4, 0)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.enablePan = false
      controls.minDistance = 6
      controls.maxDistance = 24
      controls.minPolarAngle = 0
      controls.maxPolarAngle = 1.32
      controls.update()

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
      const applyLight = (azDeg: number, elDeg: number) => {
        const az = (azDeg * Math.PI) / 180
        const el = (elDeg * Math.PI) / 180
        const R = 13
        key.position.set(Math.cos(az) * Math.cos(el) * R, Math.sin(el) * R + 0.5, Math.sin(az) * Math.cos(el) * R)
        key.target.position.set(0, 0, 0)
        key.target.updateMatrixWorld()
      }
      applyLight(SUN_AZ0, SUN_EL0)

      // ── W footprint ──
      const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${W_PATH}"/></svg>`
      const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p))
      const wShape = shapes[0]
      const outline = wShape.getPoints(6)
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity
      for (const p of outline) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y) }
      const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2
      const toWorld = (gx: number, gy: number) => new THREE.Vector3((gx - cx) * SCALE, 0, -(gy - cy) * SCALE)
      const inside = (gx: number, gy: number) => {
        let hit = false
        for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
          const xi = outline[i].x, yi = outline[i].y, xj = outline[j].x, yj = outline[j].y
          if ((yi > gy) !== (yj > gy) && gx < ((xj - xi) * (gy - yi)) / (yj - yi) + xi) hit = !hit
        }
        return hit
      }
      const randInterior = () => {
        for (let i = 0; i < 200; i++) {
          const gx = minx + Math.random() * (maxx - minx)
          const gy = miny + Math.random() * (maxy - miny)
          if (inside(gx, gy)) return toWorld(gx, gy)
        }
        return toWorld(cx, cy)
      }

      const stoneMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.55, envMapIntensity: 0.25 })

      const floorGeo = new THREE.ShapeGeometry(wShape)
      floorGeo.rotateX(-Math.PI / 2)
      floorGeo.translate(-cx, 0, cy)
      floorGeo.scale(SCALE, 1, SCALE)
      const floor = new THREE.Mesh(floorGeo, stoneMat)
      floor.receiveShadow = true
      floor.position.y = 0.001
      scene.add(floor)

      const wallGeos: InstanceType<typeof THREE.BoxGeometry>[] = []
      for (let i = 0; i < outline.length; i++) {
        const a = toWorld(outline[i].x, outline[i].y)
        const b = toWorld(outline[(i + 1) % outline.length].x, outline[(i + 1) % outline.length].y)
        const dx = b.x - a.x, dz = b.z - a.z
        const len = Math.hypot(dx, dz)
        if (len < 1e-4) continue
        const yaw = Math.atan2(-dz, dx)
        const g = new THREE.BoxGeometry(len + 0.05, WALL_H, WALL_T)
        g.applyMatrix4(new THREE.Matrix4().makeRotationY(yaw).setPosition((a.x + b.x) / 2, WALL_H / 2, (a.z + b.z) / 2))
        wallGeos.push(g)
      }
      const wallGeo = mergeGeometries(wallGeos)!
      wallGeos.forEach((g) => g.dispose())
      const walls = new THREE.Mesh(wallGeo, stoneMat)
      walls.castShadow = true
      walls.receiveShadow = true
      scene.add(walls)

      // ── Load + normalise the tree, split into trunk / leaves ──
      const gltf = await new GLTFLoader().loadAsync('/presentations/placeworks/tree.glb')
      if (disposed) return
      gltf.scene.updateMatrixWorld(true)
      const trunkGeos: InstanceType<typeof THREE.BufferGeometry>[] = []
      const leafGeos: InstanceType<typeof THREE.BufferGeometry>[] = []
      gltf.scene.traverse((o) => {
        const mesh = o as InstanceType<typeof THREE.Mesh>
        if (!mesh.isMesh) return
        const g = mesh.geometry.clone()
        g.applyMatrix4(mesh.matrixWorld)
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
        const mat = mesh.material as InstanceType<typeof THREE.Material> & { name?: string }
        if (/leaf|leaves/i.test(mat?.name ?? '')) leafGeos.push(g)
        else trunkGeos.push(g)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trunkGeo = trunkGeos.length ? mergeGeometries(trunkGeos as any)! : null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leafGeo = (leafGeos.length ? mergeGeometries(leafGeos as any) : null) ?? trunkGeo
      // normalise: centre XZ, base on y=0, height → 1
      const box = new THREE.Box3()
      if (trunkGeo) { trunkGeo.computeBoundingBox(); box.union(trunkGeo.boundingBox!) }
      if (leafGeo && leafGeo !== trunkGeo) { leafGeo.computeBoundingBox(); box.union(leafGeo.boundingBox!) }
      const h = Math.max(box.max.y - box.min.y, 1e-3)
      const s = 1 / h
      const norm = new THREE.Matrix4().makeScale(s, s, s).multiply(
        new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2),
      )
      trunkGeo?.applyMatrix4(norm)
      if (leafGeo && leafGeo !== trunkGeo) leafGeo.applyMatrix4(norm)

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f5942, roughness: 0.9, envMapIntensity: 0.25 })
      const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, envMapIntensity: 0.25 })
      const trunkInst = new THREE.InstancedMesh(trunkGeo ?? leafGeo!, trunkMat, MAX_TREES)
      const leafInst = new THREE.InstancedMesh(leafGeo ?? trunkGeo!, leafMat, MAX_TREES)
      for (const inst of [trunkInst, leafInst]) { inst.castShadow = true; inst.receiveShadow = true; inst.count = 0 }
      scene.add(trunkInst, leafInst)

      const dummy = new THREE.Object3D()
      const plant = (n: number) => {
        const target = Math.min(n, MAX_TREES)
        const placed: { x: number; z: number }[] = []
        let i = 0, attempts = 0
        while (i < target && attempts < target * 60) {
          attempts++
          const spot = randInterior()
          if (placed.some((p) => (p.x - spot.x) ** 2 + (p.z - spot.z) ** 2 < 0.26 * 0.26)) continue
          placed.push({ x: spot.x, z: spot.z })
          // wide height spread — lots of saplings, a few big canopies
          const th = 0.5 + Math.pow(Math.random(), 1.8) * 2.1
          const tw = th * (0.6 + Math.random() * 0.32)
          dummy.position.set(spot.x, 0, spot.z)
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
          dummy.scale.set(tw, th, tw)
          dummy.updateMatrix()
          trunkInst.setMatrixAt(i, dummy.matrix)
          leafInst.setMatrixAt(i, dummy.matrix)
          leafInst.setColorAt(i, new THREE.Color().setHSL(0.25 + Math.random() * 0.09, 0.34 + Math.random() * 0.26, 0.32 + Math.random() * 0.18))
          i++
        }
        trunkInst.count = i
        leafInst.count = i
        trunkInst.instanceMatrix.needsUpdate = true
        leafInst.instanceMatrix.needsUpdate = true
        if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true
        setCount(i)
      }
      plant(DEFAULT_TREES)

      apiRef.current = {
        plant,
        setSun: applyLight,
        exportPNG: () => {
          renderer.render(scene, camera)
          const a = document.createElement('a')
          a.href = renderer.domElement.toDataURL('image/png')
          a.download = 'placeworks-forest.png'
          a.click()
        },
      }
      setReady(true)

      let raf = 0
      const tick = () => {
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      tick()

      const ro = new ResizeObserver(() => {
        const w = mount.clientWidth, hh = mount.clientHeight
        if (!w || !hh) return
        camera.aspect = w / hh
        camera.updateProjectionMatrix()
        renderer.setSize(w, hh)
      })
      ro.observe(mount)

      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        controls.dispose()
        trunkInst.dispose(); leafInst.dispose()
        trunkGeo?.dispose(); if (leafGeo && leafGeo !== trunkGeo) leafGeo.dispose()
        trunkMat.dispose(); leafMat.dispose()
        wallGeo.dispose(); floorGeo.dispose(); stoneMat.dispose()
        envTex.dispose(); pmrem.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    })()

    return () => { disposed = true; cleanup() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="pw-tool">
      <div
        ref={mountRef}
        className="pw-tool-stage"
        style={{ height: 'clamp(380px, 58vh, 660px)' }}
        aria-label="A forest planted inside the PlaceWorks W"
        role="img"
      />
      <div className="pw-controls">
        <button className="pw-btn pw-btn--solid" onClick={() => apiRef.current?.plant(trees)} disabled={!ready}>Replant</button>

        <span className="pw-slider">
          Trees
          <input
            type="range" min={5} max={MAX_TREES} value={trees}
            onChange={(e) => { const v = +e.target.value; setTrees(v); apiRef.current?.plant(v) }}
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
        <span className="pw-credit" style={{ minWidth: '6ch' }}>{count} trees</span>
      </div>
    </div>
  )
}
