@@
<template>
  <div class="dao-root light-surface">
    <div class="dao-layout">
      <div class="dao-left">
        <div class="stats">
          <div class="stat-card">
            <div class="stat-ico pink">🎯</div>
            <div class="stat-main">
              <div class="stat-value">{{ unlockedCount }}</div>
              <div class="stat-label">已解锁大道</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-ico orange">⚡</div>
            <div class="stat-main">
              <div class="stat-value">{{ totalExp }}</div>
              <div class="stat-label">总感悟经验</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-ico yellow">🏆</div>
            <div class="stat-main">
              <div class="stat-value">{{ highStageCount }}</div>
              <div class="stat-label">高阶道人</div>
            </div>
          </div>
        </div>

        <div v-if="noticeText" class="notice">{{ noticeText }}</div>

        <div class="section">
          <div class="section-head">
            <span class="icon orange">⚡</span>
            <div class="section-title">已解锁大道 ({{ unlockedCount }})</div>
            <button class="icon-btn" type="button" :disabled="refreshing" @click="refresh" style="margin-left: auto">
              <span class="icon muted">⟳</span>
            </button>
          </div>

          <div v-if="unlockedDaos.length === 0" class="empty">
            <div class="empty-ico">🌱</div>
            <div class="empty-title">尚未解锁任何大道</div>
            <div class="empty-sub">通过机缘、顿悟和修行来解锁新的大道</div>
          </div>

          <div v-else class="dao-list">
            <button
              v-for="d in unlockedDaos"
              :key="d.key"
              class="dao-item"
              :class="{ active: selectedDaoKey === d.key }"
              type="button"
              @click="openDao(d.key)"
            >
              <div class="dao-main">
                <div class="dao-title">{{ d.data.道名 || d.key }}</div>
              </div>
              <div class="dao-side">
                <div class="pill pill-blue">{{ stageName(d.data) }}</div>
                <button class="switch-btn" type="button" @click.stop="setMainDao(d.key)">{{ mainDaoName === d.key ? '主修中' : '切换主修' }}</button>
              </div>
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <span class="icon purple">👤</span>
            <div class="section-title">大道感悟</div>
          </div>

          <div class="card">
            <div class="enlight">
              <div class="enlight-ico">📚</div>
              <div class="enlight-main">
                <div class="enlight-title">无量大道，由心而生</div>
                <div class="muted">大道三千，各有奥妙。通过机缘、顿悟、修行，可解锁更多大道路径。</div>

                <div class="grid">
                  <button class="action" type="button" @click="queueDaoAction('大道感悟：深度感悟现有功法，尝试凝练对应大道，并为相关大道增加经验')">
                    <span class="action-ico yellow">💡</span>
                    <span>深度感悟现有功法</span>
                  </button>
                  <button class="action" type="button" @click="queueDaoAction('大道感悟：感悟天地自然规律，尝试解锁对应的大道并增加大道经验')">
                    <span class="action-ico green">🍃</span>
                    <span>感悟天地自然规律</span>
                  </button>
                  <button class="action" type="button" @click="queueDaoAction('大道感悟：获得特殊机缘造化，解锁一条新大道或为现有大道增加大量经验')">
                    <span class="action-ico red">🎁</span>
                    <span>获得特殊机缘造化</span>
                  </button>
                  <button class="action" type="button" @click="queueDaoAction('大道感悟：研习古籍典藏，指定一个大道方向并增加经验，同时描述阶段突破奖励')">
                    <span class="action-ico blue">📜</span>
                    <span>研习古籍典藏</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside v-if="drawerOpen && selectedDao" class="drawer" role="dialog" aria-label="大道详情">
        <div class="drawer-head">
          <div class="drawer-title">{{ selectedDaoKey }}</div>
          <button class="drawer-close" type="button" aria-label="关闭" @click="closeDrawer">✕</button>
        </div>

        <div class="drawer-body">
          <div class="drawer-card">
            <div class="drawer-card-title">大道描述</div>
            <div class="drawer-text">{{ String(selectedDao?.描述 || '-') }}</div>
          </div>

          <div class="drawer-card">
            <div class="drawer-card-title">感悟统计</div>
            <div class="stat-rows">
              <div class="sr">
                <div class="k">当前经验</div>
                <div class="v">{{ expCur(selectedDao) }}</div>
              </div>
              <div class="sr">
                <div class="k">当前阶段</div>
                <div class="v blue">{{ currentStageLabel }}</div>
              </div>
              <div class="sr">
                <div class="k">下一阶段</div>
                <div class="v">{{ nextStageLabel }}</div>
              </div>
              <div class="sr">
                <div class="k">突破所需</div>
                <div class="v">{{ expNeed(selectedDao) }}</div>
              </div>
            </div>
            <div class="drawer-progress">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: expPercent(selectedDao) + '%' }" />
              </div>
              <div class="muted" style="margin-top: 6px">{{ expText(selectedDao) }}</div>
            </div>
          </div>

          <div class="drawer-card">
            <div class="drawer-card-title">境界阶段</div>
            <div class="stage-list">
              <div v-for="(s, idx) in stageRows" :key="idx" class="stage-item" :class="{ active: idx === currentStageIndex }">
                <div class="stage-head">
                  <div class="stage-dot" />
                  <div class="stage-name">{{ s.名称 || '-' }}</div>
                </div>
                <div class="stage-desc">{{ s.描述 || '-' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-foot">
          <button class="drawer-primary" type="button" @click="deepEnlighten">⚡ 深入感悟此道</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useActionQueueStore } from '../stores/useActionQueueStore'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'
import type { TavernCommand } from '../services/tavernCommands'
import { DAO_PRESETS, daoCategoriesFromPresets, type DaoPreset } from '../config/daoPresets'

const gameState = useGameStateStore()
const characterStore = useCharacterStore()
const actionQueueStore = useActionQueueStore()

type DaoStage = { 名称: string; 描述?: string; 突破经验: number }

type DaoEntry = {
  道名: string
  描述: string
  阶段列表: DaoStage[]
  是否解锁: boolean
  当前阶段: number
  当前经验: number
  总经验: number
}

const presetKeys = computed(() => Object.keys(DAO_PRESETS || {}))
const presetCategories = computed(() => daoCategoriesFromPresets(DAO_PRESETS))

const unlockKey = ref(presetKeys.value[0] || '')
const searchText = ref('')
const activeCategory = ref('')

const filteredPresets = computed<DaoPreset[]>(() => {
  const q = String(searchText.value || '').trim().toLowerCase()
  const cat = String(activeCategory.value || '')

  const arr: DaoPreset[] = []
  for (const p of Object.values(DAO_PRESETS || {})) {
    if (!p || typeof p !== 'object') continue
    if (cat && String((p as any).分类 || '') !== cat) continue
    if (q) {
      const hay = `${String((p as any).道名 || '')} ${String((p as any).描述 || '')} ${String((p as any).分类 || '')}`.toLowerCase()
      if (!hay.includes(q)) continue
    }
    arr.push(p as DaoPreset)
  }
  arr.sort((a, b) => String(a.分类).localeCompare(String(b.分类)) || String(a.道名).localeCompare(String(b.道名)))
  return arr
})

const daoRoot = computed<any>(() => (gameState as any).三千大道 || { 大道列表: {} })
const daoList = computed<Record<string, any>>(() => {
  const list = daoRoot.value?.大道列表
  if (!list || typeof list !== 'object') return {}
  return list
})

const mainDaoName = computed(() => String(daoRoot.value?.当前主修 || ''))

const refreshing = ref(false)
const noticeText = ref('')

const unlockedDaos = computed(() => {
  const out: Array<{ key: string; data: any }> = []
  for (const [k, v] of Object.entries(daoList.value || {})) {
    if (v && typeof v === 'object' && (v as any).是否解锁) out.push({ key: k, data: v })
  }
  return out
})

const selectedDaoKey = ref<string>('')

const selectedDao = computed<any>(() => {
  const key = selectedDaoKey.value
  if (!key) return null
  return (daoList.value as any)[key] || null
})

const unlockedCount = computed(() => unlockedDaos.value.length)

const drawerOpen = ref(false)

const currentStageIndex = computed(() => {
  const dao = selectedDao.value
  const idx = Number(dao?.当前阶段 ?? 0)
  return Number.isFinite(idx) ? Math.max(0, Math.floor(idx)) : 0
})

const stageRows = computed(() => {
  const dao = selectedDao.value
  return normalizedStages(dao)
})

const currentStageLabel = computed(() => {
  const dao = selectedDao.value
  if (!dao) return '-'
  return stageName(dao)
})

const nextStageLabel = computed(() => {
  const dao = selectedDao.value
  if (!dao) return '-'
  const idx = currentStageIndex.value
  const list = Array.isArray(dao?.阶段列表) ? dao.阶段列表 : []
  const next = list[idx + 1]
  return String(next?.名称 || '无')
})

function openDao(key: string) {
  const k = String(key || '').trim()
  if (!k) return
  selectedDaoKey.value = k
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

const totalExp = computed(() => {
  let n = 0
  for (const d of unlockedDaos.value) {
    const v = Number((d.data as any).总经验 ?? 0)
    if (Number.isFinite(v)) n += v
  }
  return n
})

const highStageCount = computed(() => {
  let n = 0
  for (const d of unlockedDaos.value) {
    const s = Number((d.data as any).当前阶段 ?? 0)
    if (Number.isFinite(s) && s >= 3) n += 1
  }
  return n
})

function queueDaoAction(text: string) {
  const desc = String(text || '').trim()
  if (!desc) return
  actionQueueStore.addAction({ type: 'dao', itemName: '大道感悟', itemType: '大道', description: desc })
  noticeText.value = '已加入最近操作，请在对话中发送以推进推演'
}

function isUnlocked(name: string) {
  const v: any = (daoList.value as any)?.[name]
  return !!(v && typeof v === 'object' && v.是否解锁)
}

function selectPreset(name: string) {
  if (!name) return
  unlockKey.value = name
}

function stageName(dao: any) {
  const idx = Number(dao?.当前阶段 ?? 0)
  const list = Array.isArray(dao?.阶段列表) ? dao.阶段列表 : []
  const s = list[idx]
  return String(s?.名称 || `阶段${idx}`)
}

function expNeed(dao: any): number {
  const idx = Number(dao?.当前阶段 ?? 0)
  const list = Array.isArray(dao?.阶段列表) ? dao.阶段列表 : []
  const s = list[idx]
  const need = Number(s?.突破经验)
  return Number.isFinite(need) && need > 0 ? need : 100
}

function expCur(dao: any): number {
  const cur = Number(dao?.当前经验 ?? 0)
  return Number.isFinite(cur) ? Math.max(0, cur) : 0
}

function expText(dao: any) {
  const cur = expCur(dao)
  const need = expNeed(dao)
  return `${cur}/${need}`
}

function expPercent(dao: any) {
  const need = expNeed(dao)
  if (need <= 0) return 0
  return Math.min(100, Math.max(0, Math.floor((expCur(dao) / need) * 100)))
}

function normalizedStages(dao: any): DaoStage[] {
  const list = Array.isArray(dao?.阶段列表) ? dao.阶段列表 : []
  return list.map((x: any) => ({ 名称: String(x?.名称 || ''), 描述: x?.描述 ? String(x.描述) : '', 突破经验: Number(x?.突破经验 ?? 0) || 0 }))
}

function setMainDao(name: string) {
  const k = String(name || '').trim()
  if (!k) return
  if (!isUnlocked(k)) return
  gameState.applyCommands([{ action: 'set', key: '三千大道.当前主修', value: k } as TavernCommand])
  noticeText.value = `已设置主修大道：${k}`
  actionQueueStore.addAction({ type: 'dao', itemName: k, itemType: '大道', description: `切换主修大道为《${k}》` })
}

function buildUnlockCommands(name: string): TavernCommand[] {
  const preset = (DAO_PRESETS as any)[name]
  if (!preset) return []

  const entry: DaoEntry = {
    道名: String(preset.道名 || name),
    描述: String(preset.描述 || ''),
    阶段列表: Array.isArray(preset.阶段列表) ? preset.阶段列表 : [],
    是否解锁: true,
    当前阶段: 0,
    当前经验: 0,
    总经验: 0
  }

  const cmds: TavernCommand[] = []
  cmds.push({ action: 'set', key: '三千大道.大道列表', value: daoList.value || {} })
  cmds.push({ action: 'set', key: `三千大道.大道列表.${name}`, value: entry })
  return cmds
}

function unlockSelected() {
  const k = unlockKey.value
  const cmds = buildUnlockCommands(k)
  if (cmds.length === 0) return
  gameState.applyCommands(cmds)
  selectedDaoKey.value = k
  actionQueueStore.addAction({ type: 'dao', itemName: String(k || ''), itemType: '大道', description: `解锁大道《${k}》` })
}

function refresh() {
  if (refreshing.value) return
  ;(async () => {
    try {
      refreshing.value = true
      const active = (characterStore as any).当前激活存档 as any
      if (!active?.角色ID || !active?.存档槽位) {
        noticeText.value = '没有激活的存档，无法刷新大道数据'
        return
      }
      await characterStore.loadSaveAndApply(active.角色ID, active.存档槽位)
      noticeText.value = '大道数据已从存档刷新'
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      noticeText.value = `刷新大道数据失败：${msg}`
    } finally {
      refreshing.value = false
    }
  })()
}

function deepEnlighten() {
  const key = String(selectedDaoKey.value || '').trim()
  if (!key) return
  actionQueueStore.addAction({ type: 'comprehend', itemName: key, itemType: '大道', description: `深入感悟《${key}》，领悟其中奥义` })
  noticeText.value = '已加入最近操作，请在对话中发送以推进推演'
}
</script>

<style scoped>
.dao-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

 .dao-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
  min-height: 640px;
 }

 .dao-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
 }

 @media (max-width: 980px) {
  .dao-layout {
    grid-template-columns: 1fr;
  }
 }

 .notice {
  border: 1px solid rgba(37, 99, 235, 0.22);
  background: rgba(37, 99, 235, 0.08);
  color: rgba(37, 99, 235, 0.95);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
 }

.input {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  color: var(--color-text);
  border-radius: 10px;
  padding: 8px 10px;
  min-width: 240px;
}

.icon-btn {
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.icon {
  font-size: 14px;
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 760px) {
  .stats {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.stat-card {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-ico {
  font-size: 20px;
}

.pink {
  color: rgba(244, 114, 182, 0.95);
}

.orange {
  color: rgba(251, 146, 60, 0.95);
}

.yellow {
  color: rgba(250, 204, 21, 0.95);
}

.purple {
  color: rgba(192, 132, 252, 0.95);
}

.green {
  color: rgba(34, 197, 94, 0.95);
}

.red {
  color: rgba(248, 113, 113, 0.95);
}

.blue {
  color: rgba(96, 165, 250, 0.95);
}

.stat-value {
  font-weight: 900;
  font-size: 22px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-weight: 700;
}

.empty {
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.55);
  border-radius: 12px;
  padding: 18px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-ico {
  font-size: 44px;
  margin-bottom: 8px;
}

.empty-title {
  font-weight: 700;
  margin-bottom: 4px;
}

.empty-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.dao-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dao-item {
  text-align: left;
  width: 100%;
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.55);
  border-radius: 12px;
  padding: 12px;
  color: var(--color-text);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}

 .switch-btn {
  border: 1px solid rgba(37, 99, 235, 0.22);
  background: rgba(37, 99, 235, 0.10);
  color: rgba(37, 99, 235, 0.95);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
 }

.dao-item.active {
  border-color: rgba(59, 130, 246, 0.7);
}

.dao-title {
  font-weight: 800;
  margin-bottom: 4px;
}

.dao-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.03);
}

.dao-detail {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  border-radius: 12px;
  padding: 12px;
}

.detail-title {
  font-weight: 800;
  margin-bottom: 8px;
}

.card {
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.55);
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  font-weight: 800;
  margin-bottom: 10px;
}

.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.preset-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow: auto;
}

.preset-item {
  text-align: left;
  width: 100%;
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  border-radius: 12px;
  padding: 10px;
  color: var(--color-text);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}

.preset-item.disabled {
  opacity: 0.65;
}

.preset-title {
  font-weight: 800;
  margin-bottom: 4px;
}

.preset-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.select {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  color: var(--color-text);
  border-radius: 10px;
  padding: 8px 10px;
}

.muted {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.progress {
  margin-top: 8px;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.progress-track {
  height: 9px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(34, 197, 94, 0.85);
  border-radius: 999px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid var(--color-border);
  background: rgba(30, 58, 138, 0.35);
  color: var(--color-text);
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:hover {
  border-color: var(--color-border-hover);
}

.btn-ghost {
  background: transparent;
}

.enlight {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 12px;
}

.enlight-ico {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.enlight-title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}

.grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 760px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

.action {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  color: var(--color-text);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

 .drawer {
  position: sticky;
  top: 0;
  width: 360px;
  max-height: 100%;
  height: 720px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
 }

 @media (max-width: 980px) {
  .drawer {
    position: static;
    width: 100%;
    height: auto;
  }
 }

 .drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
 }

 .drawer-title {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
 }

 .drawer-close {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: rgba(15, 23, 42, 0.75);
  border-radius: 10px;
  width: 34px;
  height: 34px;
  cursor: pointer;
 }

 .drawer-body {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
 }

 .drawer-card {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  padding: 12px;
 }

 .drawer-card-title {
  font-weight: 900;
  margin-bottom: 8px;
  color: rgba(15, 23, 42, 0.92);
 }

 .drawer-text {
  color: rgba(15, 23, 42, 0.75);
  line-height: 1.6;
  font-size: 13px;
 }

 .stat-rows {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
 }

 .sr {
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 10px;
 }

 .sr .k {
  color: rgba(15, 23, 42, 0.55);
  font-size: 12px;
 }

 .sr .v {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 900;
  margin-top: 6px;
 }

 .sr .v.blue {
  color: rgba(37, 99, 235, 0.95);
 }

 .drawer-progress .progress-track {
  background: rgba(15, 23, 42, 0.10);
 }

 .drawer-progress .progress-fill {
  background: rgba(37, 99, 235, 0.90);
 }

 .stage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
 }

 .stage-item {
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 10px;
 }

 .stage-item.active {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
 }

 .stage-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
 }

 .stage-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.55);
 }

 .stage-name {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
 }

 .stage-desc {
  color: rgba(15, 23, 42, 0.55);
  font-size: 12px;
  line-height: 1.55;
 }

 .drawer-foot {
  padding: 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
 }

 .drawer-primary {
  width: 100%;
  border: 1px solid rgba(37, 99, 235, 0.95);
  background: rgba(37, 99, 235, 0.95);
  color: #fff;
  border-radius: 12px;
  padding: 12px;
  font-weight: 900;
  cursor: pointer;
 }

.action:hover {
  border-color: var(--color-border-hover);
}

.action-ico {
  width: 22px;
  text-align: center;
}

 .dao-root {
  background: rgba(248, 250, 252, 0.0);
 }

 .stats {
  grid-template-columns: 1fr;
 }

 @media (min-width: 760px) {
  .stats {
    grid-template-columns: 1fr 1fr 1fr;
  }
 }

 .stat-card {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .stat-label {
  color: rgba(15, 23, 42, 0.55);
 }

 .section-title {
  color: rgba(15, 23, 42, 0.92);
 }

 .icon-btn {
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.75);
 }

 .empty {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .empty-sub {
  color: rgba(15, 23, 42, 0.55);
 }

 .dao-item {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.92);
 }

 .dao-title {
  margin-bottom: 0;
 }

 .pill {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: rgba(15, 23, 42, 0.65);
 }

 .pill-blue {
  border-color: rgba(37, 99, 235, 0.22);
  background: rgba(37, 99, 235, 0.10);
  color: rgba(37, 99, 235, 0.95);
  font-weight: 800;
 }

 .card {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .muted {
  color: rgba(15, 23, 42, 0.55);
 }

 .enlight-ico {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.22);
 }

 .action {
  background: rgba(248, 250, 252, 0.95);
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.92);
 }
</style>
