<template>
  <div class="save-screen">
    <header class="save-topbar">
      <div class="top-left">
        <button class="back-btn" type="button" @click="goBack">← 返回道途</button>
      </div>
      <div class="top-center">
        <div class="main-title">续前世因缘</div>
        <div class="sub-title">择一法身，入道重修</div>
      </div>
      <div class="top-right">
        <div class="top-icons">
          <button class="icon-btn" type="button" title="全屏" @click="toggleFullscreen">⛶</button>
          <button class="icon-btn" type="button" title="帮助" @click="showHelp">?</button>
        </div>
      </div>
    </header>

    <div class="save-body">
      <aside class="role-sidebar">
        <div class="sidebar-head">
          <div class="sidebar-title">
            <span>角色列表</span>
            <span class="sidebar-count">{{ characterIds.length }}个角色</span>
          </div>
          <button class="mini-btn" type="button" @click="importCharacter">导入</button>
        </div>

        <div v-if="characterIds.length === 0" class="empty">
          <div>暂无角色</div>
          <button class="mini-btn" type="button" @click="goCreation">创建新角色</button>
        </div>

        <div class="role-list">
          <div
            v-for="cid in characterIds"
            :key="cid"
            class="role-card"
            :class="{ active: cid === activeCharacterId }"
            role="button"
            tabindex="0"
            @click="selectCharacter(cid)"
          >
            <div class="role-card-head">
              <div class="avatar">{{ getInitial(characters[cid]?.角色名 || '') }}</div>
              <div class="meta">
                <div class="name">{{ characters[cid]?.角色名 || '未命名' }}</div>
                <div class="desc">
                  <span>{{ characters[cid]?.模式 || '单机' }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatTime(characters[cid]?.创建时间) }}</span>
                </div>
              </div>
              <div class="save-count">{{ getRoleSaveCount(cid) }}</div>
            </div>

            <div class="role-card-actions">
              <button class="role-btn" type="button" @click.stop="openDetails(cid)">详情</button>
              <button class="role-btn success" type="button" @click.stop="exportCharacter(cid)">导出</button>
              <button class="role-btn danger" type="button" @click.stop="deleteCharacterFlow(cid)">删除</button>
            </div>
          </div>
        </div>
      </aside>

      <main class="save-main">
        <div class="main-head">
          <div class="main-head-left">
            <div class="main-panel-title">存档管理</div>
            <div class="main-panel-sub">解锁：{{ characterStore.getSaveCountLabel() }}</div>
          </div>
          <div class="main-head-right">
            <button
              class="mini-btn"
              type="button"
              :disabled="!activeCharacterId || characters[activeCharacterId]?.模式 !== '单机'"
              @click="importSaves"
            >
              导入存档
            </button>
          </div>
        </div>

        <div v-if="saves.length === 0" class="empty">暂无存档</div>

        <div class="save-grid">
          <div v-for="s in saves" :key="s.角色ID + '_' + s.存档槽位" class="save-card">
            <div class="save-card-left">
              <div class="save-title">{{ s.存档名 }}</div>
              <div class="save-sub">{{ s.境界 }} · {{ s.位置 }}</div>
              <div class="save-sub">{{ relative(s.保存时间) }} · {{ s.游戏内时间 }}</div>
            </div>
            <div class="save-card-right">
              <div class="save-card-actions">
                <button class="mini-btn primary" type="button" @click="play(s.角色ID, s.存档槽位)">开始</button>
                <button class="mini-btn" type="button" title="导出此存档" @click="exportSave(s.角色ID, s.存档槽位)">导</button>
                <button class="mini-btn" type="button" title="重命名" :disabled="!canRename(s.存档槽位)" @click="renameSaveFlow(s.角色ID, s.存档槽位)">编</button>
                <button
                  class="mini-btn danger"
                  type="button"
                  title="删除存档"
                  :disabled="!canDelete(s.角色ID, s.存档槽位)"
                  @click="deleteSaveFlow(s.角色ID, s.存档槽位)"
                >
                  删
                </button>
              </div>
            </div>
          </div>

          <div v-if="saves.length < 2" class="save-card placeholder" aria-hidden="true">
            <div class="placeholder-inner">
              <div class="folder">📁</div>
              <div class="placeholder-title">空存档槽</div>
              <div class="placeholder-sub">通过游戏内保存功能创建</div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <input ref="fileInput" type="file" accept=".json" style="display: none" @change="onFileChange" />

    <CharacterDetailsModal v-model="showDetail" />

    <div v-if="dialog.show" class="dialog-overlay" @click.self="onDialogCancel">
      <div class="dialog-box" @click.stop>
        <h3 class="dialog-title">{{ dialog.title }}</h3>
        <p class="dialog-message">{{ dialog.message }}</p>
        <input
          v-if="dialog.type === 'prompt'"
          ref="promptInput"
          v-model="dialog.inputValue"
          class="dialog-input"
          :placeholder="dialog.placeholder"
          @keydown.enter.prevent="onDialogConfirm"
        />
        <div class="dialog-actions">
          <button v-if="dialog.type !== 'alert'" class="btn-dialog-cancel" type="button" @click="onDialogCancel">取消</button>
          <button class="btn-dialog-confirm" type="button" @click="onDialogConfirm">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import CharacterDetailsModal from '../components/CharacterDetailsModal.vue'
import { qiankunbaoku } from '../services/qiankunbaoku'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useUIStore } from '../stores/useUIStore'

const router = useRouter()
const characterStore = useCharacterStore()
const uiStore = useUIStore()
const gameState = useGameStateStore()

const showDetail = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const importMode = ref<'character' | 'saves'>('character')

type DialogType = 'alert' | 'confirm' | 'prompt'
const dialog = reactive({
  show: false,
  type: 'alert' as DialogType,
  title: '',
  message: '',
  inputValue: '',
  placeholder: ''
})
const promptInput = ref<HTMLInputElement | null>(null)
let dialogResolve: ((v: boolean | string | null) => void) | null = null

async function showDialog(payload: {
  type: DialogType
  title: string
  message: string
  placeholder?: string
  initialValue?: string
}): Promise<boolean | string | null> {
  dialog.type = payload.type
  dialog.title = payload.title
  dialog.message = payload.message
  dialog.placeholder = payload.placeholder || ''
  dialog.inputValue = payload.initialValue || ''
  dialog.show = true

  await nextTick()
  if (dialog.type === 'prompt') promptInput.value?.focus()

  return await new Promise((resolve) => {
    dialogResolve = resolve
  })
}

async function showAlert(title: string, message: string) {
  await showDialog({ type: 'alert', title, message })
}

async function showConfirm(title: string, message: string) {
  const r = await showDialog({ type: 'confirm', title, message })
  return r === true
}

async function showPrompt(title: string, message: string, initialValue = '', placeholder = '') {
  const r = await showDialog({ type: 'prompt', title, message, initialValue, placeholder })
  if (typeof r !== 'string') return null
  const v = r.trim()
  return v ? v : null
}

function closeDialog(result: boolean | string | null) {
  dialog.show = false
  const resolve = dialogResolve
  dialogResolve = null
  resolve?.(result)
}

function onDialogCancel() {
  if (dialog.type === 'confirm') closeDialog(false)
  else closeDialog(null)
}

function onDialogConfirm() {
  if (dialog.type === 'confirm') closeDialog(true)
  else if (dialog.type === 'prompt') closeDialog(dialog.inputValue)
  else closeDialog(true)
}

onMounted(async () => {
  if (!characterStore.currentCharacter) {
    await characterStore.loadMetadataFromIndexedDB()
  }
})

function getRoleSaveCount(characterId: string) {
  const char = characterStore.角色列表[characterId]
  if (!char) return 0
  if (char.模式 === '联机') return char.存档 ? 1 : 0
  return Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话' && k !== '时间点存档').length
}

function canRename(slotKey: string) {
  return slotKey !== '上次对话' && slotKey !== '时间点存档'
}

function canDelete(characterId: string, slotKey: string) {
  if (!canRename(slotKey)) return false
  if (characterStore.当前激活存档?.角色ID === characterId && characterStore.当前激活存档?.存档槽位 === slotKey) return false
  const char = characterStore.角色列表[characterId]
  const count = Object.keys(char?.存档列表 || {}).filter((k) => k !== '上次对话' && k !== '时间点存档').length
  return count > 1
}

async function openDetails(characterId: string) {
  try {
    const char = characterStore.角色列表[characterId]
    if (!char) return
    const slot =
      char.模式 === '单机'
        ? Object.keys(char.存档列表 || {}).find((k) => k !== '上次对话') || '存档1'
        : char.存档?.存档槽位 || '存档'

    const data = await qiankunbaoku.loadSaveData(characterId, slot)
    if (!data) {
      await showAlert('无法加载存档数据', '存档数据不存在或已损坏。')
      return
    }
    gameState.fromSaveData(data)
    showDetail.value = true
  } catch (e) {
    await showAlert('打开详情失败', e instanceof Error ? e.message : '未知错误')
  }
}

function fillAction(text: string) {
  uiStore.setPendingAction(text)
}

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

async function exportCharacter(characterId: string) {
  try {
    const text = await characterStore.exportCharacterFile(characterId)
    const name = String((characterStore.角色列表[characterId] as any)?.角色名 || '未命名角色')
    const date = new Date().toISOString().split('T')[0]
    downloadJson(`大道朝天-角色-${name}-${date}.json`, text)
  } catch (e) {
    await showAlert('导出失败', e instanceof Error ? e.message : '未知错误')
  }
}

async function exportSave(characterId: string, slotKey: string) {
  try {
    const text = await characterStore.exportSaveFile(characterId, slotKey)
    const date = new Date().toISOString().split('T')[0]
    downloadJson(`大道朝天-${slotKey}-${date}.json`, text)
  } catch (e) {
    await showAlert('导出失败', e instanceof Error ? e.message : '未知错误')
  }
}

async function renameSaveFlow(characterId: string, slotKey: string) {
  try {
    const next = await showPrompt('重命名存档', '请输入新的存档名称：', slotKey)
    if (!next) return
    await characterStore.renameSave(characterId, slotKey, next)
  } catch (e) {
    await showAlert('重命名失败', e instanceof Error ? e.message : '未知错误')
  }
}

async function importCharacter() {
  importMode.value = 'character'
  fileInput.value?.click()
}

async function importSaves() {
  importMode.value = 'saves'
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    if (importMode.value === 'character') {
      await characterStore.importCharacterFile(text)
    } else {
      if (!activeCharacterId.value) throw new Error('未选择角色')
      if (characters.value?.[activeCharacterId.value]?.模式 !== '单机') throw new Error('无法导入：角色不存在或非单机模式')
      await characterStore.importSavesFileIntoCharacter(activeCharacterId.value, text)
    }
    await showAlert('导入成功', '数据已写入本地存档。')
  } catch (err) {
    await showAlert('导入失败', err instanceof Error ? err.message : '未知错误')
  } finally {
    input.value = ''
  }
}

async function toggleFullscreen() {
  await uiStore.toggleFullscreen()
}

function showHelp() {
  showAlert('帮助', '暂无帮助内容')
}

const characters = computed(() => characterStore.角色列表)
const characterIds = computed(() => Object.keys(characterStore.角色列表 || {}))
const activeCharacterId = computed(() => characterStore.当前角色ID)

const saves = computed(() => characterStore.listSavesForCurrentCharacter())

function getInitial(name: string) {
  return (name || '').trim().slice(0, 1) || '？'
}

function formatTime(iso?: string) {
  if (!iso) return '未知'
  try {
    return characterStore.formatRelativeTime(iso)
  } catch {
    return iso
  }
}

async function deleteCharacterFlow(characterId: string) {
  const char = characterStore.角色列表[characterId]
  const name = String(char?.角色名 || '未命名')
  const ok = await showConfirm('删除角色', `确定要彻底删除角色"${name}"及其所有修行记录吗？此操作不可恢复。`)
  if (!ok) return

  try {
    await characterStore.deleteCharacter(characterId)
    await showAlert('角色已删除', '已清理该角色相关数据。')
  } catch (e) {
    await showAlert('删除失败', e instanceof Error ? e.message : '未知错误')
  }
}

function relative(iso: string) {
  return characterStore.formatRelativeTime(iso)
}

function selectCharacter(characterId: string) {
  const char = characterStore.角色列表[characterId]
  if (!char) return

  const slots = Object.keys(char.存档列表 || {}).filter((k) => k !== '上次对话' && k !== '时间点存档')
  const slot = slots[0] || '存档1'
  characterStore.setActive(characterId, slot)
}

async function play(characterId: string, slotKey: string) {
  try {
    await characterStore.loadSaveAndApply(characterId, slotKey)
    router.push({ name: 'GameView' })
  } catch (e) {
    await showAlert('加载失败', e instanceof Error ? e.message : '未知错误')
  }
}

async function deleteSaveFlow(characterId: string, slotKey: string) {
  const char = characterStore.角色列表[characterId]
  const name = String(char?.角色名 || '未命名')
  const slotLabel = slotKey === '上次对话' ? '上次对话存档' : slotKey
  const ok = await showConfirm('删除存档', `确定要删除角色"${name}"的"${slotLabel}"吗？此操作不可恢复。`)
  if (!ok) return

  try {
    await characterStore.deleteSave(characterId, slotKey)
    await showAlert('存档已删除', '该存档记录已移除。')
  } catch (e) {
    await showAlert('删除失败', e instanceof Error ? e.message : '未知错误')
  }
}

async function goBack() {
  try {
    await characterStore.saveCurrentGame()
  } catch {
    void 0
  }
  router.push({ name: 'ModeSelection' })
}

function goCreation() {
  router.push({ name: 'CharacterCreation' })
}

function goLegacySave() {
  router.push({ name: 'LegacySaveView' })
}
</script>

<style scoped>
.save-screen {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-1), var(--bg-2));
}

.save-topbar {
  height: 64px;
  display: grid;
  grid-template-columns: 260px 1fr 260px;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-2);
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(12px);
}

.top-icons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-1);
  background: rgba(15, 23, 42, 0.32);
  color: var(--text-2);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.icon-btn:hover {
  background: rgba(30, 41, 59, 0.46);
  transform: translateY(-1px);
}

.top-left,
.top-right {
  display: flex;
  align-items: center;
}

.top-right {
  justify-content: flex-end;
}

.top-center {
  text-align: center;
  line-height: 1.2;
}

.main-title {
  font-size: 22px;
  letter-spacing: 6px;
  color: rgba(226, 232, 240, 0.96);
}

.sub-title {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
}

.back-btn {
  appearance: none;
  border: 1px solid var(--border-1);
  background: rgba(15, 23, 42, 0.32);
  color: var(--text-2);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.back-btn:hover {
  background: rgba(30, 41, 59, 0.46);
  transform: translateY(-1px);
}

.saved-badge {
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.1);
  color: rgba(187, 247, 208, 0.95);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
}

.save-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: calc(100vh - 64px);
}

.role-sidebar {
  border-right: 1px solid var(--border-2);
  background: rgba(15, 23, 42, 0.16);
  padding: 14px 12px;
  overflow: auto;
}

.sidebar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.sidebar-title {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: rgba(226, 232, 240, 0.92);
  font-size: 13px;
}

.sidebar-count {
  color: rgba(148, 163, 184, 0.9);
  font-size: 12px;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card {
  border-radius: 12px;
  border: 1px solid var(--border-1);
  background: rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(14px);
  color: var(--text-2);
  padding: 10px;
  cursor: pointer;
  display: grid;
  gap: 10px;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.role-card-head {
  display: grid;
  grid-template-columns: 46px 1fr 54px;
  gap: 12px;
  align-items: center;
}

.save-count {
  justify-self: end;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.35);
  color: rgba(226, 232, 240, 0.9);
  font-size: 12px;
}

.role-card-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.role-btn {
  appearance: none;
  border-radius: 10px;
  border: 1px solid var(--border-1);
  background: rgba(15, 23, 42, 0.3);
  color: var(--text-2);
  padding: 8px 0;
  cursor: pointer;
  font-size: 12px;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.role-btn:hover {
  background: rgba(30, 41, 59, 0.45);
  transform: translateY(-1px);
}

.role-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.role-btn.success {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
}

.role-btn.danger {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.12);
  color: rgba(254, 202, 202, 0.95);
}

.role-card:hover {
  background: rgba(30, 41, 59, 0.32);
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
}

.role-card.active {
  border-color: rgba(34, 197, 94, 0.35);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15) inset;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.85));
  color: rgba(15, 23, 42, 0.95);
  font-weight: 800;
}

.meta {
  display: grid;
  gap: 6px;
}

.name {
  font-size: 14px;
}

.desc {
  color: rgba(148, 163, 184, 0.9);
  font-size: 12px;
}

.desc .dot {
  margin: 0 6px;
}

.save-main {
  padding: 14px 18px;
  overflow: auto;
}

.main-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.main-head-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.main-panel-sub {
  color: rgba(148, 163, 184, 0.9);
  font-size: 12px;
}

.main-panel-title {
  color: rgba(226, 232, 240, 0.92);
  font-size: 13px;
}

.mini-btn {
  appearance: none;
  border-radius: 10px;
  border: 1px solid var(--border-1);
  background: rgba(15, 23, 42, 0.3);
  color: var(--text-2);
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.mini-btn:hover {
  background: rgba(30, 41, 59, 0.45);
  transform: translateY(-1px);
}

.mini-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.mini-btn.primary {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.12);
}

.mini-btn.danger {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.12);
  color: rgba(254, 202, 202, 0.95);
}

.save-card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.save-card.placeholder {
  border-style: dashed;
  opacity: 0.75;
  justify-content: center;
}

.placeholder-inner {
  width: 100%;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 18px 12px;
}

.folder {
  font-size: 20px;
  opacity: 0.9;
}

.placeholder-title {
  color: rgba(226, 232, 240, 0.95);
  font-size: 13px;
}

.placeholder-sub {
  color: rgba(148, 163, 184, 0.9);
  font-size: 12px;
}

.save-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 420px));
  gap: 14px;
  align-content: start;
}

.save-card {
  border-radius: 12px;
  border: 1px solid var(--border-1);
  background: rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(14px);
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.save-card:hover {
  background: rgba(30, 41, 59, 0.32);
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
}

.save-card-left {
  min-width: 0;
}

.save-card-right {
  display: flex;
  align-items: flex-start;
}

.save-title {
  color: var(--text-2);
  font-size: 13px;
}

.save-sub {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.empty {
  color: var(--text-muted);
  font-size: 13px;
  padding: 12px 0;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 20, 30, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog-box {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 22px;
  width: min(460px, calc(100vw - 32px));
  box-shadow: var(--shadow-1);
  color: var(--text-2);
}

.dialog-title {
  font-size: 16px;
  color: var(--accent-solid);
  margin: 0 0 10px 0;
  font-weight: 800;
}

.dialog-message {
  font-size: 13px;
  color: var(--text-3);
  margin: 0 0 14px 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.dialog-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.32);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  color: var(--text-2);
  outline: none;
  font-size: 13px;
}

.dialog-input:focus {
  border-color: rgba(124, 58, 237, 0.5);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.18);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn-dialog-cancel,
.btn-dialog-confirm {
  appearance: none;
  border: 1px solid var(--border-1);
  border-radius: 10px;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-2);
  background: rgba(15, 23, 42, 0.3);
}

.btn-dialog-cancel:hover,
.btn-dialog-confirm:hover {
  background: rgba(30, 41, 59, 0.45);
}

.btn-dialog-confirm {
  border-color: rgba(124, 58, 237, 0.35);
  background: rgba(124, 58, 237, 0.14);
}

@media (max-width: 960px) {
  .save-body {
    grid-template-columns: 1fr;
  }
  .role-sidebar {
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  }
  .save-topbar {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .top-center {
    display: none;
  }
}
</style>
