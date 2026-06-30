<template>
  <div class="slot-strip" aria-label="Preview hasil dadu">
    <button
      v-for="(slot, index) in slots"
      :key="`${index}-${slot.value}-${slot.type}`"
      class="slot-card"
      :class="`slot-card--${slot.type}`"
      type="button"
      aria-label="preview hasil dadu"
    >
      <span class="slot-symbol" :class="`slot-symbol--${slot.type}`" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dice: {
    type: Array,
    default: () => [1, 5, 1]
  }
})

function symbolType(value) {
  if (value === 2 || value === 5) return 'green'
  if (value === 4 || value === 6) return 'black'
  return 'red'
}

const slots = computed(() => {
  const values = props.dice.slice(0, 3)
  while (values.length < 3) values.push(1)
  return values.map((value) => ({ value, type: symbolType(value) }))
})
</script>
