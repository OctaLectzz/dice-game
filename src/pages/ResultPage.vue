<template>
  <q-page class="screen result-screen">
    <div class="result-card">
      <div class="trophy">🏆</div>
      <p class="eyebrow">Game Selesai</p>
      <h1>Hasil Akhir</h1>

      <section class="final-stats">
        <div>
          <span>Pemain</span>
          <b>{{ state.settings.playerName }}</b>
        </div>
        <div>
          <span>Total Ronde</span>
          <b>{{ state.round }}</b>
        </div>
        <div>
          <span>Total Skor</span>
          <b>{{ state.score }}</b>
        </div>
        <div>
          <span>Chip Akhir</span>
          <b>{{ state.chips }}</b>
        </div>
      </section>

      <div class="result-history">
        <div class="section-heading">
          <span>Ringkasan Roll</span>
          <small>{{ state.history.length }} data</small>
        </div>
        <div v-if="state.history.length === 0" class="empty-history">Belum ada data permainan.</div>
        <div v-for="item in state.history" :key="item.id" class="history-item">
          <div>
            <b>Ronde {{ item.round }}</b>
            <small>{{ item.createdAt }}</small>
          </div>
          <span>{{ item.dice.join(' + ') }} = {{ item.total }}</span>
        </div>
      </div>

      <div class="result-actions">
        <q-btn unelevated rounded color="secondary" icon="replay" label="Main Lagi" @click="playAgain" />
        <q-btn outline rounded color="primary" icon="home" label="Kembali ke Menu" to="/menu" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const { state, resetGame } = useGameStore()

function playAgain() {
  resetGame()
  router.push({ name: 'game' })
}
</script>
