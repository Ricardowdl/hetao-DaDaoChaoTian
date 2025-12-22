<template>
  <RouterView />
  <ProgressPage />
  <div v-if="uiStore.toast.show" class="app-toast" :class="uiStore.toast.type">
    <span v-if="uiStore.toast.type === 'loading'" class="app-toast-spinner" aria-hidden="true" />
    <span class="app-toast-text">{{ uiStore.toast.text }}</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import { useCharacterStore } from './stores/useCharacterStore'
import { useSettingsStore } from './stores/useSettingsStore'
import { useUIStore } from './stores/useUIStore'
import ProgressPage from './components/ProgressPage.vue'

const characterStore = useCharacterStore()
const settingsStore = useSettingsStore()
const uiStore = useUIStore()

function applyVisualSettings() {
  const scale = Math.max(0.5, Math.min(2, (settingsStore.uiScale || 100) / 100))
  document.documentElement.style.setProperty('--ui-scale', String(scale))
  document.documentElement.style.setProperty('--base-font-size', `${Math.max(10, Math.min(30, settingsStore.fontSize || 16))}px`)
  document.documentElement.style.setProperty('--animation-speed', settingsStore.fastAnimations ? '0.5' : '1')
  uiStore.setTheme(settingsStore.theme as any)
}

onMounted(() => {
  settingsStore.load()
  applyVisualSettings()
  characterStore.loadMetadataFromIndexedDB()

  window.addEventListener('settingsChanged', applyVisualSettings)
})
</script>
