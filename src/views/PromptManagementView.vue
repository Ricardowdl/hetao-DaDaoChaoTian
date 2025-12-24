<template>
  <div class="pm-route">
    <PromptManagementPanel />
  </div>
</template>

<script setup lang="ts">
import PromptManagementPanel from '../components/PromptManagementPanel.vue'
</script>

<style scoped>
.pm-route {
  min-height: var(--app-vh, 100vh);
  padding: 16px;
  background: rgba(15, 23, 42, 0.06);
}
</style>
