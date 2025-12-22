<template>
  <div class="rel-root light-surface">
    <div class="body">
      <div class="sidebar">
        <div class="sidebar-title">人物关系</div>

        <div class="search">
          <span class="search-ico muted">🔎</span>
          <input class="input" v-model="searchText" placeholder="搜索人物..." />
        </div>

        <div v-if="filteredPeople.length === 0" class="empty-side">
          <div class="empty-ico">👥</div>
          <div class="empty-title">尚未建立人际关系</div>
          <div class="empty-sub">在游戏中与更多人物互动建立关系</div>
        </div>

        <div v-else class="people-list">
          <button
            v-for="p in filteredPeople"
            :key="p.key"
            type="button"
            class="person"
            :class="{ active: selectedKey === p.key }"
            @click="selectedKey = p.key"
          >
            <div class="person-avatar">{{ avatarText(p.name) }}</div>

            <div class="person-main">
              <div class="person-name-row">
                <div class="person-name">{{ p.name }}</div>
                <span class="pill" v-if="p.follow">关注</span>
              </div>
              <div class="person-sub">
                <span>{{ p.relation || '未定义关系' }}</span>
                <span class="dot">·</span>
                <span>好感 {{ clampFavor(Number(p.favor)) }}</span>
              </div>
              <div class="favor-bar"><div class="favor-fill" :style="{ width: favorPercent(p.favor) + '%' }" /></div>
            </div>
          </button>
        </div>
      </div>

      <div class="main">
        <div v-if="!selectedNpc" class="empty-main">
          <div class="empty-main-ico">👥</div>
          <div class="empty-main-title">选择一个人物查看详细信息</div>
          <div class="empty-main-sub">在游戏中与人物互动会建立关系记录</div>
        </div>

        <div v-else class="detail">
          <div class="detail-header">
            <div class="npc-head">
              <div class="npc-avatar">{{ avatarText(selectedNpc.名字 || selectedKey) }}</div>
              <div class="npc-meta">
                <div class="npc-name">{{ selectedNpc.名字 || selectedKey }}</div>
                <div class="npc-tags">
                  <span class="tag">{{ (selectedNpc.与玩家关系 || '未定义关系') + '' }}</span>
                  <span class="tag favor">好感 {{ clampFavor(Number(selectedNpc.好感度 ?? 0)) }}</span>
                  <span class="tag" v-if="selectedNpc.境界">{{ realmText(selectedNpc) }}</span>
                  <span class="tag" v-if="selectedNpc.种族">{{ selectedNpc.种族 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tabs">
            <button
              v-for="t in tabs"
              :key="t.id"
              type="button"
              class="tab"
              :class="{ active: activeTab === t.id }"
              @click="activeTab = t.id"
            >
              <span class="tab-ico">{{ t.icon }}</span>
              <span class="tab-label">{{ t.label }}</span>
            </button>
          </div>

          <div class="tab-body">
            <div v-show="activeTab === 'basic'" class="tab-panel">
              <div class="card">
                <div class="card-title">基础档案</div>
                <div class="kv">
                  <div class="k">境界</div>
                  <div class="v">{{ realmText(selectedNpc) }}</div>
                </div>
                <div class="kv">
                  <div class="k">年龄</div>
                  <div class="v">{{ npcAge(selectedNpc) }}</div>
                </div>
                <div class="kv">
                  <div class="k">位置</div>
                  <div class="v">{{ selectedNpc.当前位置?.描述 || '-' }}</div>
                </div>
                <div class="kv">
                  <div class="k">性别</div>
                  <div class="v">{{ selectedNpc.性别 || '-' }}</div>
                </div>
                <div class="kv">
                  <div class="k">元婴后期</div>
                  <div class="v">{{ selectedNpc.元婴后期 || '-' }}</div>
                </div>
              </div>

              <div class="card">
                <div class="card-title">外貌与性格</div>
                <div class="quote" v-if="npcPersonalityText">{{ npcPersonalityText }}</div>
                <div v-else class="muted">暂无记录</div>
              </div>

              <div class="card">
                <div class="card-title">天赋六向</div>
                <div class="muted">先天六司</div>
                <div class="six-grid">
                  <div class="six-item" v-for="a in sixAttrs" :key="a.key">
                    <div class="six-k">{{ a.key }}</div>
                    <div class="six-v">{{ a.value }}</div>
                  </div>
                </div>
              </div>

              <div class="card" v-if="recentMemories.length">
                <div class="card-title">最近记忆</div>
                <div class="list">
                  <div v-for="(m, idx) in recentMemories" :key="idx" class="list-item">
                    <div class="li-title">{{ m }}</div>
                  </div>
                </div>
              </div>

              <div class="card bottomline">
                <div class="card-title">人格底线</div>
                <div class="tag-row" v-if="bottomLines.length">
                  <span class="bottomline-tag" v-for="(x, idx) in bottomLines" :key="idx">{{ x }}</span>
                </div>
                <div v-else class="muted">未记录人格底线</div>
                <div class="bottomline-warning">触犯人格底线将导致好感度断崖式下跌（-30 ~ -60），关系破裂且极难修复</div>
              </div>
            </div>

            <div v-show="activeTab === 'status'" class="tab-panel">
              <div class="card">
                <div class="card-title">当前状态（实时）</div>
                <div class="status-grid">
                  <div class="status-card">
                    <div class="status-icon">😶</div>
                    <div class="status-body">
                      <div class="status-label">外貌状态</div>
                      <div class="status-text">{{ selectedNpc.当前外貌状态 || '未知' }}</div>
                    </div>
                  </div>
                  <div class="status-card">
                    <div class="status-icon">💭</div>
                    <div class="status-body">
                      <div class="status-label">内心想法</div>
                      <div class="status-text">{{ selectedNpc.当前内心想法 || '未知' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-title">与玩家关系</div>
                <div class="kv">
                  <div class="k">关系</div>
                  <div class="v">{{ selectedNpc.与玩家关系 || '-' }}</div>
                </div>
                <div class="kv">
                  <div class="k">好感度</div>
                  <div class="v">{{ clampFavor(Number(selectedNpc.好感度 ?? 0)) }}</div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'memory'" class="tab-panel">
              <div class="card">
                <div class="card-title">详细记忆</div>
                <div class="list">
                  <div v-for="m in memoryEntries" :key="m.idx" class="list-item memory-item">
                    <div class="li-title">{{ m.text }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'inventory'" class="tab-panel">
              <div class="card">
                <div class="card-title">背包</div>
                <div class="stones-row">
                  <div class="stone-chip">
                    <div class="stone-label"><span class="stone-ico" aria-hidden="true">{{ getItemTypeIcon('灵石') }}</span>下品灵石</div>
                    <div class="stone-value">{{ npcStones.下品 }}</div>
                  </div>
                  <div class="stone-chip">
                    <div class="stone-label"><span class="stone-ico" aria-hidden="true">{{ getItemTypeIcon('灵石') }}</span>中品灵石</div>
                    <div class="stone-value">{{ npcStones.中品 }}</div>
                  </div>
                  <div class="stone-chip">
                    <div class="stone-label"><span class="stone-ico" aria-hidden="true">{{ getItemTypeIcon('灵石') }}</span>上品灵石</div>
                    <div class="stone-value">{{ npcStones.上品 }}</div>
                  </div>
                  <div class="stone-chip">
                    <div class="stone-label"><span class="stone-ico" aria-hidden="true">{{ getItemTypeIcon('灵石') }}</span>极品灵石</div>
                    <div class="stone-value">{{ npcStones.极品 }}</div>
                  </div>
                </div>

                <div class="inventory-body">
                  <div v-if="npcItems.length === 0" class="inventory-empty">
                    <div class="inventory-empty-ico">📦</div>
                    <div class="muted">此人身上没有物品</div>
                  </div>
                  <div v-else class="items-grid">
                    <div v-for="it in npcItems" :key="it.key" class="item">
                      <div class="item-title">
                        <span class="item-name"><span class="item-type-ico" aria-hidden="true">{{ getItemTypeIcon(it.type, it) }}</span>{{ it.name }}</span>
                        <span class="item-type">{{ it.type }}</span>
                      </div>
                      <div class="item-meta">
                        <span v-if="it.quality">{{ it.quality }}</span>
                        <span v-if="it.qty !== null">x{{ it.qty }}</span>
                      </div>
                      <div v-if="it.desc" class="item-desc">{{ it.desc }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'raw'" class="tab-panel">
              <div class="card">
                <div class="card-title">原始数据(JSON)</div>
                <pre class="raw-pre">{{ JSON.stringify(selectedNpc, null, 2) }}</pre>
              </div>
            </div>

            <div class="card danger" style="margin-top: 12px">
              <div class="card-title">危险操作</div>
              <div class="muted">删除NPC会从人物关系中移除该人物记录。</div>
              <div class="actions">
                <button class="btn btn-danger" type="button" @click="deleteNpc">删除该NPC</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useGameStateStore } from '../stores/useGameStateStore'
import type { TavernCommand } from '../services/tavernCommands'
import { getItemTypeIcon } from '../utils/itemTypeIcon'

const gameState = useGameStateStore()

const searchText = ref('')
const selectedKey = ref('')
type RelTabId = 'basic' | 'status' | 'memory' | 'inventory' | 'raw'
type RelTab = { id: RelTabId; label: string; icon: string }

const activeTab = ref<RelTabId>('basic')

const relationships = computed<Record<string, any>>(() => {
  const r = (gameState as any).人物关系
  if (!r || typeof r !== 'object') return {}
  return r
})

type PersonRow = {
  key: string
  name: string
  relation: string
  favor: number
  follow: boolean
}

const people = computed<PersonRow[]>(() => {
  const out: PersonRow[] = []
  for (const [k, v] of Object.entries(relationships.value || {})) {
    const obj: any = v
    const name = String(obj?.名字 || k)
    const relation = String(obj?.与玩家关系 || '')
    const favorRaw = Number(obj?.好感度 ?? 0)
    const favor = Number.isFinite(favorRaw) ? favorRaw : 0
    const follow = !!obj?.实时关注
    out.push({ key: k, name, relation, favor, follow })
  }
  out.sort((a, b) => (b.follow ? 1 : 0) - (a.follow ? 1 : 0) || b.favor - a.favor || a.name.localeCompare(b.name))
  return out
})

const filteredPeople = computed(() => {
  const q = String(searchText.value || '').trim().toLowerCase()
  if (!q) return people.value
  return people.value.filter(p => `${p.name} ${p.relation}`.toLowerCase().includes(q))
})

const selectedNpc = computed<any>(() => {
  const k = selectedKey.value
  if (!k) return null
  return (relationships.value as any)[k] || null
})

watch(
  () => people.value,
  v => {
    if (!selectedKey.value && v.length > 0) selectedKey.value = v[0].key
  },
  { immediate: true }
)

watch(
  () => selectedKey.value,
  () => {
    activeTab.value = 'basic'
  }
)

const tabs = computed<RelTab[]>(() => {
  return [
    { id: 'basic', label: '基本信息', icon: '📋' },
    { id: 'status', label: '实时状态', icon: '💭' },
    { id: 'memory', label: '记忆档案', icon: '📝' },
    { id: 'inventory', label: '背包', icon: '🎒' },
    { id: 'raw', label: '原始数据', icon: '🔧' }
  ]
})

const memoryEntries = computed(() => {
  const arr: any = selectedNpc.value?.记忆
  if (!Array.isArray(arr)) return []
  return arr.map((x, idx) => ({ idx, text: String(x || '').trim() }))
})

const recentMemories = computed(() => memoryEntries.value.slice(-3).reverse().map(x => x.text).filter(Boolean))

const npcPersonalityText = computed(() => {
  const n: any = selectedNpc.value
  const v = n?.外貌与性格 ?? n?.性格特征 ?? n?.性格 ?? n?.外貌描述 ?? ''
  return String(v || '').trim()
})

const bottomLines = computed<string[]>(() => {
  const v: any = selectedNpc.value?.人格底线
  if (Array.isArray(v)) return v.map((x: any) => String(x)).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return [v.trim()]
  return []
})

const sixAttrs = computed(() => {
  const s: any = selectedNpc.value?.先天六司 || {}
  const keys = ['根骨', '灵性', '悟性', '体魄', '魅力', '心性']
  return keys.map((k) => ({ key: k, value: String(s?.[k] ?? '-') }))
})

const npcStones = computed(() => {
  const n: any = selectedNpc.value
  const bag: any = n?.背包
  const stones: any = bag?.灵石 ?? n?.灵石 ?? {}
  return {
    下品: Number(stones?.下品 ?? 0) || 0,
    中品: Number(stones?.中品 ?? 0) || 0,
    上品: Number(stones?.上品 ?? 0) || 0,
    极品: Number(stones?.极品 ?? 0) || 0
  }
})

const npcItems = computed(() => {
  const n: any = selectedNpc.value
  const bag: any = n?.背包
  const itemsRaw: any = bag?.物品 ?? bag?.items ?? bag
  if (!itemsRaw) return []

  const out = []

  if (Array.isArray(itemsRaw)) {
    for (const it of itemsRaw) {
      if (!it) continue
      const name = String(it.name ?? it.名称 ?? it.物品名 ?? '').trim()
      if (!name) continue
      out.push({
        key: `${name}_${out.length}`,
        name,
        type: String(it.type ?? it.类型 ?? it.分类 ?? '').trim(),
        qty: Number.isFinite(Number(it.qty ?? it.数量)) ? Math.max(0, Math.floor(Number(it.qty ?? it.数量))) : null,
        quality: String(it.quality ?? it.品级 ?? it.品质 ?? '').trim(),
        desc: String(it.desc ?? it.描述 ?? '').trim()
      })
    }
    return out
  }

  if (typeof itemsRaw === 'object') {
    for (const [k, v] of Object.entries(itemsRaw)) {
      const it: any = v
      if (!it || typeof it !== 'object') continue
      const name = String(it.name ?? it.名称 ?? it.物品名 ?? k).trim()
      if (!name) continue
      out.push({
        key: k,
        name,
        type: String(it.type ?? it.类型 ?? it.分类 ?? '').trim(),
        qty: Number.isFinite(Number(it.qty ?? it.数量)) ? Math.max(0, Math.floor(Number(it.qty ?? it.数量))) : null,
        quality: String(it.quality ?? it.品级 ?? it.品质 ?? '').trim(),
        desc: String(it.desc ?? it.描述 ?? '').trim()
      })
    }
    return out
  }

  return []
})

function avatarText(name: string) {
  const s = String(name || '').trim()
  if (!s) return '？'
  return s.slice(0, 1)
}

function favorPercent(n: number) {
  const v = clampFavor(Number(n ?? 0))
  return Math.round(((v + 100) / 200) * 100)
}

function realmText(npc: any) {
  const v = npc?.境界
  if (!v) return '未知'
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    const n = String(v.名称 || '').trim()
    const s = String(v.阶段 || '').trim()
    if (n) return s ? `${n}${s}` : n
  }
  return '未知'
}

function npcAge(npc: any) {
  const explicit = Number(npc?.年龄)
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit)

  const birth = npc?.出生日期
  const now = (gameState as any).游戏时间
  const by = Number(birth?.年)
  const ny = Number(now?.年)
  if (!Number.isFinite(by) || !Number.isFinite(ny)) return '-'
  const age = ny - by
  if (!Number.isFinite(age)) return '-'
  return Math.max(0, Math.floor(age))
}

function deleteNpc() {
  if (!selectedKey.value) return
  const name = String(selectedNpc.value?.名字 || selectedKey.value)
  const ok = window.confirm(`确定删除 NPC：${name} ？`)
  if (!ok) return
  const cmds: TavernCommand[] = [{ action: 'delete', key: `人物关系.${selectedKey.value}`, value: null }]
  gameState.applyCommands(cmds)
  selectedKey.value = ''
}

function clampFavor(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(-100, Math.min(100, Math.floor(n)))
}

</script>

<style scoped>
.rel-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  min-height: 520px;
}

@media (max-width: 860px) {
  .body {
    grid-template-columns: 1fr;
  }
}

.sidebar {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(96, 165, 250, 0.95);
}

.search {
  position: relative;
}

.search-ico {
  position: absolute;
  left: 10px;
  top: 8px;
}

.input {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  color: var(--color-text);
  border-radius: 10px;
  padding: 8px 10px;
  width: 100%;
}

.search .input {
  padding-left: 34px;
}

.people-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  max-height: 420px;
}

.person {
  text-align: left;
  width: 100%;
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.35);
  border-radius: 12px;
  padding: 10px;
  color: var(--color-text);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}

.person.active {
  border-color: rgba(59, 130, 246, 0.7);
}

.person-name {
  font-weight: 800;
  margin-bottom: 4px;
}

.person-sub {
  color: var(--color-text-secondary);
  font-size: 12px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot {
  opacity: 0.5;
}

.pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.03);
}

.empty-side {
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  padding: 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 260px;
}

.empty-ico {
  font-size: 48px;
  color: rgba(148, 163, 184, 0.9);
}

.empty-title {
  font-weight: 800;
}

.empty-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.25);
  border-radius: 12px;
  padding: 10px;
}

.stat-value {
  font-weight: 900;
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.main {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  padding: 14px;
}

.empty-main {
  min-height: 520px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-main-ico {
  font-size: 64px;
  color: rgba(148, 163, 184, 0.9);
}

.empty-main-title {
  font-weight: 800;
  font-size: 18px;
}

.empty-main-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.card {
  border: 1px solid var(--color-border);
  background: rgba(2, 6, 23, 0.25);
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  font-weight: 800;
  margin-bottom: 10px;
}

.kv {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.kv:last-child {
  border-bottom: none;
}

.k {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.v {
  font-size: 13px;
}

.muted {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
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
  background: rgba(127, 29, 29, 0.35);
}

.danger {
  border-color: rgba(248, 113, 113, 0.4);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 10px;
}

.li-title {
  font-size: 13px;
}

.icon {
  font-size: 14px;
}

.body {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
  gap: 0;
  background: var(--panel-bg);
}

@media (max-width: 860px) {
  .body {
    gap: 12px;
    border: none;
    border-radius: 0;
  }
 }

 .sidebar {
  border: none;
  border-right: 1px solid var(--panel-border);
  border-radius: 0;
  background: transparent;
 }

 .sidebar-title {
  color: rgba(37, 99, 235, 0.95);
 }

 .input {
  background: var(--surface-3);
  border-color: var(--panel-border);
  color: var(--text-1);
 }

 .search-ico {
  color: rgba(15, 23, 42, 0.45);
 }

 .people-list {
  max-height: none;
 }

 .person {
  background: rgba(248, 250, 252, 0.95);
  border-color: var(--panel-border);
  color: var(--text-1);
 }

 .person.active {
  border-color: rgba(37, 99, 235, 0.65);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
 }

 .person-sub {
  color: var(--text-3);
 }

 .pill {
  border-color: var(--panel-border);
  background: var(--surface-3);
  color: var(--text-2);
 }

 .empty-side {
  border-color: var(--panel-border);
  background: rgba(248, 250, 252, 0.95);
 }

 .empty-title {
  color: var(--text-1);
 }

 .empty-sub {
  color: var(--text-3);
 }

 .main {
  border: none;
  border-radius: 0;
  background: rgba(248, 250, 252, 0.95);
 }

 .empty-main {
  min-height: 520px;
 }

 .empty-main-title {
  color: var(--text-1);
 }

 .empty-main-sub {
  color: var(--text-3);
 }

 .card {
  background: rgba(255, 255, 255, 0.92);
  border-color: var(--panel-border);
 }

 .k {
  color: var(--text-3);
 }

 .muted {
  color: var(--text-3);
 }

 .btn {
  border-color: rgba(37, 99, 235, 0.95);
  background: rgba(37, 99, 235, 0.95);
  color: #fff;
 }

 .btn-ghost {
  background: var(--surface-3);
  border-color: var(--panel-border);
  color: var(--text-1);
 }

 .btn-danger {
  border-color: rgba(220, 38, 38, 0.85);
  background: rgba(220, 38, 38, 0.85);
  color: #fff;
 }

 .person-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.95);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex: 0 0 auto;
 }

 .person {
  justify-content: flex-start;
  align-items: center;
 }

 .person-main {
  flex: 1;
  min-width: 0;
 }

 .person-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
 }

 .favor-bar {
  margin-top: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
 }

 .favor-fill {
  height: 100%;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.85);
 }

 .detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
 }

 .detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
 }

 .npc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
 }

 .npc-avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.95);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex: 0 0 auto;
 }

 .npc-meta {
  min-width: 0;
 }

 .npc-name {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-1);
  line-height: 1.1;
 }

 .npc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
 }

 .tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-2);
 }

 .tag.favor {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
  color: rgba(21, 128, 61, 0.95);
 }

 .header-tools {
  display: flex;
  align-items: center;
  gap: 8px;
 }

 .icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  cursor: pointer;
 }

 .icon-btn:hover {
  border-color: rgba(37, 99, 235, 0.55);
 }

 .icon-btn.danger {
  border-color: rgba(220, 38, 38, 0.35);
 }

 .tabs {
  display: flex;
  gap: 10px;
  border-bottom: 1px solid var(--panel-border);
  padding-bottom: 8px;
  overflow: auto;
 }

 .tab {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-2);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
 }

 .tab:hover {
  background: rgba(37, 99, 235, 0.06);
 }

 .tab.active {
  border-color: rgba(37, 99, 235, 0.35);
  background: rgba(37, 99, 235, 0.08);
  color: rgba(37, 99, 235, 0.95);
 }

 .tab-ico {
  font-size: 14px;
 }

 .tab-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
 }

 .tab-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
 }

 .quote {
  border-left: 4px solid rgba(168, 85, 247, 0.55);
  background: rgba(168, 85, 247, 0.08);
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-1);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
 }

 .six-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
 }

 @media (max-width: 980px) {
  .six-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
 }

 @media (max-width: 520px) {
  .six-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 .six-item {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
 }

 .six-k {
  color: var(--text-3);
  font-size: 12px;
 }

 .six-v {
  margin-top: 6px;
  font-weight: 900;
  color: rgba(37, 99, 235, 0.95);
 }

 .tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
 }

 .bottomline-tag {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.1);
  color: rgba(185, 28, 28, 0.95);
 }

 .bottomline-warning {
  margin-top: 10px;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.12);
  color: rgba(185, 28, 28, 0.95);
  font-size: 12px;
  line-height: 1.5;
 }

 .pagination {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
 }

 .page-info {
  color: var(--text-3);
  font-size: 12px;
 }

 .jump {
  display: inline-flex;
  align-items: center;
  gap: 8px;
 }

 .jump .input {
  width: 90px;
 }

 .items-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
 }

 @media (max-width: 560px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
 }

 .item {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 12px;
 }

 .item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
 }

 .item-name {
  font-weight: 900;
  color: var(--text-1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
 }

 .item-type-ico {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.06);
  border: 1px solid var(--panel-border);
  font-size: 14px;
 }

 .item-type {
  font-size: 12px;
  color: var(--text-3);
 }

 .item-meta {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  color: var(--text-3);
  font-size: 12px;
 }

 .item-desc {
  margin-top: 8px;
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
 }

 .raw-pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px;
  color: var(--text-1);
  overflow: auto;
 }

 .status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
 }

 .status-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid var(--panel-border);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  padding: 12px;
 }

 .status-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
 }

 .status-label {
  color: var(--text-3);
  font-size: 12px;
 }

 .status-text {
  margin-top: 4px;
  color: var(--text-1);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
 }

 .section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
 }

 .section-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
 }

 .count-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-2);
 }

 .memory-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
 }

 .memory-actions {
  display: inline-flex;
  gap: 8px;
  flex: 0 0 auto;
 }

 .mini-btn {
  border: 1px solid var(--panel-border);
  background: var(--surface-3);
  color: var(--text-1);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
 }

 .mini-btn.danger {
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(248, 113, 113, 0.12);
  color: rgba(185, 28, 28, 0.95);
 }

 .memory-editor {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  padding: 10px;
  color: var(--text-1);
 }

 .stones-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
 }

 @media (max-width: 980px) {
  .stones-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 .stone-chip {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
 }

 .stone-label {
  color: var(--text-3);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
 }

 .stone-ico {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: rgba(15, 23, 42, 0.06);
  font-size: 14px;
 }

 .stone-value {
  font-weight: 900;
  color: rgba(37, 99, 235, 0.95);
 }

 .inventory-body {
  margin-top: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 14px;
 }

 .inventory-empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 140px;
 }

 .inventory-empty-ico {
  font-size: 26px;
  opacity: 0.6;
 }
</style>
