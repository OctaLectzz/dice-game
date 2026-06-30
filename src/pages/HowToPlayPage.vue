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
          <p>Di halaman permainan, sentuh/tahan <b>penutup merah</b> pada area dadu.</p>
        </div>
        <div class="guide-item">
          <span>2</span>
          <p>Seret penutup ke bawah/maju sampai indikator berubah menjadi <b>Lepaskan untuk roll</b>. Penutup akan mengikuti arah geseranmu.</p>
        </div>
        <div class="guide-item">
          <span>3</span>
          <p>Lepaskan penutup untuk mengocok dadu secara otomatis. Dadu bernilai 1 sampai 6.</p>
        </div>
        <div class="guide-item">
          <span>4</span>
          <p>Setelah animasi selesai, penutup terbuka dan hasil dadu tampil. Skor, chip, dan riwayat bertambah berdasarkan total dadu.</p>
        </div>
        <div class="guide-item">
          <span>5</span>
          <p>Tarik penutup lagi untuk ronde berikutnya, atau tekan <b>RESET</b> untuk mulai ulang. Permainan selesai saat jumlah ronde sesuai pengaturan tercapai.</p>
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
