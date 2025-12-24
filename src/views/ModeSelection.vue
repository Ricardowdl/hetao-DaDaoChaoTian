<template>
  <div class="mode-selection-container">
    <div class="bg-layer" />

    <div class="selection-stage">
      <div class="selection-content">
        <div class="header-container">
          <div class="title-row">
            <h1 class="main-title">纵 横 诸 天</h1>
            <span class="version-tag">V0.2 内测</span>
          </div>
          <div class="sub-title">朝游北海暮苍梧，醉卧云霞食朝露</div>
        </div>

        <div class="gate-container">
          <div class="gate-card primary-card">
            <div class="gate-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 21a8 8 0 0 0-16 0"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
                <path
                  d="M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
              </svg>
            </div>
            <div class="gate-title">单机闭关</div>
            <div class="gate-sub">避世清修·心无旁骛</div>
            <div class="gate-desc">
              独居洞府，专心致志炼就大道根基<br />
              所有进度本地存储，断网亦可修行
            </div>
            <div class="feature-list" aria-label="单机闭关特性">
              <div class="feature-item">本地存档</div>
              <div class="feature-item">离线可玩</div>
              <div class="feature-item">快速继续</div>
              <div class="feature-item">隐私清净</div>
            </div>
          </div>
        </div>

        <div class="notice-box">
          存档说明：角色与进度保存在本地浏览器/本机存储中<br />
          如需清档可在设置中重置；建议定期导出备份以防意外
        </div>

        <div class="footer-actions">
          <button class="action-btn primary" type="button" @click="startNewGame">初入仙途</button>
          <button class="action-btn subtle" type="button" @click="loadExistingCharacters">续前世因缘</button>
        </div>
      </div>
    </div>

    <div class="top-right">
      <button class="icon-tile" type="button" title="全屏" @click="uiStore.toggleFullscreen()">⛶</button>
      <button class="icon-tile" type="button" title="帮助" @click="showHelp">？</button>
    </div>

    <div v-if="AUTH_CONFIG.ENABLE_AUTH" class="bottom-left">
      <div class="auth-badge" :class="authStore.isVerified ? 'ok' : 'warn'" role="button" tabindex="0" @click="handleAuthBadge">
        <span class="dot" />
        <span>{{ authStore.isVerified ? '已授权' : '未授权' }}</span>
      </div>
    </div>

    <div class="bottom-right">
      <button class="icon-tile" type="button" title="设置" @click="showSettings = true">⚙️</button>
    </div>

    <AuthModal v-if="AUTH_CONFIG.ENABLE_AUTH" v-model="showAuthModal" @verified="authStore.loadFromStorage()" />
    <SettingsModal v-model="showSettings" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthModal from '../components/AuthModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
import { AUTH_CONFIG } from '../config/auth'
import { useAuthStore } from '../stores/useAuthStore'
import { useUIStore } from '../stores/useUIStore'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const showSettings = ref(false)
const showAuthModal = ref(false)

onMounted(async () => {
  uiStore.applyTheme()
  authStore.loadFromStorage()
  await authStore.ensureMachineCode()
})

function startNewGame() {
  if (AUTH_CONFIG.ENABLE_AUTH && !authStore.isVerified) {
    showAuthModal.value = true
    alert('请先完成授权验证')
    return
  }

  router.push({ name: 'CharacterCreation' })
}

function loadExistingCharacters() {
  if (AUTH_CONFIG.ENABLE_AUTH && !authStore.isVerified) {
    showAuthModal.value = true
    alert('请先完成授权验证')
    return
  }

  router.push({ name: 'CharacterManagement' })
}

function showHelp() {
  alert('纵横诸天 v0.2 内测\n\n- 单机闭关：本地存档，离线可玩\n- 初入仙途：创建新角色\n- 续前世因缘：管理/继续已有存档')
}

function handleAuthBadge() {
  if (!AUTH_CONFIG.ENABLE_AUTH) return
  if (authStore.isVerified) return
  showAuthModal.value = true
}
</script>

<style scoped>
.mode-selection-container {
  width: 100%;
  height: var(--app-vh, 100vh);
  position: relative;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background: radial-gradient(900px 520px at 50% 0%, rgba(59, 130, 246, 0.22), transparent 62%),
    radial-gradient(900px 620px at 15% 70%, rgba(2, 132, 199, 0.16), transparent 60%),
    radial-gradient(900px 620px at 85% 70%, rgba(99, 102, 241, 0.12), transparent 60%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.35), rgba(2, 6, 23, 0.92));
  filter: saturate(1.05) brightness(0.88);
}

.selection-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(18px + var(--safe-top, 0px)) 18px calc(18px + var(--safe-bottom, 0px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.selection-content {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.62));
  backdrop-filter: blur(26px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 3.3rem 3.6rem;
  width: min(980px, 100%);
  display: grid;
  gap: 2rem;
  box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.6);
  animation: fadeIn 280ms ease-out;
  position: relative;
  overflow: hidden;
}

.selection-content::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(900px 300px at 50% 0%, rgba(255, 255, 255, 0.14), transparent 60%),
    radial-gradient(680px 260px at 18% 40%, rgba(56, 189, 248, 0.08), transparent 55%),
    radial-gradient(680px 260px at 82% 40%, rgba(99, 102, 241, 0.06), transparent 55%);
}

.selection-content::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.04);
  border-radius: 20px;
}

.header-container {
  text-align: center;
  display: grid;
  gap: 10px;
}

.title-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.main-title {
  font-family: var(--font-family-serif);
  font-size: 3rem;
  font-weight: 350;
  letter-spacing: 0.52em;
  color: rgba(248, 250, 252, 0.98);
  text-shadow: 0 0 40px rgba(147, 197, 253, 0.22);
  margin: 0;
}

.version-tag {
  font-size: 0.75rem;
  color: rgba(250, 204, 21, 0.92);
  background: rgba(2, 6, 23, 0.25);
  border: 1px solid rgba(250, 204, 21, 0.28);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
}

.sub-title {
  font-size: 1.05rem;
  color: rgba(248, 250, 252, 0.92);
  letter-spacing: 0.2em;
  font-weight: 400;
  text-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.gate-container {
  display: flex;
  gap: 18px;
  justify-content: center;
}

.gate-card {
  flex: 1;
  max-width: 520px;
  padding: 2.2rem 1.9rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.35));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  cursor: default;
  transition: all 0.3s ease;
  text-align: center;
  display: grid;
  gap: 10px;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.gate-card.primary-card {
  border-color: rgba(56, 189, 248, 0.26);
  box-shadow: 0 22px 56px -26px rgba(56, 189, 248, 0.18);
}

.gate-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(360px 140px at 50% 0%, rgba(255, 255, 255, 0.12), transparent 60%);
  opacity: 0.8;
}

.gate-card:hover {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.46));
  border-color: rgba(148, 163, 184, 0.22);
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
}

.gate-icon {
  color: rgba(226, 232, 240, 0.92);
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin: 0 auto;
}

.gate-icon svg {
  width: 42px;
  height: 42px;
}

.gate-title {
  color: var(--text-1);
  font-size: 1.25rem;
}

.gate-sub {
  color: rgba(226, 232, 240, 0.92);
  font-weight: 600;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.gate-desc {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.92rem;
  line-height: 1.6;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding-top: 6px;
}

.feature-item {
  font-size: 0.86rem;
  color: rgba(226, 232, 240, 0.9);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(2, 6, 23, 0.18);
}

.badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 12px;
  color: rgba(248, 113, 113, 0.92);
  background: rgba(127, 29, 29, 0.28);
  border: 1px solid rgba(248, 113, 113, 0.22);
  border-radius: 8px;
  padding: 4px 10px;
}

.notice-box {
  background: rgba(15, 23, 42, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  color: rgba(248, 250, 252, 0.92);
  font-size: 0.92rem;
  line-height: 1.6;
  max-width: 520px;
  justify-self: center;
}

.footer-actions {
  display: grid;
  justify-items: center;
  gap: 12px;
}

.action-btn {
  appearance: none;
  background: rgba(2, 6, 23, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(248, 250, 252, 0.96);
  font-weight: 700;
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-1);
}

.action-btn.primary {
  background: rgba(30, 58, 138, 0.34);
  border-color: rgba(56, 189, 248, 0.4);
  color: var(--text-1);
}

.action-btn.primary:hover {
  background: rgba(30, 58, 138, 0.5);
}

.action-btn.subtle {
  background: rgba(2, 6, 23, 0.12);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(248, 250, 252, 0.9);
}

.action-btn.subtle:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-2);
}

.top-right {
  position: fixed;
  top: calc(14px + var(--safe-top, 0px));
  right: calc(14px + var(--safe-right, 0px));
  display: flex;
  gap: 10px;
  z-index: 10;
}

.bottom-left {
  position: fixed;
  left: calc(14px + var(--safe-left, 0px));
  bottom: calc(14px + var(--safe-bottom, 0px));
  z-index: 10;
}

.bottom-right {
  position: fixed;
  right: calc(14px + var(--safe-right, 0px));
  bottom: calc(14px + var(--safe-bottom, 0px));
  z-index: 10;
}

.icon-tile {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-1);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.icon-tile:hover {
  background: rgba(15, 23, 42, 0.85);
}

.auth-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-1);
  cursor: pointer;
  user-select: none;
}

.auth-badge.ok {
  border-color: rgba(52, 211, 153, 0.3);
}
.auth-badge.warn {
  border-color: rgba(251, 191, 36, 0.25);
}

.auth-badge.ok {
  border-color: rgba(52, 211, 153, 0.5);
  color: rgba(209, 250, 229, 0.95);
  background: rgba(52, 211, 153, 0.14);
}

.auth-badge.ok .dot {
  background: rgba(52, 211, 153, 0.9);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.9);
}

@media (max-width: 768px) {
  .selection-content {
    padding: 2.3rem 1.6rem;
    gap: 1.5rem;
  }

  .selection-stage {
    align-items: flex-start;
    justify-content: flex-start;
  }

  .gate-container {
    align-items: center;
  }

  .gate-card {
    width: 100%;
    max-width: 420px;
  }

  .main-title {
    font-size: 2.2rem;
    letter-spacing: 0.25em;
  }
}

@media (max-width: 480px) {
  .selection-stage {
    padding: calc(14px + var(--safe-top, 0px)) 12px calc(18px + var(--safe-bottom, 0px));
  }

  .selection-content {
    padding: 1.6rem 1.1rem;
    gap: 1.2rem;
  }

  .main-title {
    font-size: 1.65rem;
    letter-spacing: 0.18em;
  }

  .action-btn {
    width: 100%;
    min-width: 0;
    max-width: 420px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
