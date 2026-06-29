<template>
  <q-page class="screen game-screen">
    <div class="game-shell">
      <header class="game-topbar">
        <q-btn flat round dense icon="arrow_back" color="dark" @click="goMenu" />
        <div class="game-title">
          <span>Dice Fun</span>
          <small>{{ state.settings.playerName }}</small>
        </div>
        <q-btn flat round dense icon="settings" color="dark" to="/settings" />
      </header>

      <GameHeaderSlots :variant="state.round" />

      <section v-if="state.settings.showScore" class="score-panel">
        <div>
          <span>Ronde</span>
          <b>{{ state.round }}/{{ state.settings.maxRounds }}</b>
        </div>
        <div>
          <span>Skor</span>
          <b>{{ state.score }}</b>
        </div>
        <div>
          <span>Chip</span>
          <b>{{ state.chips }}</b>
        </div>
      </section>

      <q-linear-progress :value="progress" rounded color="secondary" track-color="grey-3" class="round-progress" />

      <main class="play-area">
        <div class="result-badge" :class="{ active: state.lastTotal > 0 }">
          {{ state.lastResultText }}
        </div>

        <DiceCup
          :dice="state.dice"
          :rolling="state.rolling"
          :open="!state.rolling && state.lastTotal > 0"
        />
      </main>

      <section v-if="state.settings.showHistory" class="history-panel">
        <div class="section-heading">
          <span>Riwayat Hasil</span>
          <small>{{ state.history.length }} roll</small>
        </div>
        <div v-if="state.history.length === 0" class="empty-history">Belum ada hasil.</div>
        <div v-else class="history-list">
          <div v-for="item in state.history.slice(0, 5)" :key="item.id" class="history-item">
            <div>
              <b>Ronde {{ item.round }}</b>
              <small>{{ item.createdAt }}</small>
            </div>
            <span>{{ item.dice.join(' + ') }} = {{ item.total }}</span>
          </div>
        </div>
      </section>

      <footer class="game-footer">
        <q-btn
          unelevated
          rounded
          color="secondary"
          size="lg"
          icon="casino"
          :label="state.finished ? 'Lihat Hasil' : state.rolling ? 'Rolling...' : 'ROLL'"
          class="roll-button"
          :loading="state.rolling"
          @click="handleRoll"
        />
      </footer>
    </div>
  </q-page>
</template>

<script setup>
import { watch } from 'vue'
import { Dialog } from 'quasar'
import { useRouter } from 'vue-router'
import DiceCup from '../components/DiceCup.vue'
import GameHeaderSlots from '../components/GameHeaderSlots.vue'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const { state, progress, rollDice } = useGameStore()

async function handleRoll() {
  if (state.finished) {
    router.push({ name: 'result' })
    return
  }

  await rollDice()

  if (state.finished) {
    window.setTimeout(() => router.push({ name: 'result' }), 650)
  }
}

function goMenu() {
  Dialog.create({
    title: 'Kembali ke menu?',
    message: 'Progress permainan berjalan akan tetap tersimpan sampai kamu mulai game baru.',
    cancel: true
  }).onOk(() => router.push({ name: 'menu' }))
}

watch(
  () => state.settings.diceCount,
  () => {
    if (state.history.length === 0 && !state.rolling) {
      state.dice = Array.from({ length: state.settings.diceCount }, () => 1)
    }
  }
)
</script>


