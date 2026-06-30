<template>
  <q-page class="screen menu-screen">
    <div class="menu-shell">
      <section class="hero-panel">
        <GameHeaderSlots :variant="0" />
        <div class="hero-cup-wrap">
          <DiceCup :dice="[5, 3, 6]" :open="false" />
        </div>
        <div class="hero-copy">
          <p class="eyebrow">Private Entertainment</p>
          <h1>Dice Fun</h1>
          <p>Tarik penutup merah, lepaskan untuk roll, lalu lihat hasil dadu otomatis dengan riwayat dan skor.</p>
        </div>
      </section>

      <section class="menu-actions">
        <q-btn unelevated rounded color="secondary" size="lg" icon="play_arrow" label="Mulai Bermain" class="main-action" @click="startGame" />
        <q-btn outline rounded color="primary" size="md" icon="help_outline" label="Cara Bermain" to="/how-to-play" />
        <q-btn outline rounded color="primary" size="md" icon="settings" label="Pengaturan" to="/settings" />
        <q-btn flat rounded color="grey-8" size="md" icon="logout" label="Keluar" @click="exitApp" />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { Dialog, Notify } from 'quasar'
import { useRouter } from 'vue-router'
import DiceCup from '../components/DiceCup.vue'
import GameHeaderSlots from '../components/GameHeaderSlots.vue'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const { resetGame } = useGameStore()

function startGame() {
  resetGame()
  router.push({ name: 'game' })
}

function exitApp() {
  Dialog.create({
    title: 'Keluar aplikasi?',
    message: 'Pada browser, tombol keluar hanya akan mencoba menutup tab. Pada APK, user dapat keluar dengan tombol back perangkat.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    window.close()
    Notify.create({ type: 'info', message: 'Gunakan tombol Back/Home perangkat jika aplikasi tidak tertutup otomatis.' })
  })
}
</script>
