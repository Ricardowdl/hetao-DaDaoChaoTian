<template>
  <div class="save-root">
    <div class="content">
      <div class="card">
        <div class="actions" style="justify-content: flex-start; margin-top: 0">
          <button class="btn btn-ghost" type="button" title="刷新" @click="refresh">⟳ 刷新</button>
          <button class="btn" type="button" title="保存" :disabled="saving" @click="saveNow">💾 保存</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span class="marker">📍</span>
          <span class="card-title-text">当前进度 - {{ activeSaveName }}</span>
        </div>

        <div class="profile-row">
          <div class="avatar">{{ currentInitial }}</div>
          <div class="profile-text">
            <div class="profile-name">{{ playerName }}</div>
            <div class="profile-sub">{{ currentRealm }}·{{ currentLocation }}</div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat">
            <div class="k">创建时间</div>
            <div class="v">{{ characterCreatedAt }}</div>
          </div>
          <div class="stat">
            <div class="k">最后保存</div>
            <div class="v">{{ lastSavedAt }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="list-header">
          <div class="list-header-left">
            <span class="db">🗄</span>
            <span class="list-title">存档列表</span>
          </div>
          <div class="list-header-right">
            <button class="add-btn" type="button" title="新建存档" @click="addSave">＋</button>
            <span class="count">{{ saveCountLabel }}</span>
          </div>
        </div>

        <div v-if="saves.length === 0" class="empty">暂无存档</div>

        <div v-for="save in saves" :key="save.角色ID + '_' + save.存档槽位" class="save-item">
          <div class="save-top">
            <div class="save-left">
              <div class="avatar small">{{ currentInitial }}</div>
              <div class="save-meta">
                <div class="save-title">{{ save.存档名 }}</div>
                <div class="save-sub">{{ playerName }}</div>
                <div class="save-sub">{{ save.保存时间 ? relative(save.保存时间) : '未知' }}</div>
              </div>
            </div>

            <div class="save-actions">
              <button
                v-if="isRollbackSlot(save.存档槽位)"
                class="icon-btn danger"
                type="button"
                title="回滚"
                @click="rollback(save.角色ID, save.存档槽位)"
              >
                ⟲
              </button>
              <button v-else class="icon-btn primary" type="button" title="加载" @click="loadSave(save.角色ID, save.存档槽位)">▶</button>

              <button class="icon-btn primary" type="button" title="导出" @click="exportOne(save.角色ID, save.存档槽位)">⤓</button>

              <button
                v-if="!isRollbackSlot(save.存档槽位)"
                class="icon-btn success"
                type="button"
                title="复制"
                @click="duplicateOne(save.角色ID, save.存档槽位)"
              >
                ⎘
              </button>

              <button
                class="icon-btn danger"
                type="button"
                title="删除"
                :disabled="!canDelete(save.存档槽位)"
                @click="deleteOne(save.角色ID, save.存档槽位)"
              >
                🗑
              </button>
            </div>
          </div>

          <div class="save-details">
            <div>
              <div class="k">境界:</div>
              <div class="k">位置:</div>
              <div class="k">修改:</div>
            </div>
            <div class="right">
              <div class="v">{{ save.境界 || '未知' }}</div>
              <div class="v">{{ save.位置 || '未知' }}</div>
              <div class="v">{{ save.保存时间 ? relative(save.保存时间) : '未知' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span class="db">⚙</span>
          <span class="list-title">自动存档设置</span>
        </div>

        <div class="setting-row">
          <div class="setting-left">
            <div class="setting-name">对话前自动备份</div>
            <div class="setting-hint">每次对话前自动备份，用于回退到上次对话前的状态</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="enablePreDialogBackup" />
            <span class="slider" />
          </label>
        </div>

        <div class="setting-row">
          <div class="setting-left">
            <div class="setting-name">时间点存档</div>
            <div class="setting-hint">按设定时间间隔自动覆盖保存，防止长时间游玩数据丢失</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="enableAutoSave" />
            <span class="slider" />
          </label>
        </div>

        <div class="setting-row">
          <div class="setting-left">
            <div class="setting-name">自动保存间隔（分钟）</div>
            <div class="setting-hint">范围 1-120</div>
          </div>
          <input class="interval" type="number" min="1" max="120" v-model.number="autoSaveIntervalMinutes" />
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span class="db">🛠</span>
          <span class="list-title">存档操作</span>
        </div>

        <div class="operation-item" @click="exportCharacter">
          <div class="op-left">
            <span class="op-icon" aria-hidden="true">
              <svg class="op-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M8 9l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span class="op-desc">导出当前角色及其所有存档</span>
          </div>
          <div class="op-action">导出角色</div>
        </div>
        <div class="operation-item" @click="exportAll">
          <div class="op-left">
            <span class="op-icon" aria-hidden="true">
              <svg class="op-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M8 9l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span class="op-desc">备份所有存档到文件</span>
          </div>
          <div class="op-action">导出所有存档</div>
        </div>
        <div class="operation-item" @click="triggerImport">
          <div class="op-left">
            <span class="op-icon" aria-hidden="true">
              <svg class="op-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21V11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M16 15l-4-4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span class="op-desc">从文件恢复存档</span>
          </div>
          <div class="op-action">导入存档</div>
        </div>
        <div class="operation-item danger" @click="clearAll">
          <div class="op-left">
            <span class="op-icon" aria-hidden="true">
              <svg class="op-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M10 11v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M14 11v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M6 7l1 14h10l1-14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 7V4h6v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="op-desc">删除所有存档数据</span>
          </div>
          <div class="op-action danger">清空存档</div>
        </div>

        <input ref="fileInput" class="file" type="file" accept="application/json" @change="onFileSelected" />
      </div>

      <div v-if="tip" class="hint">{{ tip }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { downloadTextFile } from '../utils/download'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useSettingsStore } from '../stores/useSettingsStore'

const characterStore = useCharacterStore()
const gameState = useGameStateStore()
const settingsStore = useSettingsStore()

const saving = ref(false)
const tip = ref('')

onMounted(async () => {
  settingsStore.load()
  if (!characterStore.currentCharacter) {
    await characterStore.loadMetadataFromIndexedDB()
  }
})

const playerName = computed(() => gameState.角色基础信息.名字)
const currentRealm = computed(() => gameState.玩家角色状态.境界.名称)
const currentLocation = computed(() => gameState.玩家角色状态.位置.描述)
const currentInitial = computed(() => characterStore.currentInitial)

const activeSaveName = computed(() => characterStore.currentSaveMeta?.存档名 || '存档1')
const lastSavedAt = computed(() => (characterStore.currentSaveMeta?.保存时间 ? relative(characterStore.currentSaveMeta.保存时间) : '未知'))

const characterCreatedAt = computed(() => {
  const char = characterStore.currentCharacter
  return char?.创建时间 ? relative(char.创建时间) : '未知'
})

const saveCountLabel = computed(() => characterStore.getSaveCountLabel())

type SaveRow = {
  存档名: string
  角色ID: string
  存档槽位: string
  保存时间: string | null
  境界: string
  位置: string
  游戏内时间?: string
  版本?: string
}

function listSavesIncludeSpecial(): SaveRow[] {
  const char = characterStore.currentCharacter as any
  if (!char) return []

  if (char.模式 === '联机') {
    return char.存档 ? [char.存档] : []
  }

  const list = Object.entries(char.存档列表 || {})
    .filter(([, meta]) => Boolean(meta))
    .map(([, meta]) => meta as SaveRow)

  list.sort((a, b) => (String(b.保存时间 || '')).localeCompare(String(a.保存时间 || '')))
  return list
}

const saves = computed(() => listSavesIncludeSpecial())

const enablePreDialogBackup = computed({
  get: () => settingsStore.enablePreDialogBackup,
  set: (v: boolean) => settingsStore.update('enablePreDialogBackup', v)
})

const enableAutoSave = computed({
  get: () => settingsStore.enableAutoSave,
  set: (v: boolean) => settingsStore.update('enableAutoSave', v)
})

const autoSaveIntervalMinutes = computed({
  get: () => settingsStore.autoSaveIntervalMinutes,
  set: (v: number) => settingsStore.update('autoSaveIntervalMinutes', Number(v))
})

async function refresh() {
  tip.value = ''
  await characterStore.loadMetadataFromIndexedDB()
  tip.value = '已刷新'
}

async function saveNow() {
  tip.value = ''
  try {
    saving.value = true
    await characterStore.saveCurrentGame()
    tip.value = '保存完成'
  } catch (e) {
    tip.value = e instanceof Error ? `保存失败：${e.message}` : '保存失败'
  } finally {
    saving.value = false
  }
}

async function addSave() {
  tip.value = ''
  try {
    const cid = characterStore.requireCurrentCharacterId()
    const slot = characterStore.getNextSaveSlot(cid)
    await characterStore.saveCurrentGame(cid, slot)
    tip.value = `已新建存档：${slot}`
  } catch (e) {
    tip.value = e instanceof Error ? `新建存档失败：${e.message}` : '新建存档失败'
  }
}

function isRollbackSlot(slotKey: string) {
  return slotKey === '上次对话'
}

function canDelete(slotKey: string) {
  return slotKey !== '上次对话' && slotKey !== '时间点存档'
}

async function loadSave(characterId: string, slotKey: string) {
  tip.value = ''
  try {
    await characterStore.loadSaveAndApply(characterId, slotKey)
    tip.value = `已加载：${slotKey}`
  } catch (e) {
    tip.value = e instanceof Error ? `加载失败：${e.message}` : '加载失败'
  }
}

async function rollback(characterId: string, slotKey: string) {
  if (!confirm('确定要回滚到上次对话前的状态吗？')) return
  await loadSave(characterId, slotKey)
}

async function exportOne(characterId: string, slotKey: string) {
  tip.value = ''
  try {
    const content = await characterStore.exportSave(characterId, slotKey)
    const filename = `${characterId}_${slotKey}.json`
    downloadTextFile(filename, content)
    tip.value = '已导出'
  } catch (e) {
    tip.value = e instanceof Error ? `导出失败：${e.message}` : '导出失败'
  }
}

async function duplicateOne(characterId: string, slotKey: string) {
  tip.value = ''
  try {
    const newSlot = await characterStore.duplicateSave(characterId, slotKey)
    tip.value = `已复制为：${newSlot}`
  } catch (e) {
    tip.value = e instanceof Error ? `复制失败：${e.message}` : '复制失败'
  }
}

async function deleteOne(characterId: string, slotKey: string) {
  if (!canDelete(slotKey)) {
    tip.value = '该存档不可删除'
    return
  }
  if (!confirm(`确定要删除存档「${slotKey}」吗？`)) return
  tip.value = ''
  try {
    await characterStore.deleteSave(characterId, slotKey)
    tip.value = '已删除'
  } catch (e) {
    tip.value = e instanceof Error ? `删除失败：${e.message}` : '删除失败'
  }
}

async function exportCharacter() {
  tip.value = ''
  try {
    const content = await characterStore.exportCurrentCharacterBundle()
    downloadTextFile(`character_bundle_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, content)
    tip.value = '已导出角色'
  } catch (e) {
    tip.value = e instanceof Error ? `导出失败：${e.message}` : '导出失败'
  }
}

async function exportAll() {
  tip.value = ''
  try {
    const content = await characterStore.exportAllBundle()
    downloadTextFile(`all_saves_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, content)
    tip.value = '已导出所有存档'
  } catch (e) {
    tip.value = e instanceof Error ? `导出失败：${e.message}` : '导出失败'
  }
}

const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  tip.value = '请选择要导入的JSON文件...'
  if (!fileInput.value) {
    tip.value = '导入失败：文件选择器不可用（file input未挂载）'
    return
  }
  if (!characterStore.currentCharacter) {
    tip.value = '导入失败：请先创建/选择一个角色（需要导入到当前角色）'
    return
  }
  try {
    fileInput.value.click()
  } catch (e) {
    console.error('[SaveGamePanel] triggerImport click failed:', e)
    tip.value = '导入失败：无法打开文件选择框（可能被浏览器拦截）'
  }
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    tip.value = '导入中...'
    const text = await file.text()
    let raw: any
    try {
      raw = JSON.parse(text) as any
    } catch (e) {
      console.error('[SaveGamePanel] import parse json failed:', e)
      tip.value = '导入失败：JSON解析失败'
      return
    }
    if (raw?.type === 'saves') {
      const characterId = characterStore.requireCurrentCharacterId()
      await characterStore.importSavesFileIntoCharacter(characterId, text)
      const first = Array.isArray(raw?.saves) ? raw.saves[0] : null
      const slotKey = String(first?.存档名 || first?.存档槽位 || first?.id || '存档1')
      tip.value = `导入成功，正在加载：${slotKey}...`
      await characterStore.loadSaveAndApply(characterId, slotKey)
      tip.value = `导入成功并已加载：${slotKey}`
    } else {
      await characterStore.importBundle(text)
      tip.value = '导入成功'
    }
  } catch (err) {
    console.error('[SaveGamePanel] import failed:', err)
    tip.value = err instanceof Error ? `导入失败：${err.message}` : '导入失败'
  }
}

async function clearAll() {
  if (!confirm('确定要删除所有存档数据吗？此操作不可恢复。')) return
  tip.value = ''
  try {
    await characterStore.clearAllSaveData()
    tip.value = '已清空'
  } catch (e) {
    tip.value = e instanceof Error ? `清空失败：${e.message}` : '清空失败'
  }
}

function relative(iso: string) {
  return characterStore.formatRelativeTime(iso)
}
</script>

<style scoped>
.save-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(226, 242, 255, 0.9);
  border-radius: 12px;
  padding: 12px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.card {
  border: 1px solid rgba(147, 197, 253, 0.55);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.92);
  margin-bottom: 10px;
}

.marker {
  font-size: 14px;
}

.card-title-text {
  color: rgba(37, 99, 235, 0.95);
}

.profile-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
}

.avatar.small {
  width: 40px;
  height: 40px;
}

.profile-name {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 600;
}

.profile-sub {
  color: rgba(71, 85, 105, 0.9);
  font-size: 13px;
}

.stats-row {
  display: flex;
  gap: 40px;
  margin-top: 12px;
}

.stat .k {
  color: rgba(71, 85, 105, 0.9);
  font-size: 12px;
}

.stat .v {
  color: rgba(37, 99, 235, 0.95);
  font-size: 13px;
  margin-top: 2px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.list-title {
  color: rgba(37, 99, 235, 0.95);
  font-weight: 700;
}

.list-header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(134, 239, 172, 0.9);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  color: rgba(22, 163, 74, 0.95);
  font-weight: 800;
}

.count {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(147, 197, 253, 0.7);
  color: rgba(37, 99, 235, 0.95);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
}

.empty {
  color: rgba(71, 85, 105, 0.9);
  padding: 10px 0;
}

.save-item {
  border: 1px solid rgba(147, 197, 253, 0.35);
  background: rgba(248, 251, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.save-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.save-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.save-title {
  color: rgba(37, 99, 235, 0.95);
  font-weight: 700;
}

.save-sub {
  color: rgba(71, 85, 105, 0.9);
  font-size: 12px;
  margin-top: 2px;
}

.save-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(147, 197, 253, 0.55);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(37, 99, 235, 0.95);
  cursor: pointer;
}

.icon-btn.primary {
  border-color: rgba(147, 197, 253, 0.85);
  color: rgba(37, 99, 235, 0.95);
}

.icon-btn.success {
  border-color: rgba(134, 239, 172, 0.95);
  color: rgba(22, 163, 74, 0.95);
}

.icon-btn.danger {
  border-color: rgba(253, 164, 175, 0.9);
  color: rgba(225, 29, 72, 0.95);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-details {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
  color: rgba(71, 85, 105, 0.9);
}

.save-details .right {
  text-align: right;
}

.save-details .v {
  color: rgba(37, 99, 235, 0.95);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.setting-row:last-child {
  border-bottom: 0;
}

.setting-name {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 600;
}

.setting-hint {
  color: rgba(71, 85, 105, 0.9);
  font-size: 12px;
  margin-top: 2px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(148, 163, 184, 0.55);
  transition: 0.2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.2s;
  border-radius: 999px;
}

input:checked + .slider {
  background-color: rgba(37, 99, 235, 0.95);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.interval {
  width: 90px;
  border: 1px solid rgba(147, 197, 253, 0.55);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(15, 23, 42, 0.92);
  border-radius: 10px;
  padding: 6px 10px;
}

.operation-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  cursor: pointer;
}

.operation-item:last-child {
  border-bottom: 0;
}

.op-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.op-icon {
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(59, 130, 246, 0.92);
}

.operation-item.danger .op-icon {
  color: rgba(239, 68, 68, 0.90);
}

.op-svg {
  width: 18px;
  height: 18px;
}

.op-desc {
  color: rgba(100, 116, 139, 0.95);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-action {
  margin-left: auto;
  text-align: right;
  color: rgba(37, 99, 235, 0.95);
  font-weight: 700;
  font-size: 14px;
}

.op-action.danger {
  color: rgba(239, 68, 68, 0.95);
}

.operation-item.danger {
  border-bottom: 0;
}

.file {
  display: none;
}

.hint {
  margin-top: 10px;
  color: rgba(71, 85, 105, 0.9);
}
</style>
