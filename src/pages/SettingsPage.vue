<template>
  <q-page class="screen info-screen">
    <div class="page-card">
      <div class="page-header">
        <q-btn flat round icon="arrow_back" @click="$router.back()" />
        <div>
          <p class="eyebrow">Setup Game</p>
          <h1>Pengaturan</h1>
        </div>
      </div>

      <q-input
        v-model="form.playerName"
        outlined
        rounded
        label="Nama Pemain"
        class="q-mb-md"
      />

      <div class="setting-block">
        <div class="setting-title">Jumlah Dadu</div>
        <q-option-group
          v-model="form.diceCount"
          :options="diceOptions"
          color="secondary"
          inline
        />
      </div>

      <q-input
        v-model.number="form.maxRounds"
        outlined
        rounded
        type="number"
        min="1"
        max="50"
        label="Jumlah Ronde"
        class="q-mb-md"
      />

      <div class="setting-block">
        <div class="setting-title">Kecepatan Animasi</div>
        <q-option-group
          v-model="form.animationSpeed"
          :options="speedOptions"
          color="secondary"
          inline
        />
      </div>

      <q-list bordered separator class="rounded-list q-mb-md">
        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>Suara Roll</q-item-label>
            <q-item-label caption>Efek suara ringan saat dadu dilempar.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="form.sound" color="secondary" />
          </q-item-section>
        </q-item>

        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>Getar</q-item-label>
            <q-item-label caption>Aktif pada perangkat yang mendukung vibrate.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="form.vibration" color="secondary" />
          </q-item-section>
        </q-item>

        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>Tampilkan Riwayat</q-item-label>
            <q-item-label caption>Menampilkan hasil roll sebelumnya.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="form.showHistory" color="secondary" />
          </q-item-section>
        </q-item>

        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>Tampilkan Skor/Chip</q-item-label>
            <q-item-label caption>Chip hanya skor hiburan, bukan transaksi.</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="form.showScore" color="secondary" />
          </q-item-section>
        </q-item>
      </q-list>

      <q-btn unelevated rounded color="secondary" label="Simpan Pengaturan" icon="save" class="full-width" @click="save" />
    </div>
  </q-page>
</template>

<script setup>
import { reactive } from 'vue'
import { Notify } from 'quasar'
import { useGameStore } from '../stores/gameStore'

const { state, updateSettings } = useGameStore()

const form = reactive({ ...state.settings })

const diceOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 }
]

const speedOptions = [
  { label: 'Pelan', value: 'slow' },
  { label: 'Normal', value: 'normal' },
  { label: 'Cepat', value: 'fast' }
]

function save() {
  const maxRounds = Number(form.maxRounds)
  updateSettings({
    ...form,
    diceCount: Number(form.diceCount),
    maxRounds: Number.isFinite(maxRounds) && maxRounds > 0 ? Math.min(maxRounds, 50) : 10
  })

  Notify.create({ type: 'positive', message: 'Pengaturan berhasil disimpan.' })
}
</script>
