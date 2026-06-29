import { reactive, computed } from 'vue'

const SETTINGS_KEY = 'dice_game_settings_v1'
const RESULT_KEY = 'dice_game_last_result_v1'

const defaultSettings = {
  playerName: 'Player',
  diceCount: 3,
  maxRounds: 10,
  sound: true,
  vibration: true,
  showHistory: true,
  showScore: true,
  animationSpeed: 'normal'
}

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch (error) {
    return fallback
  }
}

function loadSettings() {
  if (typeof localStorage === 'undefined') return { ...defaultSettings }
  const saved = safeParse(localStorage.getItem(SETTINGS_KEY), {})
  return { ...defaultSettings, ...saved }
}

function saveSettings(settings) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function saveLastResult(payload) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(RESULT_KEY, JSON.stringify(payload))
}

function randomDiceValue() {
  return Math.floor(Math.random() * 6) + 1
}

function makeDice(count) {
  return Array.from({ length: count }, () => randomDiceValue())
}

const state = reactive({
  settings: loadSettings(),
  dice: [1, 1, 1],
  history: [],
  round: 0,
  score: 0,
  chips: 100,
  rolling: false,
  finished: false,
  lastTotal: 0,
  lastResultText: 'Tekan Roll untuk mulai'
})

function playRollSound() {
  if (!state.settings.sound || typeof window === 'undefined') return

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.value = 420
    gain.gain.setValueAtTime(0.045, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.18)
  } catch (error) {
    // Sound is optional. Ignore unsupported browser errors.
  }
}

function vibrate(pattern = 45) {
  if (!state.settings.vibration || typeof navigator === 'undefined') return
  if (navigator.vibrate) navigator.vibrate(pattern)
}

function resetGame() {
  state.dice = makeDice(state.settings.diceCount)
  state.history = []
  state.round = 0
  state.score = 0
  state.chips = 100
  state.rolling = false
  state.finished = false
  state.lastTotal = 0
  state.lastResultText = 'Tekan Roll untuk mulai'
}

function updateSettings(partial) {
  state.settings = { ...state.settings, ...partial }
  saveSettings(state.settings)
  if (!state.rolling && state.history.length === 0) {
    state.dice = makeDice(state.settings.diceCount)
  }
}

function finishGame() {
  state.finished = true
  const payload = {
    playerName: state.settings.playerName,
    round: state.round,
    score: state.score,
    chips: state.chips,
    history: state.history,
    finishedAt: new Date().toISOString()
  }
  saveLastResult(payload)
}

function rollDice() {
  if (state.rolling || state.finished) return Promise.resolve(false)

  state.rolling = true
  state.lastResultText = 'Dadu sedang dilempar...'
  playRollSound()
  vibrate([25, 30, 25])

  const ticksBySpeed = {
    slow: 18,
    normal: 14,
    fast: 9
  }
  const intervalBySpeed = {
    slow: 90,
    normal: 75,
    fast: 55
  }

  const maxTicks = ticksBySpeed[state.settings.animationSpeed] || ticksBySpeed.normal
  const interval = intervalBySpeed[state.settings.animationSpeed] || intervalBySpeed.normal

  return new Promise((resolve) => {
    let tick = 0
    const timer = window.setInterval(() => {
      state.dice = makeDice(state.settings.diceCount)
      tick += 1

      if (tick >= maxTicks) {
        window.clearInterval(timer)
        const finalDice = makeDice(state.settings.diceCount)
        const total = finalDice.reduce((sum, value) => sum + value, 0)

        state.dice = finalDice
        state.round += 1
        state.score += total
        state.lastTotal = total
        state.chips = Math.max(0, state.chips + total)
        state.lastResultText = `Hasil: ${finalDice.join(' + ')} = ${total}`
        state.history.unshift({
          id: Date.now(),
          round: state.round,
          dice: finalDice,
          total,
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        })

        state.rolling = false
        playRollSound()
        vibrate(60)

        if (state.round >= state.settings.maxRounds) {
          finishGame()
        }

        resolve(true)
      }
    }, interval)
  })
}

const totalDice = computed(() => state.dice.reduce((sum, value) => sum + value, 0))
const progress = computed(() => Math.min(1, state.round / state.settings.maxRounds))

export function useGameStore() {
  return {
    state,
    totalDice,
    progress,
    rollDice,
    resetGame,
    updateSettings,
    finishGame
  }
}
