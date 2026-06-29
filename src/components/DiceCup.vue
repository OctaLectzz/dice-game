<template>
  <div class="three-dice-scene" :class="{ 'is-rolling': rolling, 'is-open': open }">
    <div ref="stageRef" class="three-dice-stage" aria-label="Area dadu 3D dengan penutup" />
  </div>
</template>

<script setup>
import * as THREE from 'three'
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
  2: [[-0.8, 0], [0.8, 0]],
  3: [[-1, -0.2], [0, 0.55], [1, -0.2]],
  4: [[-1.05, 0.35], [1.05, 0.35], [-1.05, -0.75], [1.05, -0.75]],
  5: [[-1.25, 0.3], [0, 0.65], [1.25, 0.3], [-0.65, -0.85], [0.65, -0.85]],
  6: [[-1.35, 0.4], [0, 0.7], [1.35, 0.4], [-1.35, -0.75], [0, -1.05], [1.35, -0.75]]
}

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3)
const lerp = (from, to, amount) => from + (to - from) * amount

function track(item) {
  disposableItems.push(item)
  return item
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  stageRef.value.appendChild(renderer.domElement)
}

function createLights() {
  const ambient = new THREE.HemisphereLight(0xffffff, 0x2f4a39, 2.1)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.4)
  keyLight.position.set(-4, 6, 5)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  scene.add(keyLight)

  const rimLight = new THREE.PointLight(0xffe2ca, 2.1, 10)
  rimLight.position.set(3.5, 3, -3)
  scene.add(rimLight)
}

function createFloor() {
  const geometry = track(new THREE.CylinderGeometry(3.45, 3.72, 0.28, 96))
  const material = track(new THREE.MeshStandardMaterial({
    color: 0xfffaf1,
    roughness: 0.62,
    metalness: 0.05
  }))

  floorMesh = new THREE.Mesh(geometry, material)
  floorMesh.position.y = -1.15
  floorMesh.receiveShadow = true
  scene.add(floorMesh)

  const rim = new THREE.Mesh(
    track(new THREE.TorusGeometry(3.48, 0.055, 12, 96)),
    track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38 }))
  )
  rim.position.y = -0.97
  rim.rotation.x = Math.PI / 2
  rim.receiveShadow = true
  scene.add(rim)
}

function makeDot(x, y, facePosition, faceRotation, red = false) {
  const geometry = track(new THREE.CylinderGeometry(0.075, 0.075, 0.018, 24))
  const material = track(new THREE.MeshStandardMaterial({
    color: red ? 0xe22929 : 0x111827,
    roughness: 0.5
  }))
  const dot = new THREE.Mesh(geometry, material)

  dot.position.copy(facePosition)
  dot.rotation.copy(faceRotation)

  const offset = new THREE.Vector3(x, y, 0)
  offset.applyEuler(faceRotation)
  dot.position.add(offset)

  return dot
}

function addFaceDots(die, value, facePosition, faceRotation) {
  const pipPositions = {
    1: [[0, 0]],
    2: [[-0.24, 0.24], [0.24, -0.24]],
    3: [[-0.25, 0.25], [0, 0], [0.25, -0.25]],
    4: [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]],
    5: [[-0.25, 0.25], [0.25, 0.25], [0, 0], [-0.25, -0.25], [0.25, -0.25]],
    6: [[-0.25, 0.28], [0.25, 0.28], [-0.25, 0], [0.25, 0], [-0.25, -0.28], [0.25, -0.28]]
  }

  pipPositions[value].forEach(([x, y]) => {
    die.add(makeDot(x, y, facePosition, faceRotation, value === 1))
  })
}

function createDie(value, index, count) {
  const die = new THREE.Group()
  const body = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.72, 0.72, 0.72, 5, 5, 5)),
    track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.32,
      metalness: 0.04
    }))
  )
  body.castShadow = true
  body.receiveShadow = true
  die.add(body)

  addFaceDots(die, 1, new THREE.Vector3(0, 0, 0.371), new THREE.Euler(Math.PI / 2, 0, 0))
  addFaceDots(die, 6, new THREE.Vector3(0, 0, -0.371), new THREE.Euler(-Math.PI / 2, 0, 0))
  addFaceDots(die, 3, new THREE.Vector3(0.371, 0, 0), new THREE.Euler(0, 0, -Math.PI / 2))
  addFaceDots(die, 4, new THREE.Vector3(-0.371, 0, 0), new THREE.Euler(0, 0, Math.PI / 2))
  addFaceDots(die, 2, new THREE.Vector3(0, 0.371, 0), new THREE.Euler(0, 0, 0))
  addFaceDots(die, 5, new THREE.Vector3(0, -0.371, 0), new THREE.Euler(Math.PI, 0, 0))

  const countLayout = layouts[count] || layouts[6]
  const [x, z] = countLayout[index] || [0, 0]
  die.position.set(x, -0.52, z)
  die.userData.basePosition = die.position.clone()
  die.userData.restRotation = {
    x: (diceTargets[value]?.x || 0) + (Math.random() - 0.5) * 0.18,
    y: (diceTargets[value]?.y || 0) + (Math.random() - 0.5) * 0.18,
    z: (diceTargets[value]?.z || 0) + (Math.random() - 0.5) * 0.24
  }
  die.rotation.set(die.userData.restRotation.x, die.userData.restRotation.y, die.userData.restRotation.z)
  die.scale.setScalar(count >= 5 ? 0.78 : count >= 3 ? 0.86 : 0.95)

  return die
}

function rebuildDice() {
  if (!diceGroup) return

  diceMeshes.forEach((die) => diceGroup.remove(die))
  diceMeshes = props.dice.map((value, index) => createDie(value, index, props.dice.length))
  diceMeshes.forEach((die) => diceGroup.add(die))
}

function createCup() {
  cupGroup = new THREE.Group()

  const wallMaterial = track(new THREE.MeshStandardMaterial({
    color: 0xd92736,
    roughness: 0.42,
    metalness: 0.12,
    transparent: true,
    opacity: 0.97
  }))
  const darkMaterial = track(new THREE.MeshStandardMaterial({
    color: 0x8a1220,
    roughness: 0.48,
    metalness: 0.08
  }))
  const highlightMaterial = track(new THREE.MeshStandardMaterial({
    color: 0xff6e74,
    roughness: 0.35,
    metalness: 0.05
  }))

  const body = new THREE.Mesh(track(new THREE.CylinderGeometry(1.78, 2.2, 2.25, 96, 1, true)), wallMaterial)
  body.castShadow = true
  body.receiveShadow = true
  cupGroup.add(body)

  const topRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.78, 0.095, 18, 96)), darkMaterial)
  topRing.position.y = 1.14
  topRing.rotation.x = Math.PI / 2
  topRing.castShadow = true
  cupGroup.add(topRing)

  const lowerRing = new THREE.Mesh(track(new THREE.TorusGeometry(2.18, 0.105, 18, 96)), darkMaterial)
  lowerRing.position.y = -1.13
  lowerRing.rotation.x = Math.PI / 2
  lowerRing.castShadow = true
  cupGroup.add(lowerRing)

  const lid = new THREE.Mesh(track(new THREE.CylinderGeometry(1.85, 1.98, 0.2, 96)), darkMaterial)
  lid.position.y = 1.24
  lid.castShadow = true
  cupGroup.add(lid)

  const shine = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 1.62, 0.035)), highlightMaterial)
  shine.position.set(-0.85, 0.02, 1.72)
  shine.rotation.z = -0.16
  shine.castShadow = true
  cupGroup.add(shine)

  cupGroup.position.y = props.open ? 2.65 : 0.22
  cupGroup.rotation.x = -0.12
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
  revealPulse = Math.max(0, revealPulse - delta * 1.7)

  const rollingAmount = props.rolling ? 1 : 0
  const targetCupY = props.rolling ? 0.02 : props.open ? 2.85 : 0.18
  const liftShake = props.rolling ? Math.sin(shakePhase * 1.4) * 0.1 : 0
  cupGroup.position.y = lerp(cupGroup.position.y, targetCupY + liftShake, 0.12)
  cupGroup.rotation.z = lerp(cupGroup.rotation.z, props.rolling ? Math.sin(shakePhase * 1.8) * 0.12 : 0, 0.14)
  cupGroup.rotation.y = lerp(cupGroup.rotation.y, props.rolling ? Math.cos(shakePhase * 1.5) * 0.14 : 0, 0.14)
  cupGroup.rotation.x = lerp(cupGroup.rotation.x, props.rolling ? -0.18 + Math.sin(shakePhase) * 0.08 : -0.12, 0.14)

  diceGroup.visible = props.open
  diceGroup.position.x = props.rolling ? Math.sin(shakePhase * 2.2) * 0.1 : 0
  diceGroup.position.z = props.rolling ? Math.cos(shakePhase * 1.9) * 0.08 : 0

  diceMeshes.forEach((die, index) => {
    const phase = shakePhase + index * 0.73
    const base = die.userData.basePosition
    const rest = die.userData.restRotation

    if (props.rolling) {
      die.position.y = base.y + Math.abs(Math.sin(phase * 1.8)) * 0.16
      die.rotation.x += delta * (6.2 + index * 0.7)
      die.rotation.y += delta * (8.5 + index * 0.6)
      die.rotation.z += delta * (5.1 + index * 0.45)
    } else {
      const revealBounce = easeOutCubic(revealPulse) * 0.25
      die.position.y = lerp(die.position.y, base.y + revealBounce, 0.16)
      die.rotation.x = lerp(die.rotation.x, rest.x, 0.13)
      die.rotation.y = lerp(die.rotation.y, rest.y, 0.13)
      die.rotation.z = lerp(die.rotation.z, rest.z, 0.13)
    }
  })

  floorMesh.scale.setScalar(1 + rollingAmount * 0.018)
  renderer.render(scene, camera)
  animationFrame = window.requestAnimationFrame(animate)
}

function setupScene() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 2.3, 7.3)
  camera.lookAt(0, -0.2, 0)

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
  disposableItems.forEach((item) => item.dispose?.())
  renderer?.dispose()
}

onMounted(setupScene)
onBeforeUnmount(disposeScene)

watch(
  () => props.dice,
  () => {
    rebuildDice()
    if (props.open && !props.rolling) revealPulse = 1
  },
  { deep: true }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) revealPulse = 1
  }
)
</script>

