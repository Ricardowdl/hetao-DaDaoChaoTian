<template>
  <CharacterDetailDrawer :model-value="true" @update:model-value="goBack" @fill-action="fillAndBack" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import CharacterDetailDrawer from '../components/CharacterDetailDrawer.vue'
import { useUIStore } from '../stores/useUIStore'

const router = useRouter()
const uiStore = useUIStore()

function goBack() {
  router.push({ name: 'GameView' })
}

function fillAndBack(text: string) {
  uiStore.setPendingAction(text)
  router.push({ name: 'GameView' })
}
</script>
