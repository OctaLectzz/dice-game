<template>
  <div
    class="three-dice-scene"
    :class="{
      'is-rolling': rolling,
      'is-open': open,
      'is-dragging': isDragging,
      'can-drag': canDrag
    }"
    @pointerdown="startDrag"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="cancelDrag"
    @lostpointercapture="cancelDrag"
  >
    <div ref="stageRef" class="three-dice-stage" aria-label="Tarik penutup dadu ke bawah untuk roll" />
    <div class="drag-hint" :class="{ 'is-ready': dragProgress >= 1 }">
      <span>{{ dragProgress >= 1 ? 'Lepaskan untuk roll' : open ? 'Tarik lagi untuk roll' : 'Tarik penutup ke bawah' }}</span>
      <b>⌄</b>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

const emit = defineEmits(['roll-request'])

const stageRef = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const dragProgress = computed(() => Math.min(1, Math.max(0, dragOffset.value.y) / dragThresholdPx()))
const canDrag = computed(() => !props.rolling)

let renderer
let scene
let camera
let diceGroup
let cupGroup
let trayGroup
let shadowPlane
let resizeObserver
let animationFrame = 0
let lastTime = 0
let shakePhase = 0
let revealPulse = 0
let dragPointerId = null
let dragStartX = 0
let dragStartY = 0
let diceMeshes = []
let disposableItems = []

const closedCupY = 0.02
const openCupY = 1.72
const diceTargets = {
  1: { x: -0.18, y: -0.54, z: 0.2 },
  2: { x: -Math.PI / 2, y: 0.28, z: -0.18 },
  3: { x: 0.08, y: -Math.PI / 2, z: -0.28 },
  4: { x: 0.08, y: Math.PI / 2, z: 0.22 },
  5: { x: Math.PI / 2, y: -0.22, z: 0.16 },
  6: { x: Math.PI, y: 0.28, z: -0.18 }
}

const layouts = {
  1: [[0, 0]],
  2: [[-0.72, -0.02], [0.72, -0.02]],
  3: [[-0.86, -0.1], [0, 0.5], [0.86, -0.1]],
  4: [[-0.88, 0.34], [0.88, 0.34], [-0.88, -0.52], [0.88, -0.52]],
  5: [[-1.02, 0.26], [0, 0.58], [1.02, 0.26], [-0.5, -0.62], [0.5, -0.62]],
  6: [[-1.08, 0.32], [0, 0.58], [1.08, 0.32], [-1.08, -0.58], [0, -0.78], [1.08, -0.58]]
}

const faceDefinitions = [
  { value: 1, normal: [0, 0, 1], rotation: [0, 0, 0], position: [0, 0, 0.486] },
  { value: 6, normal: [0, 0, -1], rotation: [0, Math.PI, 0], position: [0, 0, -0.486] },
  { value: 3, normal: [1, 0, 0], rotation: [0, Math.PI / 2, 0], position: [0.486, 0, 0] },
  { value: 4, normal: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0], position: [-0.486, 0, 0] },
  { value: 2, normal: [0, 1, 0], rotation: [-Math.PI / 2, 0, 0], position: [0, 0.486, 0] },
  { value: 5, normal: [0, -1, 0], rotation: [Math.PI / 2, 0, 0], position: [0, -0.486, 0] }
]

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3)
const lerp = (from, to, amount) => from + (to - from) * amount

function dragThresholdPx() {
  const height = stageRef.value?.getBoundingClientRect().height || 320
  return Math.max(80, height * 0.28)
}

function track(item) {
  disposableItems.push(item)
  return item
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  stageRef.value.appendChild(renderer.domElement)
}

function createLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7e463c, 1.45))

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.8)
  keyLight.position.set(-3.8, 6.8, 5.2)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 14
  keyLight.shadow.camera.left = -5
  keyLight.shadow.camera.right = 5
  keyLight.shadow.camera.top = 5
  keyLight.shadow.camera.bottom = -5
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xffe8d8, 1.65)
  fillLight.position.set(4.5, 2.8, -2.5)
  scene.add(fillLight)

  const rimLight = new THREE.PointLight(0xfff4e8, 2.4, 9)
  rimLight.position.set(2.4, 3.8, 3.6)
  scene.add(rimLight)
}

function createTray() {
  trayGroup = new THREE.Group()
  trayGroup.position.y = -1.2
  trayGroup.rotation.x = -0.02

  const trayMaterial = track(new THREE.MeshPhysicalMaterial({
    color: 0xb50916,
    roughness: 0.34,
    metalness: 0.08,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2
  }))
  const trayInnerMaterial = track(new THREE.MeshPhysicalMaterial({
    color: 0xffecea,
    roughness: 0.58,
    metalness: 0.01,
    clearcoat: 0.35,
    clearcoatRoughness: 0.42
  }))

  const base = new THREE.Mesh(track(new THREE.CylinderGeometry(3.05, 3.25, 0.36, 128)), trayMaterial)
  base.position.y = -0.22
  base.castShadow = true
  base.receiveShadow = true
  trayGroup.add(base)

  const inner = new THREE.Mesh(track(new THREE.CylinderGeometry(2.88, 2.98, 0.08, 128)), trayInnerMaterial)
  inner.position.y = 0.02
  inner.receiveShadow = true
  trayGroup.add(inner)

  const lip = new THREE.Mesh(track(new THREE.TorusGeometry(3.03, 0.055, 18, 128)), trayMaterial)
  lip.position.y = 0.1
  lip.rotation.x = Math.PI / 2
  lip.castShadow = true
  trayGroup.add(lip)

  shadowPlane = new THREE.Mesh(
    track(new THREE.CircleGeometry(3.55, 96)),
    track(new THREE.MeshBasicMaterial({ color: 0x2b1715, transparent: true, opacity: 0.22, depthWrite: false }))
  )
  shadowPlane.position.y = -0.46
  shadowPlane.rotation.x = -Math.PI / 2
  shadowPlane.scale.set(1.1, 0.48, 1)
  trayGroup.add(shadowPlane)

  scene.add(trayGroup)
}

function drawRedCrescent(context) {
  context.save()
  context.translate(128, 128)
  context.rotate(-0.08)
  context.shadowColor = 'rgba(0, 0, 0, 0.24)'
  context.shadowBlur = 5
  context.shadowOffsetY = 3

  context.fillStyle = '#d80f25'
  context.beginPath()
  context.arc(-18, -4, 74, 0, Math.PI * 2)
  context.fill()

  context.globalCompositeOperation = 'destination-out'
  context.beginPath()
  context.arc(18, 0, 58, 0, Math.PI * 2)
  context.fill()
  context.globalCompositeOperation = 'source-over'

  context.fillStyle = '#e92735'
  context.strokeStyle = '#fff7f7'
  context.lineWidth = 12
  context.beginPath()
  context.arc(32, 4, 52, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  context.strokeStyle = '#ffffff'
  context.lineWidth = 8
  context.beginPath()
  context.arc(-18, -4, 74, Math.PI * 0.62, Math.PI * 1.62)
  context.stroke()
  context.restore()
}

function drawGreenSwirl(context) {
  context.save()
  context.translate(128, 128)
  context.shadowColor = 'rgba(0, 0, 0, 0.24)'
  context.shadowBlur = 5
  context.shadowOffsetY = 3
  context.fillStyle = '#0a8f32'
  context.strokeStyle = '#f8fff7'
  context.lineWidth = 12

  for (let index = 0; index < 5; index += 1) {
    context.save()
    context.rotate((Math.PI * 2 * index) / 5)
    context.beginPath()
    context.moveTo(0, 0)
    context.bezierCurveTo(22, -62, 94, -62, 82, -8)
    context.bezierCurveTo(72, 35, 28, 48, 2, 16)
    context.closePath()
    context.fill()
    context.stroke()
    context.restore()
  }

  context.fillStyle = '#0b7f2d'
  context.beginPath()
  context.arc(0, 0, 20, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function makeSymbolTexture(type) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, 256, 256)
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (type === 'green') {
    drawGreenSwirl(context)
  } else if (type === 'black') {
    drawRedCrescent(context)
    context.save()
    context.globalAlpha = 0.82
    context.fillStyle = '#111111'
    context.strokeStyle = '#ffffff'
    context.lineWidth = 9
    context.beginPath()
    context.ellipse(112, 154, 55, 36, -0.22, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.restore()
  } else {
    drawRedCrescent(context)
  }

  const texture = track(new THREE.CanvasTexture(canvas))
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function symbolTypeForValue(value) {
  if (value === 2 || value === 5) return 'green'
  if (value === 4 || value === 6) return 'black'
  return 'red'
}

function createFaceSymbol(face) {
  const texture = makeSymbolTexture(symbolTypeForValue(face.value))
  const material = track(new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  }))
  const symbol = new THREE.Mesh(track(new THREE.PlaneGeometry(0.72, 0.72)), material)
  symbol.renderOrder = 3
  symbol.position.set(...face.position)
  symbol.rotation.set(...face.rotation)
  return symbol
}

function createDie(value, index, total) {
  const die = new THREE.Group()
  const base = layouts[total]?.[index] || [0, 0]
  die.position.set(base[0], 0.02, base[1])
  die.rotation.set(-0.18 + index * 0.07, 0.32 - index * 0.18, -0.12 + index * 0.12)
  die.scale.setScalar(1.22)

  const body = new THREE.Mesh(
    track(new RoundedBoxGeometry(0.92, 0.92, 0.92, 5, 0.13)),
    track(new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.48,
      clearcoatRoughness: 0.18
    }))
  )
  body.castShadow = true
  body.receiveShadow = true
  die.add(body)

  faceDefinitions.forEach((face) => die.add(createFaceSymbol(face)))

  const target = diceTargets[value] || diceTargets[1]
  die.userData.basePosition = die.position.clone()
  die.userData.restRotation = new THREE.Euler(target.x, target.y, target.z)
  die.rotation.copy(die.userData.restRotation)
  return die
}

function disposeObject(object) {
  object.traverse?.((item) => {
    item.geometry?.dispose?.()
    if (Array.isArray(item.material)) {
      item.material.forEach((material) => material.dispose?.())
    } else {
      item.material?.dispose?.()
    }
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

  const cupMaterial = track(new THREE.MeshPhysicalMaterial({
    color: 0xb70d19,
    roughness: 0.29,
    metalness: 0.12,
    clearcoat: 0.95,
    clearcoatRoughness: 0.16
  }))
  const darkRed = track(new THREE.MeshPhysicalMaterial({
    color: 0x6b0710,
    roughness: 0.38,
    metalness: 0.08,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2
  }))
  const highlight = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.26, depthWrite: false }))

  const cupProfile = [
    new THREE.Vector2(1.96, -1.5),
    new THREE.Vector2(2.18, -1.34),
    new THREE.Vector2(2.28, -0.72),
    new THREE.Vector2(2.24, 0.18),
    new THREE.Vector2(2.14, 0.92),
    new THREE.Vector2(1.96, 1.08)
  ]

  const body = new THREE.Mesh(track(new THREE.LatheGeometry(cupProfile, 160)), cupMaterial)
  body.castShadow = true
  body.receiveShadow = true
  cupGroup.add(body)

  const top = new THREE.Mesh(track(new THREE.CylinderGeometry(2.12, 2.28, 0.14, 160)), cupMaterial)
  top.position.y = 1.08
  top.castShadow = true
  cupGroup.add(top)

  const bottomBand = new THREE.Mesh(track(new THREE.CylinderGeometry(2.32, 2.46, 0.34, 160)), darkRed)
  bottomBand.position.y = -1.46
  bottomBand.castShadow = true
  bottomBand.receiveShadow = true
  cupGroup.add(bottomBand)

  ;[-0.64, 0.18].forEach((y) => {
    const groove = new THREE.Mesh(track(new THREE.TorusGeometry(2.25, 0.035, 14, 160)), darkRed)
    groove.position.y = y
    groove.rotation.x = Math.PI / 2
    groove.castShadow = true
    cupGroup.add(groove)
  })

  ;[-0.36, 0.52, 1.12].forEach((y) => {
    const rim = new THREE.Mesh(track(new THREE.TorusGeometry(2.22, 0.026, 12, 160)), highlight)
    rim.position.set(0.04, y, 0.02)
    rim.rotation.x = Math.PI / 2
    cupGroup.add(rim)
  })

  const shine = new THREE.Mesh(track(new THREE.PlaneGeometry(0.55, 2.25)), highlight)
  shine.position.set(1.4, -0.16, 1.7)
  shine.rotation.set(-0.18, 0.42, -0.06)
  cupGroup.add(shine)

  cupGroup.position.y = props.open ? openCupY : closedCupY
  cupGroup.position.z = 0
  cupGroup.scale.setScalar(0.84)
  cupGroup.rotation.set(-0.08, 0.03, 0)
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
  shakePhase += delta * 8.6
  revealPulse = Math.max(0, revealPulse - delta * 1.9)

  const forwardProgress = Math.max(0, dragOffset.value.y) / dragThresholdPx()
  const dragWorldX = Math.max(-2.7, Math.min(2.7, dragOffset.value.x / 82))
  const dragWorldY = Math.max(-1.75, Math.min(1.25, -dragOffset.value.y / 112))
  const dragWorldZ = Math.min(3.1, forwardProgress * 1.95)
  const baseCupTarget = props.open ? openCupY : closedCupY
  const rollingShake = props.rolling ? Math.max(0, Math.sin(shakePhase * 1.35) * 0.08) : 0
  const targetCupX = props.rolling ? 0 : dragWorldX
  const targetCupY = props.rolling ? closedCupY + rollingShake : baseCupTarget + dragWorldY
  const targetCupZ = props.rolling ? 0 : dragWorldZ
  const targetCupScale = 0.84 + (props.rolling ? 0 : Math.min(0.36, forwardProgress * 0.26))
  const cupSpeed = isDragging.value ? 0.9 : 0.14

  cupGroup.position.x = lerp(cupGroup.position.x, targetCupX, cupSpeed)
  cupGroup.position.y = lerp(cupGroup.position.y, targetCupY, cupSpeed)
  cupGroup.position.z = lerp(cupGroup.position.z, targetCupZ, cupSpeed)
  cupGroup.scale.setScalar(lerp(cupGroup.scale.x, targetCupScale, cupSpeed))
  cupGroup.rotation.z = lerp(cupGroup.rotation.z, props.rolling ? Math.sin(shakePhase * 1.85) * 0.12 : isDragging.value ? dragWorldX * -0.045 : 0, 0.16)
  cupGroup.rotation.y = lerp(cupGroup.rotation.y, props.rolling ? Math.cos(shakePhase * 1.45) * 0.13 : 0.03, 0.14)
  cupGroup.rotation.x = lerp(cupGroup.rotation.x, props.rolling ? -0.15 + Math.sin(shakePhase) * 0.06 : -0.08, 0.14)

  diceGroup.visible = props.open && !props.rolling
  diceGroup.position.x = props.rolling ? Math.sin(shakePhase * 2.2) * 0.08 : 0
  diceGroup.position.z = props.rolling ? Math.cos(shakePhase * 1.9) * 0.065 : 0

  diceMeshes.forEach((die, index) => {
    const phase = shakePhase + index * 0.73
    const base = die.userData.basePosition
    const rest = die.userData.restRotation

    if (props.rolling) {
      die.position.y = base.y + Math.abs(Math.sin(phase * 1.8)) * 0.16
      die.rotation.x += delta * (6.4 + index * 0.75)
      die.rotation.y += delta * (8.8 + index * 0.62)
      die.rotation.z += delta * (5.2 + index * 0.48)
    } else {
      const revealBounce = easeOutCubic(revealPulse) * 0.32
      die.position.y = lerp(die.position.y, base.y + revealBounce, 0.18)
      die.rotation.x = lerp(die.rotation.x, rest.x, 0.15)
      die.rotation.y = lerp(die.rotation.y, rest.y, 0.15)
      die.rotation.z = lerp(die.rotation.z, rest.z, 0.15)
    }
  })

  trayGroup.scale.setScalar(1 + (props.rolling ? 0.014 : 0))
  shadowPlane.material.opacity = props.open ? 0.18 : 0.28
  renderer.render(scene, camera)
  animationFrame = window.requestAnimationFrame(animate)
}

function setupScene() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 2.85, 10.6)
  camera.lookAt(0, -0.52, 0)

  createRenderer()
  createLights()
  createTray()

  diceGroup = new THREE.Group()
  diceGroup.position.y = -0.88
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

function startDrag(event) {
  if (!canDrag.value) return

  dragPointerId = event.pointerId
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragOffset.value = { x: 0, y: 0 }
  isDragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
  event.preventDefault()
}

function moveDrag(event) {
  if (!isDragging.value || event.pointerId !== dragPointerId) return

  const maxHorizontal = dragThresholdPx() * 3.1
  const minVertical = -dragThresholdPx() * 1.7
  const maxVertical = dragThresholdPx() * 2.8
  dragOffset.value = {
    x: Math.max(-maxHorizontal, Math.min(event.clientX - dragStartX, maxHorizontal)),
    y: Math.max(minVertical, Math.min(event.clientY - dragStartY, maxVertical))
  }
  event.preventDefault()
}

function endDrag(event) {
  if (!isDragging.value || event.pointerId !== dragPointerId) return


  const shouldRoll = dragOffset.value.y >= dragThresholdPx()
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  isDragging.value = false
  dragPointerId = null

  if (shouldRoll && !props.rolling) {
    emit('roll-request')
  }

  window.setTimeout(() => {
    dragOffset.value = { x: 0, y: 0 }
  }, shouldRoll ? 160 : 0)
  event.preventDefault()
}

function cancelDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  dragPointerId = null
  dragOffset.value = { x: 0, y: 0 }
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
    if (isRolling) {
      dragOffset.value = { x: 0, y: 0 }
      isDragging.value = false
      return
    }

    rebuildDice()
    if (props.open) revealPulse = 1
  }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) revealPulse = 1
  }
)
</script>
