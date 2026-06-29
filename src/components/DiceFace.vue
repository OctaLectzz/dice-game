<template>
  <div class="dice-face" :class="[`dice-${value}`, { 'dice-face--small': small }]">
    <span
      v-for="position in 9"
      :key="position"
      class="dice-dot"
      :class="{ 'is-visible': visibleDots.includes(position) }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 1
  },
  small: {
    type: Boolean,
    default: false
  }
})

const dotMap = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
}

const visibleDots = computed(() => dotMap[props.value] || dotMap[1])
</script>
