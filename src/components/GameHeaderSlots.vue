<template>
  <div class="slot-strip">
    <button
      v-for="slot in slots"
      :key="slot.id"
      class="slot-card"
      :class="slot.type"
      type="button"
      aria-label="slot indicator"
    >
      <span v-if="slot.type === 'green-swirl'" class="swirl">✦</span>
      <span v-else-if="slot.type === 'red-dot'" class="red-mark" />
      <span v-else class="target-mark" />
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: Number,
    default: 0
  }
})

const patterns = [
  [
    { id: 1, type: 'green-swirl' },
    { id: 2, type: 'green-swirl' },
    { id: 3, type: 'green-swirl' }
  ],
  [
    { id: 1, type: 'green-swirl' },
    { id: 2, type: 'target' },
    { id: 3, type: 'green-swirl' }
  ],
  [
    { id: 1, type: 'target' },
    { id: 2, type: 'red-dot' },
    { id: 3, type: 'green-swirl' }
  ],
  [
    { id: 1, type: 'red-dot' },
    { id: 2, type: 'green-swirl' },
    { id: 3, type: 'red-dot' }
  ]
]

const slots = patterns[props.variant % patterns.length]
</script>
