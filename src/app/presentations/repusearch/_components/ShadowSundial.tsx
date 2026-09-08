'use client'

import { useEffect, useRef, useState } from 'react'

/* Concept 01 — "The Shadow", panel 1.
   The Blender sundial (R slab + gnomon), exported as GLB, rendered on
   three's WebGPU renderer (falls back to WebGL2 on its own). The rig turns
   slowly; the slider sets the sun's height, so the shadow the R and its
   gnomon cast gets longer or shorter. R is pale stone, gnomon brushed metal.

   Everything is built from `three/webgpu` only. The addons (GLTFLoader,
   RoomEnvironment) import the classic `three` build, which makes a second
   three instance: `instanceof` fails, lights go unrecognised, shadows never
   switch on. So the GLB is parsed here (positions, normals, indices, node
   transforms — all this file needs) and the reflection room is hand-built. */

const MODEL = '/presentations/repusearch/c01/sundial.glb'
const SUN_AZ = 135 // fixed azimuth, degrees — the rig's own turn sweeps the shadow round
const SUN_EL0 = 26 // low sun by default: long shadow
const TURN = 0.22 // rad/s auto-rotation

type Api = { setSun: (elDeg: number) => void }
type T = typeof import('three/webgpu')

/* ── minimal GLB reader ─────────────────────────────────────────────── */
type Prim = { name: string; matrix: import('three').Matrix4; geo: import('three').BufferGeometry }

async function loadGLB(THREE: T, url: string): Promise<Prim[]> {
  const buf = await (await fetch(url)).arrayBuffer()
  const dv = new DataView(buf)
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB')
  let off = 12
  let json: GLTF | null = null
  let bin: ArrayBuffer | null = null
  while (off < buf.byteLength) {
    const len = dv.getUint32(off, true)
    const type = dv.getUint32(off + 4, true)
    const chunk = buf.slice(off + 8, off + 8 + len)
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk))
    else if (type === 0x004e4942) bin = chunk
    off += 8 + len
  }
  if (!json || !bin) throw new Error('GLB missing chunks')
  const g = json
  const b = bin

  const accessor = (i: number) => {
    const a = g.accessors[i]
    const bv = g.bufferViews[a.bufferView]
    const start = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0)
    const n = a.count * SIZE[a.type]
    if (a.componentType === 5126) return new Float32Array(b, start, n)
    if (a.componentType === 5125) return new Uint32Array(b, start, n)
    if (a.componentType === 5123) return new Uint16Array(b, start, n)
    throw new Error(`accessor type ${a.componentType}`)
  }

  const out: Prim[] = []
  const walk = (ni: number, parent: import('three').Matrix4) => {
    const node = g.nodes[ni]
    const local = new THREE.Matrix4()
    if (node.matrix) local.fromArray(node.matrix)
    else
      local.compose(
        new THREE.Vector3().fromArray(node.translation ?? [0, 0, 0]),
        new THREE.Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
        new THREE.Vector3().fromArray(node.scale ?? [1, 1, 1]),
      )
    const world = new THREE.Matrix4().multiplyMatrices(parent, local)
    if (node.mesh !== undefined) {
      for (const p of g.meshes[node.mesh].primitives) {
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(accessor(p.attributes.POSITION) as Float32Array, 3))
        if (p.attributes.NORMAL !== undefined)
          geo.setAttribute('normal', new THREE.BufferAttribute(accessor(p.attributes.NORMAL) as Float32Array, 3))
        if (p.indices !== undefined) {
          const idx = accessor(p.indices)
          geo.setIndex(new THREE.BufferAttribute(idx as Uint16Array | Uint32Array, 1))
        }
        if (!p.attributes.NORMAL) geo.computeVertexNormals()
        out.push({ name: node.name ?? g.meshes[node.mesh].name ?? '', matrix: world, geo })
      }
    }
    for (const c of node.children ?? []) walk(c, world)
  }
  const scene = g.scenes[g.scene ?? 0]
  for (const n of scene.nodes) walk(n, new THREE.Matrix4())
  return out
}

const SIZE: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
type GLTF = {
  scene?: number
  scenes: { nodes: number[] }[]
  nodes: { name?: string; mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[]
  meshes: { name?: string; primitives: { attributes: Record<string, number>; indices?: number }[] }[]
  accessors: { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string }[]
  bufferViews: { byteOffset?: number; byteLength: number }[]
}

/* Planar UVs from world XZ: the R lies flat on the floor once the node
   transform is baked, so a top-down projection gives an even grain. */
function planarUV(THREE: T, geo: import('three').BufferGeometry, scale: number) {
  const pos = geo.getAttribute('position')
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) * scale
    uv[i * 2 + 1] = pos.getZ(i) * scale
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

/* Stone grain: soft mottling (low-res noise upscaled with smoothing) with a
   fine speckle on top. One map serves as colour, bump and roughness. */
function grainTexture(THREE: T) {
  const s = 1024
  const noise = (n: number, lo: number, hi: number) => {
    const c = document.createElement('canvas')
    c.width = c.height = n
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(n, n)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = lo + Math.random() * (hi - lo)
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return c
  }
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(noise(24, 150, 235), 0, 0, s, s) // broad mottling
  ctx.globalAlpha = 0.45
  ctx.drawImage(noise(96, 120, 255), 0, 0, s, s) // mid grain
  ctx.globalAlpha = 0.22
  ctx.drawImage(noise(s, 60, 255), 0, 0) // speckle
  ctx.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1.5, 1.5)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* A studio box with a few bright panels: enough for brushed metal to read. */
function studioEnv(THREE: T) {
  const s = new THREE.Scene()
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 1, side: THREE.BackSide }),
  )
  s.add(box)
  const panel = (w: number, h: number, x: number, y: number, z: number, ry: number, rx: number, i: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i) }))
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, 0)
    s.add(m)
  }
  panel(8, 3, 0, 4.9, 0, 0, Math.PI / 2, 10) // top strip
  panel(3, 6, -4.9, 1, 0, Math.PI / 2, 0, 6) // left key
  panel(4, 4, 4.9, 2, -1, -Math.PI / 2, 0, 3) // right fill
  panel(6, 1.5, 0, 1.5, -4.9, 0, 0, 4) // back rim
  panel(6, 1.5, 0, 0.5, 4.9, Math.PI, 0, 2) // front, so the gnomon's camera-facing side lights up
  s.add(new THREE.PointLight(0xffffff, 60, 20, 2))
  return s
}

export default function ShadowSundial() {
  const mountRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)
  const [elev, setElev] = useState(SUN_EL0)
  const [backend, setBackend] = useState<'loading' | 'WebGPU' | 'WebGL' | 'error'>('loading')

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      try {
        const THREE = await import('three/webgpu')
        if (disposed || !mountRef.current) return
        const mount = mountRef.current

        const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
        await renderer.init()
        if (disposed) { renderer.dispose(); return }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.05
        mount.appendChild(renderer.domElement)
        setBackend((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL')

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60)
        camera.position.set(0, 3.6, 4.9)
        camera.lookAt(0, 0.3, 0)

        // reflections so the metal has something to mirror
        const pmrem = new THREE.PMREMGenerator(renderer)
        scene.environment = pmrem.fromScene(studioEnv(THREE), 0.04).texture
        scene.environmentIntensity = 0.45 // low: the sun must own the shadows

        // the sun: one hard directional light, everything else is fill
        const sun = new THREE.DirectionalLight(0xffffff, 4.6)
        sun.castShadow = true
        sun.shadow.mapSize.set(2048, 2048)
        const sc = sun.shadow.camera
        sc.left = -2.4; sc.right = 2.4; sc.top = 2.4; sc.bottom = -2.4
        sc.near = 1; sc.far = 24
        sun.shadow.bias = -0.0004
        sun.shadow.normalBias = 0.02
        scene.add(sun, sun.target)
        scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.25))

        // floor: near-black, so the sun lifts it to dark grey and the shadow reads as black.
        // (ShadowMaterial fails to build a pipeline on the WebGPU backend in r169.)
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(14, 14),
          // per-material envMapIntensity is not honoured by the node materials in r169,
          // so the albedo does the job: very dark, and the shadow goes to black
          new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1, metalness: 0 }),
        )
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)

        const grain = grainTexture(THREE)
        const stone = new THREE.MeshPhysicalMaterial({
          color: 0xe4dfd6,
          map: grain,
          roughness: 0.95,
          metalness: 0,
          bumpMap: grain,
          bumpScale: 1.6,
          roughnessMap: grain,
          envMapIntensity: 0.3, // keep the gnomon's shadow on the slab deep
        })
        const metal = new THREE.MeshPhysicalMaterial({
          color: 0xd2d5d8,
          metalness: 1,
          roughness: 0.42,
          anisotropy: 0.9,
          anisotropyRotation: Math.PI / 2,
          envMapIntensity: 1.4,
        })

        const prims = await loadGLB(THREE, MODEL)
        if (disposed) return
        const model = new THREE.Group()
        for (const p of prims) {
          const isLetter = /letter|curve/i.test(p.name)
          // bake the node transform so UVs and bounds are in one space
          p.geo.applyMatrix4(p.matrix)
          p.geo.computeVertexNormals()
          planarUV(THREE, p.geo, isLetter ? 1.4 : 6)
          const mesh = new THREE.Mesh(p.geo, isLetter ? stone : metal)
          mesh.name = p.name
          mesh.castShadow = true
          mesh.receiveShadow = true
          model.add(mesh)
        }
        // sit it on the ground, centred on the rig's axis
        const box = new THREE.Box3().setFromObject(model)
        const ctr = box.getCenter(new THREE.Vector3())
        model.position.set(-ctr.x, -box.min.y, -ctr.z)
        const rig = new THREE.Group()
        rig.add(model)
        scene.add(rig)

        const setSun = (elDeg: number) => {
          const el = (elDeg * Math.PI) / 180
          const az = (SUN_AZ * Math.PI) / 180
          sun.position.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(9)
          sun.target.position.set(0, 0, 0)
        }
        setSun(SUN_EL0)
        apiRef.current = { setSun }

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
        renderer.setAnimationLoop(() => {
          rig.rotation.y += clock.getDelta() * TURN
          renderer.render(scene, camera)
        })

        cleanup = () => {
          ro.disconnect()
          renderer.setAnimationLoop(null)
          pmrem.dispose()
          grain.dispose()
          stone.dispose()
          metal.dispose()
          for (const p of prims) p.geo.dispose()
          renderer.dispose()
          if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
        }
      } catch (err) {
        console.error('ShadowSundial', err)
        setBackend('error')
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  const onElev = (v: number) => {
    setElev(v)
    apiRef.current?.setSun(v)
  }

  return (
    <div className="rs-live">
      <div className="rs-live-stage" ref={mountRef} aria-label="The R and its shadow, live">
        {backend === 'loading' && <span className="rs-live-note">Loading model</span>}
        {backend === 'error' && <span className="rs-live-note">3D unavailable in this browser</span>}
      </div>
      <div className="rs-live-controls">
        <label className="rs-caption" htmlFor="rs-sun">Sun height</label>
        <input
          id="rs-sun"
          type="range"
          min={8}
          max={78}
          step={1}
          value={elev}
          onChange={(e) => onElev(Number(e.target.value))}
        />
        <span className="rs-live-value">{elev}&deg;</span>
      </div>
      {(backend === 'WebGPU' || backend === 'WebGL') && (
        <span className="rs-live-badge">{backend}</span>
      )}
    </div>
  )
}
