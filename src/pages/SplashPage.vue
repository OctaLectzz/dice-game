<template>
  <q-page class="screen splash-screen flex flex-center">
    <div class="splash-card text-center">
      <div class="app-logo animate__animated animate__zoomIn">
        <div class="logo-dice">⚂</div>
      </div>
      <h1>Dice Fun</h1>
      <p>Permainan dadu ringan untuk hiburan pribadi</p>
      <q-linear-progress indeterminate rounded color="secondary" class="loading-bar" />
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  window.setTimeout(() => {
    router.replace({ name: 'menu' })
  }, 1600)
})
</script>
