<template>
  <div class="dice-3d-wrapper" :class="{ 'is-small': small }">
    <div class="dice-3d-box" :class="{ 'is-rolling': rolling }" :style="diceStyle">
      <!-- Face 1 (Front) -->
      <div class="dice-face-3d face-front">
        <span class="dot center red-dot" />
      </div>
      <!-- Face 6 (Back) -->
      <div class="dice-face-3d face-back">
        <span class="dot top-left" />
        <span class="dot top-right" />
        <span class="dot mid-left" />
        <span class="dot mid-right" />
        <span class="dot bottom-left" />
        <span class="dot bottom-right" />
      </div>
      <!-- Face 3 (Right) -->
      <div class="dice-face-3d face-right">
        <span class="dot top-left" />
        <span class="dot center" />
        <span class="dot bottom-right" />
      </div>
      <!-- Face 4 (Left) -->
      <div class="dice-face-3d face-left">
        <span class="dot top-left" />
        <span class="dot top-right" />
        <span class="dot bottom-left" />
        <span class="dot bottom-right" />
      </div>
      <!-- Face 2 (Top) -->
      <div class="dice-face-3d face-top">
        <span class="dot top-left" />
        <span class="dot bottom-right" />
      </div>
      <!-- Face 5 (Bottom) -->
      <div class="dice-face-3d face-bottom">
        <span class="dot top-left" />
        <span class="dot top-right" />
        <span class="dot center" />
        <span class="dot bottom-left" />
        <span class="dot bottom-right" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  rolling: {
    type: Boolean,
    default: false
  },
  small: {
    type: Boolean,
    default: false
  }
})

// Store a persistent random offset for each roll so the dice rests at a slightly rotated angle
const randomRotateX = ref(0)
const randomRotateY = ref(0)
const randomRotateZ = ref(0)

const updateRandomOffsets = () => {
  randomRotateX.value = Math.floor(Math.random() * 12) - 6 // -6 to 6 deg
  randomRotateY.value = Math.floor(Math.random() * 12) - 6 // -6 to 6 deg
  randomRotateZ.value = Math.floor(Math.random() * 30) - 15 // -15 to 15 deg
}

// Initial offset
updateRandomOffsets()

// Update offsets on every new roll/value change
watch(() => props.value, () => {
  updateRandomOffsets()
})

const diceStyle = computed(() => {
  if (props.rolling) {
    return {}
  }

  // Base rotations to align faces to the front:
  // Face 1 (Front): rotateX(0deg) rotateY(0deg)
  // Face 6 (Back): rotateY(180deg)
  // Face 3 (Right): rotateY(-90deg)
  // Face 4 (Left): rotateY(90deg)
  // Face 2 (Top): rotateX(-90deg)
  // Face 5 (Bottom): rotateX(90deg)
  let rx = 0
  let ry = 0
  let rz = 0

  switch (props.value) {
    case 1:
      rx = 0; ry = 0; break
    case 2:
      rx = -90; ry = 0; break
    case 3:
      rx = 0; ry = -90; break
    case 4:
      rx = 0; ry = 90; break
    case 5:
      rx = 90; ry = 0; break
    case 6:
      rx = 180; ry = 0; break
  }

  // Add the subtle resting random angles for realism
  rx += randomRotateX.value
  ry += randomRotateY.value
  rz += randomRotateZ.value

  return {
    transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
  }
})
</script>
