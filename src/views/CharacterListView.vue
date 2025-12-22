<template>
  <div class="save-root">
    <div class="header">
      <div class="header-left">保存游戏</div>
      <div class="header-center">💾 保存游戏</div>
      <div class="header-right">
        <button class="header-icon" type="button" title="刷新" @click="refresh">⟳</button>
        <button class="header-icon" type="button" title="保存" @click="saveNow">💾</button>
        <button class="header-icon" type="button" :title="currentView === 'main' ? '设置' : '返回'" @click="toggleView">
          {{ currentView === 'main' ? '⚙' : '←' }}
        </button>
      </div>
    </div>

    <div v-if="currentView === 'main'" class="content">
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
                <div class="save-sub">{{ relative(save.保存时间) }}</div>
              </div>
            </div>
            <div class="save-actions">
              <button class="icon-btn" type="button" title="加载" @click="loadAndPlay(save.角色ID, save.存档槽位)">▶</button>
              <button class="icon-btn" type="button" title="导出" @click="exportOne(save.角色ID, save.存档槽位)">⤓</button>
              <button class="icon-btn" type="button" title="复制" @click="duplicateOne(save.角色ID, save.存档槽位)">⎘</button>
              <button class="icon-btn" type="button" title="删除" @click="deleteOne(save.角色ID, save.存档槽位)">🗑</button>
            </div>
          </div>

          <div class="save-details">
            <div>
              <div class="k">境界:</div>
              <div class="k">位置:</div>
              <div class="k">修改:</div>
            </div>
            <div class="right">
              <div class="v">{{ save.境界 }}</div>
              <div class="v">{{ save.位置 }}</div>
              <div class="v">{{ relative(save.保存时间) }}</div>
            </div>
          </div>
        </div>

        <div class="footer-row">
          <button class="nav-btn" type="button" @click="backToModeSelection">返回道途</button>
          <button class="nav-btn" type="button" @click="$router.push({ name: 'GameView' })">继续游玩</button>
        </div>
      </div>
    </div>

    <div v-else class="content">
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
          <span class="op-icon">⤓</span>
          <span>导出当前角色及其所有存档</span>
          <span class="op-action">导出角色</span>
        </div>
        <div class="operation-item" @click="exportAll">
          <span class="op-icon">⤓</span>
          <span>备份所有存档到文件</span>
          <span class="op-action">导出所有存档</span>
        </div>
        <div class="operation-item" @click="importAll">
          <span class="op-icon">⤒</span>
          <span>从文件恢复存档</span>
          <span class="op-action">导入存档</span>
        </div>
        <div class="operation-item danger" @click="clearAll">
          <span class="op-icon danger">🗑</span>
          <span>删除所有存档数据</span>
          <span class="op-action danger">清空存档</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { downloadTextFile } from '../utils/download'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import { useSettingsStore } from '../stores/useSettingsStore'

const router = useRouter()
const characterStore = useCharacterStore()
const gameState = useGameStateStore()
const settingsStore = useSettingsStore()

const currentView = ref<'main' | 'settings'>('main')

onMounted(async () => {
  settingsStore.load()
  if (!characterStore.currentCharacter) {
    await characterStore.loadMetadataFromIndexedDB()
  }
})

const saves = computed(() => characterStore.listSavesForCurrentCharacter())
const saveCountLabel = computed(() => characterStore.getSaveCountLabel())
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

function toggleView() {
  currentView.value = currentView.value === 'main' ? 'settings' : 'main'
}

async function refresh() {
  await characterStore.loadMetadataFromIndexedDB()
}

async function saveNow() {
  try {
    await characterStore.saveCurrentGame()
    alert('保存完成')
  } catch (e) {
    alert(e instanceof Error ? `保存失败：${e.message}` : '保存失败')
  }
}

async function addSave() {
  try {
    const cid = characterStore.requireCurrentCharacterId()
    const slot = characterStore.getNextSaveSlot(cid)
    await characterStore.saveCurrentGame(cid, slot)
  } catch (e) {
    alert(e instanceof Error ? `新建存档失败：${e.message}` : '新建存档失败')
  }
}

async function loadAndPlay(characterId: string, slotKey: string) {
  try {
    await characterStore.loadSaveAndApply(characterId, slotKey)
    router.push({ name: 'GameView' })
  } catch (e) {
    alert(e instanceof Error ? `加载失败：${e.message}` : '加载失败')
  }
}

async function exportOne(characterId: string, slotKey: string) {
  try {
    const content = await characterStore.exportSave(characterId, slotKey)
    const filename = `${characterId}_${slotKey}.json`
    downloadTextFile(filename, content)
  } catch (e) {
    alert(e instanceof Error ? `导出失败：${e.message}` : '导出失败')
  }
}

async function duplicateOne(characterId: string, slotKey: string) {
  try {
    const newSlot = await characterStore.duplicateSave(characterId, slotKey)
    alert(`已复制为：${newSlot}`)
  } catch (e) {
    alert(e instanceof Error ? `复制失败：${e.message}` : '复制失败')
  }
}

async function deleteOne(characterId: string, slotKey: string) {
  if (!confirm(`确定要删除存档「${slotKey}」吗？`)) return
  try {
    await characterStore.deleteSave(characterId, slotKey)
  } catch (e) {
    alert(e instanceof Error ? `删除失败：${e.message}` : '删除失败')
  }
}

async function exportCharacter() {
  try {
    const content = await characterStore.exportCurrentCharacterBundle()
    downloadTextFile(`character_bundle_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, content)
  } catch (e) {
    alert(e instanceof Error ? `导出失败：${e.message}` : '导出失败')
  }
}

async function exportAll() {
  try {
    const content = await characterStore.exportAllBundle()
    downloadTextFile(`all_saves_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, content)
  } catch (e) {
    alert(e instanceof Error ? `导出失败：${e.message}` : '导出失败')
  }
}

async function importAll() {
  try {
    const text = prompt('请粘贴导入文件JSON内容：')
    if (!text) return
    await characterStore.importBundle(text)
    alert('导入成功')
  } catch (e) {
    alert(e instanceof Error ? `导入失败：${e.message}` : '导入失败')
  }
}

async function clearAll() {
  if (!confirm('确定要删除所有存档数据吗？此操作不可恢复。')) return
  try {
    await characterStore.clearAllSaveData()
    alert('已清空')
  } catch (e) {
    alert(e instanceof Error ? `清空失败：${e.message}` : '清空失败')
  }
}

function relative(iso: string) {
  return characterStore.formatRelativeTime(iso)
}

async function backToModeSelection() {
  try {
    await characterStore.saveCurrentGame()
  } catch {
    void 0
  }
  router.push({ name: 'ModeSelection' })
}
</script>

<style scoped>
.save-root {
  min-height: 100vh;
  background: #1e293b;
  color: white;
}

.header {
  background: #0f172a;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;
}

.header-left {
  font-weight: 600;
}

.header-center {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-icon {
  appearance: none;
  border: 0;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 16px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 6px;
}

.header-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.content {
  padding: 16px;
  display: grid;
  gap: 16px;
}

.card {
  background: #2d3748;
  border-radius: 8px;
  padding: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.marker {
  color: #ef4444;
}

.card-title-text {
  color: #60a5fa;
}

.profile-row {
  display: flex;
  align-items: center;
}

.avatar {
  width: 48px;
  height: 48px;
  background: #3b82f6;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.avatar.small {
  width: 40px;
  height: 40px;
}

.profile-text {
  margin-left: 12px;
  display: grid;
  gap: 4px;
}

.profile-name {
  font-weight: 600;
}

.profile-sub {
  color: #94a3b8;
  font-size: 13px;
}

.stats-row {
  display: flex;
  gap: 48px;
  margin-top: 14px;
}

.stat .k {
  color: #94a3b8;
  font-size: 12px;
}

.stat .v {
  color: #60a5fa;
  margin-top: 4px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-title {
  color: #60a5fa;
}

.list-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 0;
  background: #22c55e;
  color: white;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.add-btn:hover {
  filter: brightness(1.05);
}

.count {
  background: white;
  color: #111827;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.save-item {
  background: #374151;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.save-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.save-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-title {
  color: #60a5fa;
  font-weight: 600;
}

.save-sub {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 2px;
}

.save-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  background: #475569;
  border: 0;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: white;
  cursor: pointer;
}

.icon-btn:hover {
  background: #64748b;
}

.save-details {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.save-details .right {
  text-align: right;
}

.save-details .v {
  color: #60a5fa;
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.nav-btn {
  border: 0;
  background: #475569;
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.nav-btn:hover {
  background: #64748b;
}

.empty {
  color: #94a3b8;
  padding: 10px;
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
  background-color: #374151;
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
  border-radius: 50%;
}

.toggle-switch input:checked + .slider {
  background-color: #3b82f6;
}

.toggle-switch input:checked + .slider:before {
  transform: translateX(26px);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #374151;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-name {
  font-weight: 600;
}

.setting-hint {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 4px;
}

.interval {
  width: 90px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #475569;
  background: #1e293b;
  color: white;
}

.operation-item {
  display: flex;
  align-items: center;
  padding: 14px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
}

.operation-item:last-child {
  border-bottom: none;
}

.op-icon {
  margin-right: 12px;
  color: #60a5fa;
}

.op-action {
  margin-left: auto;
  color: #60a5fa;
}

.operation-item.danger .op-action,
.operation-item.danger .op-icon {
  color: #ef4444;
}

@media (max-width: 560px) {
  .stats-row {
    gap: 18px;
  }
  .save-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
