<template>
  <div class="three-dice-scene" :class="{ 'is-rolling': rolling, 'is-open': open }">
    <div ref="stageRef" class="three-dice-stage" aria-label="Area dadu 3D dengan penutup realistis" />
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  dice: {
    type: Array,
    default: () => [1]
  },
  rolling: {
    type: Boolean,
    default: false
  },
  open: {
    type: Boolean,
    default: false
  }
})

const stageRef = ref(null)

let renderer
let scene
let camera
let diceGroup
let cupGroup
let floorMesh
let shadowPlane
let resizeObserver
let animationFrame = 0
let lastTime = 0
let shakePhase = 0
let revealPulse = 0
let diceMeshes = []
let disposableItems = []

const diceTargets = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: -Math.PI / 2, y: 0, z: 0 },
  3: { x: 0, y: -Math.PI / 2, z: 0 },
  4: { x: 0, y: Math.PI / 2, z: 0 },
  5: { x: Math.PI / 2, y: 0, z: 0 },
  6: { x: Math.PI, y: 0, z: 0 }
}

const layouts = {
  1: [[0, 0]],
  2: [[-0.68, 0], [0.68, 0]],
  3: [[-0.76, -0.08], [0, 0.42], [0.76, -0.08]],
  4: [[-0.78, 0.3], [0.78, 0.3], [-0.78, -0.54], [0.78, -0.54]],
  5: [[-0.94, 0.28], [0, 0.52], [0.94, 0.28], [-0.48, -0.64], [0.48, -0.64]],
  6: [[-1.02, 0.32], [0, 0.56], [1.02, 0.32], [-1.02, -0.56], [0, -0.78], [1.02, -0.56]]
}

const pipPatterns = {
  1: [[0, 0]],
  2: [[-0.22, 0.22], [0.22, -0.22]],
  3: [[-0.23, 0.23], [0, 0], [0.23, -0.23]],
  4: [[-0.23, 0.23], [0.23, 0.23], [-0.23, -0.23], [0.23, -0.23]],
  5: [[-0.23, 0.23], [0.23, 0.23], [0, 0], [-0.23, -0.23], [0.23, -0.23]],
  6: [[-0.23, 0.25], [0.23, 0.25], [-0.23, 0], [0.23, 0], [-0.23, -0.25], [0.23, -0.25]]
}

const faceDefinitions = [
  { value: 1, normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 6, normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  { value: 3, normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { value: 4, normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { value: 2, normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { value: 5, normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] }
]

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3)
const lerp = (from, to, amount) => from + (to - from) * amount

function track(item) {
  disposableItems.push(item)
  return item
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.04
  stageRef.value.appendChild(renderer.domElement)
}

function createLights() {
  const ambient = new THREE.HemisphereLight(0xffffff, 0x7a4638, 1.45)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.8)
  keyLight.position.set(-3.8, 6.4, 5.2)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 14
  keyLight.shadow.camera.left = -5
  keyLight.shadow.camera.right = 5
  keyLight.shadow.camera.top = 5
  keyLight.shadow.camera.bottom = -5
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xffe3cf, 1.35)
  fillLight.position.set(4.5, 2.5, -2.5)
  scene.add(fillLight)

  const rimLight = new THREE.PointLight(0xfff0df, 2.2, 9)
  rimLight.position.set(2.6, 3.8, 3.4)
  scene.add(rimLight)
}

function createFloor() {
  floorMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(3.15, 3.35, 0.18, 128)),
    track(new THREE.MeshPhysicalMaterial({
      color: 0xfffbf1,
      roughness: 0.48,
      metalness: 0.02,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45
    }))
  )
  floorMesh.position.y = -1.1
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  const rim = new THREE.Mesh(
    track(new THREE.TorusGeometry(3.18, 0.035, 16, 128)),
    track(new THREE.MeshPhysicalMaterial({ color: 0xf4eadc, roughness: 0.32, clearcoat: 0.55 }))
  )
  rim.position.y = -0.995
  rim.rotation.x = Math.PI / 2
  rim.receiveShadow = true
  scene.add(rim)

  shadowPlane = new THREE.Mesh(
    track(new THREE.CircleGeometry(3.05, 96)),
    track(new THREE.ShadowMaterial({ color: 0x1f140f, opacity: 0.22 }))
  )
  shadowPlane.position.y = -0.985
  shadowPlane.rotation.x = -Math.PI / 2
  shadowPlane.receiveShadow = true
  scene.add(shadowPlane)
}

function addFacePips(die, face, pipMaterial, redMaterial) {
  const normal = new THREE.Vector3(...face.normal)
  const uVector = new THREE.Vector3(...face.u)
  const vVector = new THREE.Vector3(...face.v)
  const center = normal.clone().multiplyScalar(0.394)
  const material = face.value === 1 ? redMaterial : pipMaterial
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)

  pipPatterns[face.value].forEach(([x, y]) => {
    const pip = new THREE.Mesh(track(new THREE.CircleGeometry(0.065, 36)), material)
    pip.position.copy(center)
      .add(uVector.clone().multiplyScalar(x))
      .add(vVector.clone().multiplyScalar(y))
    pip.quaternion.copy(rotation)
    pip.renderOrder = 2
    die.add(pip)
  })
}

function createDie(value, index, count) {
  const die = new THREE.Group()
  const bodyMaterial = track(new THREE.MeshPhysicalMaterial({
    color: 0xfdfcf8,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2
  }))
  const pipMaterial = track(new THREE.MeshStandardMaterial({ color: 0x101722, roughness: 0.42 }))
  const redPipMaterial = track(new THREE.MeshStandardMaterial({ color: 0xe6282f, roughness: 0.36 }))

  const body = new THREE.Mesh(track(new RoundedBoxGeometry(0.78, 0.78, 0.78, 8, 0.095)), bodyMaterial)
  body.castShadow = true
  body.receiveShadow = true
  die.add(body)

  const bevelGlow = new THREE.Mesh(
    track(new RoundedBoxGeometry(0.782, 0.782, 0.782, 5, 0.095)),
    track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 }))
  )
  die.add(bevelGlow)

  faceDefinitions.forEach((face) => addFacePips(die, face, pipMaterial, redPipMaterial))

  const countLayout = layouts[count] || layouts[6]
  const [x, z] = countLayout[index] || [0, 0]
  die.position.set(x, -0.55, z)
  die.userData.basePosition = die.position.clone()
  die.userData.restRotation = {
    x: diceTargets[value]?.x || 0,
    y: diceTargets[value]?.y || 0,
    z: diceTargets[value]?.z || 0
  }
  die.rotation.set(die.userData.restRotation.x, die.userData.restRotation.y, die.userData.restRotation.z)
  die.scale.setScalar(count >= 5 ? 0.72 : count >= 3 ? 0.8 : 0.94)

  return die
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.())
    else child.material?.dispose?.()
  })
}

function rebuildDice() {
  if (!diceGroup) return

  diceMeshes.forEach((die) => {
    diceGroup.remove(die)
    disposeObject(die)
  })
  diceMeshes = props.dice.map((value, index) => createDie(value, index, props.dice.length))
  diceMeshes.forEach((die) => diceGroup.add(die))
}

function createCup() {
  cupGroup = new THREE.Group()

  const leatherRed = track(new THREE.MeshPhysicalMaterial({
    color: 0xb51226,
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18
  }))
  const darkRed = track(new THREE.MeshPhysicalMaterial({
    color: 0x5f0712,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16
  }))
  const highlight = track(new THREE.MeshPhysicalMaterial({
    color: 0xff5c66,
    roughness: 0.26,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.55
  }))

  const cupProfile = [
    new THREE.Vector2(2.04, -1.26),
    new THREE.Vector2(2.12, -1.08),
    new THREE.Vector2(1.96, -0.46),
    new THREE.Vector2(1.78, 0.42),
    new THREE.Vector2(1.58, 1.08),
    new THREE.Vector2(1.48, 1.23)
  ]

  const body = new THREE.Mesh(track(new THREE.LatheGeometry(cupProfile, 160)), leatherRed)
  body.castShadow = true
  body.receiveShadow = true
  cupGroup.add(body)

  const topCap = new THREE.Mesh(track(new THREE.CylinderGeometry(1.58, 1.48, 0.22, 160)), darkRed)
  topCap.position.y = 1.27
  topCap.castShadow = true
  topCap.receiveShadow = true
  cupGroup.add(topCap)

  const topRim = new THREE.Mesh(track(new THREE.TorusGeometry(1.55, 0.075, 18, 160)), darkRed)
  topRim.position.y = 1.4
  topRim.rotation.x = Math.PI / 2
  topRim.castShadow = true
  cupGroup.add(topRim)

  const bottomRim = new THREE.Mesh(track(new THREE.TorusGeometry(2.07, 0.105, 20, 160)), darkRed)
  bottomRim.position.y = -1.25
  bottomRim.rotation.x = Math.PI / 2
  bottomRim.castShadow = true
  cupGroup.add(bottomRim)

  for (let i = 0; i < 4; i += 1) {
    const groove = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.74 + i * 0.095, 0.012, 8, 128)),
      track(new THREE.MeshStandardMaterial({ color: 0x7d0b18, roughness: 0.55 }))
    )
    groove.position.y = 0.76 - i * 0.48
    groove.rotation.x = Math.PI / 2
    cupGroup.add(groove)
  }

  const shine = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.065, 1.52, 8, 24)), highlight)
  shine.position.set(-0.82, 0.1, 1.56)
  shine.rotation.z = -0.15
  shine.rotation.x = 0.18
  shine.castShadow = false
  cupGroup.add(shine)

  cupGroup.position.y = props.open ? 2.72 : 0.08
  cupGroup.rotation.x = -0.09
  scene.add(cupGroup)
}

function updateSize() {
  if (!stageRef.value || !renderer || !camera) return

  const { width, height } = stageRef.value.getBoundingClientRect()
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)

  renderer.setSize(safeWidth, safeHeight, false)
  camera.aspect = safeWidth / safeHeight
  camera.updateProjectionMatrix()
}

function animate(time = 0) {
  const delta = Math.min(0.05, (time - lastTime) / 1000 || 0.016)
  lastTime = time
  shakePhase += delta * 8.5
  revealPulse = Math.max(0, revealPulse - delta * 1.9)

  const rollingAmount = props.rolling ? 1 : 0
  const targetCupY = props.rolling ? 0 : props.open ? 2.92 : 0.08
  const liftShake = props.rolling ? Math.sin(shakePhase * 1.35) * 0.08 : 0
  cupGroup.position.y = lerp(cupGroup.position.y, targetCupY + liftShake, 0.13)
  cupGroup.rotation.z = lerp(cupGroup.rotation.z, props.rolling ? Math.sin(shakePhase * 1.85) * 0.105 : 0, 0.14)
  cupGroup.rotation.y = lerp(cupGroup.rotation.y, props.rolling ? Math.cos(shakePhase * 1.45) * 0.12 : 0, 0.14)
  cupGroup.rotation.x = lerp(cupGroup.rotation.x, props.rolling ? -0.14 + Math.sin(shakePhase) * 0.06 : -0.09, 0.14)

  diceGroup.visible = props.open
  diceGroup.position.x = props.rolling ? Math.sin(shakePhase * 2.2) * 0.08 : 0
  diceGroup.position.z = props.rolling ? Math.cos(shakePhase * 1.9) * 0.065 : 0

  diceMeshes.forEach((die, index) => {
    const phase = shakePhase + index * 0.73
    const base = die.userData.basePosition
    const rest = die.userData.restRotation

    if (props.rolling) {
      die.position.y = base.y + Math.abs(Math.sin(phase * 1.8)) * 0.14
      die.rotation.x += delta * (6.2 + index * 0.7)
      die.rotation.y += delta * (8.5 + index * 0.6)
      die.rotation.z += delta * (5.1 + index * 0.45)
    } else {
      const revealBounce = easeOutCubic(revealPulse) * 0.28
      die.position.y = lerp(die.position.y, base.y + revealBounce, 0.18)
      die.rotation.x = lerp(die.rotation.x, rest.x, 0.15)
      die.rotation.y = lerp(die.rotation.y, rest.y, 0.15)
      die.rotation.z = lerp(die.rotation.z, rest.z, 0.15)
    }
  })

  floorMesh.scale.setScalar(1 + rollingAmount * 0.012)
  shadowPlane.material.opacity = props.open ? 0.18 : 0.26
  renderer.render(scene, camera)
  animationFrame = window.requestAnimationFrame(animate)
}

function setupScene() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  camera.position.set(0, 2.75, 7.8)
  camera.lookAt(0, -0.48, 0)

  createRenderer()
  createLights()
  createFloor()

  diceGroup = new THREE.Group()
  scene.add(diceGroup)
  rebuildDice()
  createCup()
  updateSize()

  resizeObserver = new ResizeObserver(updateSize)
  resizeObserver.observe(stageRef.value)
  window.addEventListener('resize', updateSize)

  animationFrame = window.requestAnimationFrame(animate)
}

function disposeScene() {
  window.cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', updateSize)
  resizeObserver?.disconnect()
  renderer?.domElement?.remove()
  diceMeshes.forEach(disposeObject)
  disposableItems.forEach((item) => item.dispose?.())
  renderer?.dispose()
}

onMounted(setupScene)
onBeforeUnmount(disposeScene)

watch(
  () => props.dice,
  () => {
    if (props.rolling) return
    rebuildDice()
    if (props.open) revealPulse = 1
  },
  { deep: true }
)

watch(
  () => props.rolling,
  (isRolling) => {
    if (!isRolling) {
      rebuildDice()
      if (props.open) revealPulse = 1
    }
  }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) revealPulse = 1
  }
)
</script>


