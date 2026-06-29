<template>
  <div class="cup-scene" :class="{ 'is-rolling': rolling, 'is-open': open, 'is-closed': !open }">
    <!-- Dice plate is always present so the 3D dice are physically inside the scene -->
    <div class="dice-plate">
      <Dice3D
        v-for="(item, index) in dice"
        :key="`${index}-${item}`"
        :value="item"
        :rolling="rolling"
        :small="dice.length >= 3"
      />
    </div>

    <!-- The 3D cup body container that moves up and down -->
    <div class="cup-body-container" :class="{ 'is-open': open, 'is-closed': !open, 'is-rolling': rolling }">
      <div class="cup-body" aria-label="red 3D dice cup">
        <div class="cup-top" />
        <div class="cup-ring cup-ring-1" />
        <div class="cup-ring cup-ring-2" />
        <div class="cup-ring cup-ring-3" />
        <div class="cup-shine" />
      </div>
    </div>

    <!-- Separate cup shadow on the ground that scales/fades based on cup height -->
    <div class="cup-shadow-3d" :class="{ 'is-open': open }" />
  </div>
</template>

<script setup>
import Dice3D from './Dice3D.vue'

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
</script>
