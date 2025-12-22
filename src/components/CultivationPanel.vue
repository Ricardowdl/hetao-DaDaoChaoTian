<template>
  <div class="cultivation-root">
    <div class="nav">
      <button class="nav-btn" type="button" :class="{ active: activeTab === '修炼' }" @click="activeTab = '修炼'">
        <span class="nav-ico">⚡</span>
        <span>修炼</span>
      </button>
      <button class="nav-btn" type="button" :class="{ active: activeTab === '功法库' }" @click="activeTab = '功法库'">
        <span class="nav-ico">📚</span>
        <span>功法库</span>
        <span class="badge">{{ gongfaList.length }}</span>
      </button>
    </div>

    <div class="content">
      <div v-if="activeTab === '修炼'">
        <div v-if="!currentItem" class="empty">
          <div class="empty-ico">📄</div>
          <div class="empty-title">从功法库中选择一部功法开始修炼</div>
          <div class="empty-sub">功法中蕴含多种技能，随着熟练度提升逐步解锁</div>
          <div class="actions" style="justify-content: center; margin-top: 14px">
            <button class="btn" type="button" @click="activeTab = '功法库'">打开功法库</button>
          </div>
        </div>

        <div v-else class="practice">
          <div class="card gongfa-card">
            <div class="gongfa-head">
              <div class="gongfa-ico" aria-hidden="true">📘</div>
              <div class="gongfa-main">
                <div class="gongfa-sub">正在修炼</div>
                <div class="gongfa-name">{{ currentItem.名称 || currentRef?.名称 || '-' }}</div>
              </div>
              <div class="gongfa-actions">
                <button class="btn" type="button" @click="openDeepCultivation">深度修炼</button>
                <button class="btn btn-ghost" type="button" @click="stopCultivation">卸下</button>
              </div>
            </div>

            <div class="gongfa-kv">
              <div class="kv-row">
                <div class="k">品质</div>
                <div class="v">{{ qualityText(currentItem.品质) }}</div>
              </div>
              <div class="kv-row">
                <div class="k">类型</div>
                <div class="v">功法</div>
              </div>
              <div class="kv-row">
                <div class="k">技能数</div>
                <div class="v">{{ totalSkillCount(currentItem) }}</div>
              </div>
              <div class="kv-row">
                <div class="k">已解锁</div>
                <div class="v">{{ unlockedCount(currentItem) }}</div>
              </div>
            </div>
          </div>

          <div class="card progress-card">
            <div class="card-head">
              <div class="head-left">
                <span class="head-ico" aria-hidden="true">⚡</span>
                <span>修炼熟练度</span>
              </div>
              <div class="head-right">{{ progressText(currentItem) }}</div>
            </div>

            <div class="milestones">
              <span v-if="firstUnlockedSkillName" class="pill pill-ok">{{ firstUnlockedSkillName }}</span>
              <span v-if="nextSkill" class="pill">{{ nextSkill.name }}</span>
            </div>

            <div class="progress-track big">
              <div class="progress-fill" :style="{ width: progressPercent(currentItem) + '%' }" />
            </div>

            <div v-if="nextSkill" class="next-line">下一技能：<span class="next-name">{{ nextSkill.name }}</span>（{{ nextSkill.req }}%）</div>
          </div>

          <div class="card">
            <div class="card-head">
              <div class="head-left">
                <span class="head-ico ok" aria-hidden="true">✔</span>
                <span>已掌握技能</span>
              </div>
              <div class="head-right muted">{{ unlockedCount(currentItem) }} / {{ totalSkillCount(currentItem) }}</div>
            </div>

            <div v-if="unlockedSkillList.length === 0" class="muted">暂无已掌握技能（继续修炼以解锁）</div>
            <div v-else class="skill-grid">
              <div v-for="s in unlockedSkillList" :key="String(s?.技能名称 || s?.名称 || '')" class="skill-card unlocked">
                <div class="skill-top">
                  <div class="skill-title">{{ String(s?.技能名称 || s?.名称 || '未知技能') }}</div>
                  <span class="skill-tag tag-ok">已解锁</span>
                </div>
                <div class="skill-desc">{{ String(s?.技能描述 || s?.描述 || '无描述') }}</div>
                <div class="skill-foot muted">解锁要求：{{ s?.熟练度要求 ?? 0 }}%</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <div class="head-left">
                <span class="head-ico warn" aria-hidden="true">🔒</span>
                <span>待解锁技能</span>
              </div>
              <div class="head-right muted">{{ lockedSkillList.length }} 个</div>
            </div>

            <div v-if="lockedSkillList.length === 0" class="muted">暂无待解锁技能</div>
            <div v-else class="skill-grid">
              <div v-for="s in lockedSkillList" :key="String(s?.技能名称 || s?.名称 || '')" class="skill-card locked">
                <div class="skill-top">
                  <div class="skill-title">{{ String(s?.技能名称 || s?.名称 || '未知技能') }}</div>
                  <span class="skill-tag">未解锁</span>
                </div>
                <div class="skill-desc">{{ String(s?.技能描述 || s?.描述 || '无描述') }}</div>
                <div class="lock-progress">
                  <div class="lock-head">
                    <span class="muted">需要熟练度</span>
                    <span class="muted">{{ s?.熟练度要求 ?? 0 }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: unlockProgressPercent(s) + '%' }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-if="gongfaList.length === 0" class="empty">
          <div class="empty-ico">🧊</div>
          <div class="empty-title">功法库为空，探索世界获取功法秘籍</div>
        </div>

        <div v-else class="library">
          <div v-for="g in gongfaList" :key="g.id" class="gongfa">
            <div class="g-left">
              <div class="g-title">《{{ g.item.名称 || g.id }}》</div>
              <div class="g-sub">
                <span class="g-tag">{{ qualityText(g.item.品质) }}</span>
                <span class="g-tag">进度 {{ progressText(g.item) }}</span>
                <span class="g-tag">已解锁 {{ unlockedCount(g.item) }} / {{ totalSkillCount(g.item) }}</span>
                <span class="g-tag" v-if="isCurrent(g.id)">修炼中</span>
              </div>
            </div>
            <div class="g-right">
              <button class="btn" type="button" @click="startCultivation(g.id)">{{ isCurrent(g.id) ? '正在修炼' : '开始修炼' }}</button>
              <button class="btn btn-ghost" type="button" @click="toggleDetails(g.id)">{{ detailsId === g.id ? '收起' : '详情' }}</button>
            </div>

            <div v-if="detailsId === g.id" class="g-details">
              <div class="muted" v-if="g.item.描述">{{ g.item.描述 }}</div>
              <div class="muted" v-if="g.item.功法效果" style="margin-top: 6px">功法效果：{{ g.item.功法效果 }}</div>
              <div class="muted" style="margin-top: 10px">技能列表</div>
              <div v-if="totalSkillCount(g.item) === 0" class="muted">暂无技能</div>
              <div v-else class="skill-list" style="margin-top: 8px">
                <div v-for="s in normalizeSkills(g.item)" :key="String(s.技能名称 || s.名称 || '')" class="skill">
                  <div class="skill-main">
                    <div class="skill-title">{{ s.技能名称 || s.名称 || '未知技能' }}</div>
                    <div class="skill-desc">{{ s.技能描述 || s.描述 || '无描述' }}</div>
                  </div>
                  <div class="skill-side">
                    <div class="skill-meta" v-if="s.消耗">消耗：{{ s.消耗 }}</div>
                    <div class="skill-meta">要求：{{ s.熟练度要求 ?? 0 }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="deepCultivationVisible" class="modal-overlay" @click.self="closeDeepCultivation">
      <div class="deep-modal">
        <div class="deep-head">
          <div class="deep-title">深度修炼</div>
          <button class="deep-close" type="button" aria-label="关闭" @click="closeDeepCultivation">×</button>
        </div>

        <div class="deep-body">
          <div class="tech-card">
            <div class="tech-ico" aria-hidden="true">📘</div>
            <div class="tech-main">
              <div class="tech-name">{{ currentItem?.名称 || currentRef?.名称 || '-' }}</div>
              <div class="tech-sub">{{ qualityText(currentItem?.品质) }}</div>

              <div class="tech-progress-row">
                <div class="tech-progress-label">当前修炼进度</div>
                <div class="tech-progress-val">{{ progressText(currentItem) }}</div>
              </div>
              <div class="progress-track big">
                <div class="progress-fill" :style="{ width: progressPercent(currentItem) + '%' }" />
              </div>

              <div class="tech-effect muted" style="margin-top: 8px">功法效果：{{ String(currentItem?.功法效果 || currentItem?.描述 || '暂无') }}</div>
            </div>
          </div>

          <div class="days-block">
            <div class="days-title">选择修炼天数</div>
            <div class="days-hint muted">AI将根据修炼天数生成详细的修炼过程和结果</div>

            <div class="days-input">
              <input class="days-number" type="number" min="1" max="365" v-model.number="deepDays" />
              <div class="days-unit">天</div>
            </div>

            <div class="days-quick">
              <button v-for="d in quickDays" :key="d" class="days-btn" type="button" :class="{ active: deepDays === d }" @click="setDeepDays(d)">
                {{ d }}天
              </button>
            </div>
          </div>
        </div>

        <div class="deep-foot">
          <button class="btn btn-ghost" type="button" @click="closeDeepCultivation">取消</button>
          <button class="btn" type="button" @click="confirmDeepCultivation">开始修炼</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useGameStateStore } from '../stores/useGameStateStore'
import { useActionQueueStore } from '../stores/useActionQueueStore'
import { useUndoStore } from '../stores/useUndoStore'
import { useCharacterStore } from '../stores/useCharacterStore'
import { buildCultivateGongfaCommands, buildEquipGongfaCommands, buildUnequipGongfaCommands, qualityLabel } from '../services/inventory'

const emit = defineEmits<{
  (e: 'fill-action', text: string): void
}>()

const gameState = useGameStateStore()
const actionQueueStore = useActionQueueStore()
const undoStore = useUndoStore()
const characterStore = useCharacterStore()

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

type InnerTab = '修炼' | '功法库'
const activeTab = ref<InnerTab>('修炼')
const detailsId = ref<string>('')

const deepCultivationVisible = ref(false)
const deepDays = ref<number>(7)
const quickDays = [1, 7, 30, 90, 180, 365]

const allItems = computed<Record<string, any>>(() => {
  const items = (gameState as any)?.背包?.物品
  if (!items || typeof items !== 'object') return {}
  return items as any
})

const gongfaList = computed(() => {
  const out: Array<{ id: string; item: any }> = []
  for (const [id, item] of Object.entries(allItems.value || {})) {
    if (String((item as any)?.类型) === '功法') out.push({ id, item })
  }
  return out
})

const currentRef = computed<any>(() => (gameState as any).修炼功法 || null)

const currentItem = computed<any>(() => {
  const id = String(currentRef.value?.物品ID || '')
  if (!id) return null
  return (allItems.value as any)[id] || null
})

const masteredSkills = computed<any[]>(() => {
  const list = (gameState as any).掌握技能
  return Array.isArray(list) ? (list as any[]) : []
})

const masteredSkillNames = computed(() => {
  const out: string[] = []
  for (const s of masteredSkills.value) {
    if (!s) continue
    if (typeof s === 'string') {
      const t = s.trim()
      if (t) out.push(t)
      continue
    }
    if (typeof s === 'object') {
      const t = String((s as any).技能名称 || (s as any).名称 || (s as any).name || '').trim()
      if (t) out.push(t)
      continue
    }
  }
  return out
})

function normalizeSkills(item: any): any[] {
  const list = item?.功法技能
  return Array.isArray(list) ? list : []
}

function normalizeUnlocked(item: any): string[] {
  const list = item?.已解锁技能
  if (!Array.isArray(list)) return []
  return list.map((x: any) => String(x)).filter(Boolean)
}

const unlockedSkillList = computed(() => {
  const item = currentItem.value
  if (!item) return []

  const unlockedSet = new Set(normalizeUnlocked(item))
  const all = normalizeSkills(item)
  const out: any[] = []

  for (const s of all) {
    const name = String(s?.技能名称 || s?.名称 || '').trim()
    if (!name) continue
    if (unlockedSet.has(name)) out.push(s)
  }

  return out
})

const lockedSkillList = computed(() => {
  const item = currentItem.value
  if (!item) return []

  const unlockedSet = new Set(normalizeUnlocked(item))
  const all = normalizeSkills(item)
  const out: any[] = []

  for (const s of all) {
    const name = String(s?.技能名称 || s?.名称 || '').trim()
    if (!name) continue
    if (!unlockedSet.has(name)) out.push(s)
  }

  out.sort((a, b) => {
    const ra = Number((a as any)?.熟练度要求 ?? 0)
    const rb = Number((b as any)?.熟练度要求 ?? 0)
    if (!Number.isFinite(ra) && !Number.isFinite(rb)) return 0
    if (!Number.isFinite(ra)) return 1
    if (!Number.isFinite(rb)) return -1
    return ra - rb
  })

  return out
})

const nextSkill = computed(() => {
  const s = lockedSkillList.value[0]
  if (!s) return null
  const name = String(s?.技能名称 || s?.名称 || '').trim()
  if (!name) return null
  const reqRaw = Number(s?.熟练度要求 ?? 0)
  const req = Number.isFinite(reqRaw) ? Math.max(0, Math.floor(reqRaw)) : 0
  return { name, req }
})

const firstUnlockedSkillName = computed(() => {
  const s = unlockedSkillList.value[0]
  if (!s) return ''
  return String(s?.技能名称 || s?.名称 || '').trim()
})

function isCurrent(id: string) {
  const cur = String(currentRef.value?.物品ID || '')
  return cur && cur === id
}

function progressPercent(item: any): number {
  const p = Number(item?.修炼进度 ?? 0)
  if (!Number.isFinite(p)) return 0
  return Math.max(0, Math.min(100, Math.floor(p)))
}

function progressText(item: any): string {
  return `${progressPercent(item)}%`
}

function unlockProgressPercent(skill: any): number {
  const cur = progressPercent(currentItem.value)
  const req = Number(skill?.熟练度要求 ?? 0)
  if (!Number.isFinite(req) || req <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((cur / req) * 100)))
}

function unlockedCount(item: any): number {
  return normalizeUnlocked(item).length
}

function totalSkillCount(item: any): number {
  return normalizeSkills(item).length
}

function qualityText(q: any) {
  if (!q || typeof q !== 'object') return '-'
  const top = String((q as any).quality || '')
  const grade = Number((q as any).grade)
  if (!top) return '-'
  if (!Number.isFinite(grade)) return `${top}品`
  return `${top}品${Math.max(0, Math.floor(grade))}阶`
}

function toggleDetails(id: string) {
  detailsId.value = detailsId.value === id ? '' : id
}

function emitAction(text: string) {
  emit('fill-action', text)
}

function openDeepCultivation() {
  if (!currentItem.value) return
  deepDays.value = 7
  deepCultivationVisible.value = true
}

function closeDeepCultivation() {
  deepCultivationVisible.value = false
}

function setDeepDays(days: number) {
  const d = Number(days)
  if (!Number.isFinite(d)) return
  deepDays.value = Math.min(365, Math.max(1, Math.floor(d)))
}

function confirmDeepCultivation() {
  const item = currentItem.value
  const id = String(currentRef.value?.物品ID || '')
  if (!item || !id) return

  const days = Math.min(365, Math.max(1, Math.floor(Number(deepDays.value) || 1)))
  actionQueueStore.addAction({
    type: 'cultivate',
    itemName: String(item?.名称 || id),
    itemType: '功法',
    description: `对《${String(item?.名称 || id)}》进行${days}天的深度修炼`
  })

  closeDeepCultivation()
}

function startCultivation(itemId: string) {
  const item = (allItems.value as any)[itemId]
  if (!item || String(item?.类型) !== '功法') return

  const snapshot = {
    bagItems: clone(gameState?.背包?.物品 || {}),
    selectedGongfa: clone((gameState as any)?.修炼功法)
  }

  const cmds = buildEquipGongfaCommands({ ...item, 物品ID: itemId }, allItems.value)
  gameState.applyCommands(cmds)
  void characterStore.saveCurrentGame(undefined, undefined, { toast: false })

  actionQueueStore.addAction({
    type: 'cultivate',
    itemName: String(item?.名称 || itemId),
    itemType: '功法',
    description: `开始修炼《${String(item?.名称 || itemId)}》功法`
  })

  undoStore.push({
    type: 'cultivate',
    itemId,
    itemName: String(item?.名称 || itemId),
    restoreData: snapshot
  })

  activeTab.value = '修炼'
  detailsId.value = ''
}

function stopCultivation() {
  const item = currentItem.value
  const id = String(currentRef.value?.物品ID || '')
  if (!item || !id) return

  const snapshot = {
    bagItems: clone(gameState?.背包?.物品 || {}),
    selectedGongfa: clone((gameState as any)?.修炼功法)
  }

  const cmds = buildUnequipGongfaCommands({ ...item, 物品ID: id })
  gameState.applyCommands(cmds)
  void characterStore.saveCurrentGame(undefined, undefined, { toast: false })

  actionQueueStore.addAction({
    type: 'unequip',
    itemName: String(item?.名称 || id),
    itemType: '功法',
    description: `停止修炼并卸下《${String(item?.名称 || id)}》功法`
  })

  undoStore.push({
    type: 'cultivate',
    itemId: id,
    itemName: String(item?.名称 || id),
    restoreData: snapshot
  })
}

function cultivateOnce(delta: number) {
  const item = currentItem.value
  const id = String(currentRef.value?.物品ID || '')
  if (!item || !id) return

  const snapshot = {
    bagItems: clone(gameState?.背包?.物品 || {}),
    selectedGongfa: clone((gameState as any)?.修炼功法)
  }

  const cmds = buildCultivateGongfaCommands({ ...item, 物品ID: id }, delta)
  gameState.applyCommands(cmds)
  void characterStore.saveCurrentGame(undefined, undefined, { toast: false })

  const d = Number.isFinite(delta) ? Math.floor(delta) : 0
  actionQueueStore.addAction({
    type: 'cultivate',
    itemName: String(item?.名称 || id),
    itemType: '功法',
    description: `修炼《${String(item?.名称 || id)}》功法（进度+${d}）`
  })

  undoStore.push({
    type: 'cultivate',
    itemId: id,
    itemName: String(item?.名称 || id),
    restoreData: snapshot
  })
}
</script>

<style scoped>
.cultivation-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  gap: 10px;
}

.nav-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  cursor: pointer;
}

.nav-btn.active {
  background: rgba(59, 130, 246, 0.7);
}

.nav-ico {
  font-size: 14px;
}

.badge {
  margin-left: 6px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: rgba(148, 163, 184, 0.2);
}

.content {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 14px;
  min-height: 300px;
}

.empty {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-ico {
  font-size: 44px;
  opacity: 0.6;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 16px;
  color: var(--text-1);
  margin-bottom: 6px;
}

.empty-sub {
  font-size: 13px;
  color: var(--text-muted);
}

.practice {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.library {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  font-weight: 800;
  margin-bottom: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.name {
  font-weight: 800;
  font-size: 16px;
}

.tag {
  font-size: 12px;
  border: 1px solid var(--panel-border);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
}

.desc {
  margin-top: 10px;
}

.muted {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.progress {
  margin-top: 12px;
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
  background: rgba(59, 130, 246, 0.85);
  border-radius: 999px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  display: grid;
  place-items: center;
  z-index: 60;
}

.deep-modal {
  width: min(720px, calc(100vw - 28px));
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  box-shadow: var(--shadow-1);
  overflow: hidden;
}

.deep-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--surface-3);
}

.deep-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-1);
}

.deep-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.deep-close:hover {
  background: var(--surface-2);
  color: var(--text-2);
}

.deep-body {
  padding: 16px;
  display: grid;
  gap: 14px;
}

.tech-card {
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  background: var(--surface-2);
  padding: 14px;
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 12px;
}

.tech-ico {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: var(--accent);
  display: grid;
  place-items: center;
  font-size: 22px;
}

.tech-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-1);
}

.tech-sub {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 13px;
}

.tech-progress-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
}

.tech-progress-val {
  color: var(--text-2);
  font-weight: 700;
}

.days-block {
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  background: var(--surface-2);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.days-title {
  font-weight: 800;
  color: var(--text-1);
}

.days-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.days-number {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  padding: 10px 12px;
  outline: none;
}

.days-number:focus {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 3px var(--accent);
}

.days-unit {
  color: var(--text-muted);
}

.days-quick {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.days-btn {
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  padding: 10px 12px;
  cursor: pointer;
}

.days-btn.active {
  border-color: var(--accent-strong);
  background: var(--accent-strong);
}

.deep-foot {
  padding: 14px 16px;
  border-top: 1px solid var(--panel-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.deep-modal .muted {
  color: var(--text-muted);
}

.deep-modal .btn {
  border: 1px solid var(--panel-border);
  background: var(--accent);
  color: var(--text-1);
}

.deep-modal .btn:hover {
  background: var(--accent-strong);
}

.deep-modal .btn-ghost {
  background: var(--surface-3);
  color: var(--text-1);
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

.btn-danger {
  background: rgba(220, 38, 38, 0.35);
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.skill-title {
  font-weight: 800;
  margin-bottom: 6px;
}

.skill-desc {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.skill-side {
  min-width: 120px;
  text-align: right;
}

.skill-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
  font-size: 12px;
}

.gongfa {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  border-radius: 12px;
  padding: 12px;
}

.g-title {
  font-weight: 800;
  margin-bottom: 6px;
}

.g-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.g-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.03);
}

.g-left {
  min-width: 0;
}

.g-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.g-details {
  margin-top: 10px;
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}

 .nav {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .nav-btn {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.92);
 }

 .nav-btn.active {
  background: rgba(37, 99, 235, 0.95);
  border-color: rgba(37, 99, 235, 0.95);
  color: #fff;
 }

 .badge {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
 }

 .content {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .empty-title {
  color: rgba(15, 23, 42, 0.92);
 }

 .empty-sub {
  color: rgba(15, 23, 42, 0.55);
 }

 .card {
  background: rgba(248, 250, 252, 0.95);
  border-color: rgba(15, 23, 42, 0.12);
 }

 .muted {
  color: rgba(15, 23, 42, 0.55);
 }

 .btn {
  border-color: rgba(37, 99, 235, 0.95);
  background: rgba(37, 99, 235, 0.95);
  color: #fff;
 }

 .btn:hover {
  border-color: rgba(37, 99, 235, 0.95);
 }

 .btn-ghost {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.92);
 }

 .progress-track {
  background: rgba(15, 23, 42, 0.10);
 }

 .progress-fill {
  background: rgba(37, 99, 235, 0.90);
 }

 .progress-track.big {
  height: 10px;
 }

 .gongfa-head {
  display: flex;
  align-items: center;
  gap: 12px;
 }

 .gongfa-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.12);
  color: rgba(37, 99, 235, 0.95);
 }

 .gongfa-main {
  min-width: 0;
 }

 .gongfa-sub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  margin-bottom: 2px;
 }

 .gongfa-name {
  font-size: 16px;
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
 }

 .gongfa-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
  align-items: center;
 }

 .gongfa-kv {
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(15, 23, 42, 0.04);
 }

 .kv-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
 }

 .kv-row:first-child {
  border-top: none;
 }

 .kv-row .k {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
 }

 .kv-row .v {
  font-size: 12px;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.92);
 }

 .card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
 }

 .head-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.92);
 }

 .head-ico {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.12);
  color: rgba(37, 99, 235, 0.95);
  font-size: 13px;
 }

 .head-ico.ok {
  background: rgba(34, 197, 94, 0.14);
  color: rgba(22, 163, 74, 0.95);
 }

 .head-ico.warn {
  background: rgba(245, 158, 11, 0.14);
  color: rgba(180, 83, 9, 0.95);
 }

 .head-right {
  font-weight: 900;
  font-size: 12px;
  color: rgba(37, 99, 235, 0.95);
 }

 .milestones {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
 }

 .pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(15, 23, 42, 0.04);
  color: rgba(15, 23, 42, 0.75);
 }

 .pill-ok {
  border-color: rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.10);
  color: rgba(22, 163, 74, 0.95);
 }

 .next-line {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  text-align: center;
 }

 .next-name {
  color: rgba(37, 99, 235, 0.95);
  font-weight: 900;
 }

 .skill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
 }

 @media (max-width: 860px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }
 }

 .skill-card {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
 }

 .skill-card.unlocked {
  border-color: rgba(34, 197, 94, 0.18);
  background: rgba(34, 197, 94, 0.06);
 }

 .skill-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
 }

 .skill-title {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
  margin: 0;
 }

 .skill-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: rgba(15, 23, 42, 0.65);
 }

 .skill-tag.tag-ok {
  border-color: rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.10);
  color: rgba(22, 163, 74, 0.95);
 }

 .skill-desc {
  color: rgba(15, 23, 42, 0.55);
  font-size: 12px;
 }

 .skill-foot {
  margin-top: 10px;
  font-size: 12px;
 }

 .lock-progress {
  margin-top: 10px;
 }

 .lock-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
 }
</style>
