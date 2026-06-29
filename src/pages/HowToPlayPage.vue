<template>
  <q-page class="screen info-screen">
    <div class="page-card">
      <div class="page-header">
        <q-btn flat round icon="arrow_back" @click="$router.back()" />
        <div>
          <p class="eyebrow">Panduan</p>
          <h1>Cara Bermain</h1>
        </div>
      </div>

      <div class="guide-list">
        <div class="guide-item">
          <span>1</span>
          <p>Tekan tombol <b>Roll</b> pada halaman permainan.</p>
        </div>
        <div class="guide-item">
          <span>2</span>
          <p>Aplikasi akan menampilkan animasi lempar dadu seperti cup pada video referensi.</p>
        </div>
        <div class="guide-item">
          <span>3</span>
          <p>Angka dadu digenerate otomatis dari 1 sampai 6.</p>
        </div>
        <div class="guide-item">
          <span>4</span>
          <p>Hasil roll disimpan ke riwayat. Skor bertambah berdasarkan total angka dadu.</p>
        </div>
        <div class="guide-item">
          <span>5</span>
          <p>Permainan selesai ketika jumlah ronde sesuai pengaturan sudah tercapai.</p>
        </div>
      </div>

      <q-btn unelevated rounded color="secondary" label="Mulai Bermain" icon="play_arrow" class="full-width q-mt-lg" @click="startGame" />
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const { resetGame } = useGameStore()

function startGame() {
  resetGame()
  router.push({ name: 'game' })
}
</script>
