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
  lastResultText: 'Tarik penutup untuk mulai'
})

let audioContext
let masterGain

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null

  if (!audioContext) {
    audioContext = new AudioContext()
    masterGain = audioContext.createGain()
    masterGain.gain.value = 0.9
    masterGain.connect(audioContext.destination)
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

function createNoiseBuffer(context, duration = 0.32) {
  const sampleRate = context.sampleRate
  const buffer = context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length)
  }

  return buffer
}

function playNoiseBurst(context, startTime, duration, volume, filterFrequency = 900, type = 'bandpass') {
  const noise = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  noise.buffer = createNoiseBuffer(context, duration)
  filter.type = type
  filter.frequency.setValueAtTime(filterFrequency, startTime)
  filter.Q.setValueAtTime(1.6, startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  noise.start(startTime)
  noise.stop(startTime + duration)
}

function playThump(context, startTime, volume = 0.42, frequency = 110) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(48, startTime + 0.18)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(260, startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.26)

  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(startTime + 0.28)
}

function playDiceClick(context, startTime, volume = 0.22, frequency = 620) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.55, startTime + 0.055)
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(180, startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.11)

  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(startTime + 0.12)
}

function playDiceShakeSound(durationMs = 1000, diceCount = 3) {
  if (!state.settings.sound) return

  try {
    const context = getAudioContext()
    if (!context) return
    const now = context.currentTime
    const duration = Math.max(0.55, durationMs / 1000)
    const hitCount = Math.max(10, Math.round(duration * (9 + diceCount * 1.8)))

    playThump(context, now, 0.34, 118)
    playNoiseBurst(context, now + 0.02, Math.min(duration, 0.72), 0.18, 780)

    for (let index = 0; index < hitCount; index += 1) {
      const progress = index / Math.max(1, hitCount - 1)
      const time = now + 0.06 + progress * duration + Math.random() * 0.035
      const wave = 0.5 + Math.sin(progress * Math.PI * 5.5) * 0.5
      const volume = 0.11 + wave * 0.11 + Math.random() * 0.07
      const pitch = 360 + Math.random() * 780

      playDiceClick(context, time, volume, pitch)

      if (index % 3 === 0) {
        playNoiseBurst(context, time, 0.09 + Math.random() * 0.08, 0.045 + Math.random() * 0.04, 1200 + Math.random() * 900, 'bandpass')
      }

      if (index % 5 === 0) {
        playThump(context, time + 0.018, 0.12 + Math.random() * 0.08, 72 + Math.random() * 36)
      }
    }

    playNoiseBurst(context, now + duration * 0.78, 0.22, 0.11, 1500, 'highpass')
  } catch (error) {
    // Sound is optional. Ignore unsupported browser errors.
  }
}

function playRollRevealSound(diceCount = 3) {
  if (!state.settings.sound) return

  try {
    const context = getAudioContext()
    if (!context) return
    const now = context.currentTime

    playNoiseBurst(context, now, 0.2, 0.12, 1450, 'highpass')
    playThump(context, now + 0.08, 0.38, 92)

    for (let index = 0; index < diceCount; index += 1) {
      playDiceClick(context, now + 0.14 + index * 0.045, 0.2, 540 + Math.random() * 520)
      playNoiseBurst(context, now + 0.145 + index * 0.045, 0.08, 0.055, 1800, 'highpass')
    }
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
  state.lastResultText = 'Tarik penutup untuk mulai'
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
  const rollDuration = maxTicks * interval

  playDiceShakeSound(rollDuration, state.settings.diceCount)
  vibrate([25, 30, 25])

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
        window.setTimeout(() => playRollRevealSound(finalDice.length), 120)
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





