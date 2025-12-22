<template>
  <div class="wrap">
    <div class="surface tabbar-surface">
      <div class="tabbar">
        <button class="tab" type="button" :class="{ active: activeTab === 'items' }" @click="activeTab = 'items'">
          <span class="tab-icon">📦</span>
          <span>物品</span>
        </button>
        <button class="tab" type="button" :class="{ active: activeTab === 'equipment' }" @click="activeTab = 'equipment'">
          <span class="tab-icon">🗡️</span>
          <span>装备</span>
        </button>
        <button class="tab" type="button" :class="{ active: activeTab === 'spiritstones' }" @click="activeTab = 'spiritstones'">
          <span class="tab-icon">💎</span>
          <span>灵石</span>
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'equipment'" class="surface panel">
      <div class="eq-layout">
        <div class="eq-list">
          <div class="grid-eq">
            <button v-for="slot in equipmentSlots" :key="slot" class="eq-slot" type="button" @click="selectEquipmentSlot(slot)">
              <div class="eq-title"><span class="eq-ico" aria-hidden="true">{{ getItemTypeIcon('装备') }}</span>{{ slot }}</div>
              <div class="eq-body">
                <div v-if="equipmentRef(slot)" class="eq-filled">
                  <div class="eq-name">{{ equipmentRef(slot)?.名称 || '未知装备' }}</div>
                  <div class="eq-sub">点击查看详情</div>
                </div>
                <div v-else class="eq-empty">
                  <div class="eq-empty-name">空槽位</div>
                  <div class="eq-sub">可装备装备</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="detail" v-if="selectedItem">
        <div class="detail-title">{{ selectedItemName }}</div>
        <div class="detail-sub">{{ selectedItemTypeText }}</div>
        <pre class="detail-json">{{ safeStringify(selectedItem) }}</pre>
        <div class="actions">
          <button v-if="selectedEquipSlot" class="btn" type="button" @click="unequipFromSlot(selectedEquipSlot)">卸下</button>
          <button class="btn btn-ghost" type="button" @click="discardSelected">丢弃</button>
        </div>
      </div>
      <div v-else class="detail muted">选择装备槽位查看详情</div>
    </div>

    <div v-else-if="activeTab === 'items'" class="surface panel">
      <div class="toolbar">
        <div class="search">
          <input class="input" type="text" v-model.trim="searchText" placeholder="搜索物品..." />
        </div>
        <div class="filters">
          <select class="select" v-model="typeFilter">
            <option value="all">物品</option>
            <option value="装备">装备</option>
            <option value="功法">功法</option>
            <option value="其他">其他</option>
          </select>
          <select class="select" v-model="sortMode">
            <option value="default">默认排序</option>
            <option value="quality">品质排序</option>
            <option value="name">名称排序</option>
            <option value="count">数量排序</option>
          </select>
          <button class="icon-btn" type="button" title="刷新" @click="resetFilters">↻</button>
        </div>
      </div>

      <div class="items-layout">
        <div class="items-list">
          <div class="items-grid">
            <button v-for="it in visibleItems" :key="it.key" class="item-card" type="button" :class="{ selected: selectedKey === it.key }" @click="selectItem(it.key)">
              <div class="item-top">
                <div class="item-badge">{{ it.qualityTop }}</div>
                <div class="item-count">x{{ it.count }}</div>
              </div>
              <div class="item-icon" aria-hidden="true">{{ getItemTypeIcon(it.type, it.value) }}</div>
              <div class="item-name">{{ it.name }}</div>
              <div class="item-tags">
                <span class="tag">{{ it.type }}</span>
                <span class="tag tag-ok">{{ it.qualitySub }}</span>
              </div>
            </button>
            <div v-if="visibleItems.length === 0" class="muted" style="padding: 10px">暂无物品</div>
          </div>
        </div>

        <div class="detail" v-if="selectedItem">
          <div class="detail-title">{{ selectedItemName }}</div>
          <div class="detail-sub">{{ selectedItemTypeText }}</div>
          <div class="detail-meta">
            <div class="kv"><span class="k">数量</span><span class="v">{{ selectedItemCount }}</span></div>
            <div class="kv"><span class="k">品质</span><span class="v">{{ selectedQualityText }}</span></div>
          </div>
          <div v-if="(selectedItem as any)?.描述" class="detail-desc">{{ String((selectedItem as any).描述) }}</div>

          <div class="actions">
            <button v-if="canUse" class="btn" type="button" @click="useSelected">使用</button>

            <template v-if="isEquip">
              <button v-if="!selectedEquipSlot" class="btn" type="button" :disabled="!hasEmptySlot" @click="equipSelectedAuto">装备</button>
              <button v-else class="btn" type="button" @click="unequipFromSlot(selectedEquipSlot)">卸下</button>
            </template>

            <template v-if="isGongfa">
              <button v-if="!isGongfaEquipped" class="btn" type="button" @click="equipGongfa">装备功法</button>
              <button v-else class="btn" type="button" @click="unequipGongfa">卸下功法</button>
              <button v-if="isGongfaEquipped" class="btn btn-ghost" type="button" @click="cultivateGongfa">修炼+10</button>
            </template>

            <button class="btn btn-ghost" type="button" @click="discardSelected">丢弃</button>
          </div>

          <details class="raw">
            <summary>查看数据</summary>
            <pre class="detail-json">{{ safeStringify(selectedItem) }}</pre>
          </details>

          <div v-if="tip" class="tip">{{ tip }}</div>
        </div>

        <div v-else class="detail detail-empty">
          <div class="empty-box" aria-hidden="true"></div>
          <div class="muted">选择物品查看更多详情</div>
        </div>
      </div>
    </div>

    <div v-else class="surface panel">
      <div class="sp-grid">
        <div v-for="s in spiritStoneCards" :key="s.key" class="sp-card">
          <div class="sp-icon" aria-hidden="true">{{ getItemTypeIcon('灵石') }}</div>
          <div class="sp-name">{{ s.name }}</div>
          <div class="sp-count">{{ s.count }}</div>
          <div class="sp-actions">
            <button class="btn btn-ghost" type="button" disabled>↑ 兑换</button>
            <button class="btn btn-ghost" type="button" disabled>↓ 分解</button>
          </div>
        </div>
      </div>
      <div class="muted" style="margin-top: 10px">灵石兑换/分解暂未实现（已保留 UI 入口）</div>
    </div>

    <div v-if="qtyDialog.visible" class="qty-mask" @click.self="closeQtyDialog">
      <div class="qty-dialog" @click.stop>
        <div class="qty-head">
          <div class="qty-head-title">{{ qtyDialog.title }}</div>
          <button class="qty-head-close" type="button" @click="closeQtyDialog">×</button>
        </div>

        <div class="qty-card">
          <div class="qty-card-icon">{{ qtyDialog.icon }}</div>
          <div class="qty-card-info">
            <div class="qty-card-name">{{ qtyDialog.itemName }}</div>
            <div class="qty-card-type">{{ qtyDialog.itemType }}</div>
            <div class="qty-card-usable">可用数量：{{ qtyDialog.max }}</div>
            <div class="qty-card-desc">{{ qtyDialog.itemDesc }}</div>
          </div>
        </div>

        <div class="qty-section">
          <div class="qty-label">{{ qtyDialog.countLabel }}：</div>
          <div class="qty-stepper">
            <button class="qty-step-btn" type="button" @click="decQty" :disabled="qtyDialog.count <= 1">-</button>
            <input class="qty-step-value" type="number" v-model.number="qtyDialog.count" :min="1" :max="qtyDialog.max" />
            <button class="qty-step-btn" type="button" @click="incQty" :disabled="qtyDialog.count >= qtyDialog.max">+</button>
          </div>
          <div class="qty-quick">
            <button class="qty-quick-btn" type="button" @click="setQtyOne">1个</button>
            <button class="qty-quick-btn" type="button" @click="setQtyAll">全部</button>
          </div>
        </div>

        <div class="qty-footer">
          <button class="btn btn-ghost" type="button" @click="closeQtyDialog">取消</button>
          <button class="btn btn-primary" type="button" @click="confirmQtyAction">{{ qtyDialog.confirmText }}</button>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.visible" class="qty-mask" @click.self="closeConfirmDialog">
      <div class="confirm-dialog" @click.stop>
        <div class="qty-head">
          <div class="qty-head-title">{{ confirmDialog.title }}</div>
          <button class="qty-head-close" type="button" @click="closeConfirmDialog">×</button>
        </div>
        <div class="confirm-body">{{ confirmDialog.message }}</div>
        <div class="qty-footer">
          <button class="btn btn-ghost" type="button" @click="closeConfirmDialog">取消</button>
          <button class="btn btn-primary" type="button" @click="confirmConfirmDialog">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useGameStateStore } from '../stores/useGameStateStore'
import { useActionQueueStore } from '../stores/useActionQueueStore'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useUndoStore } from '../stores/useUndoStore'
import { useUIStore } from '../stores/useUIStore'
import { getItemTypeIcon } from '../utils/itemTypeIcon'
import {
  EQUIPMENT_SLOTS,
  buildCultivateGongfaCommands,
  buildEquipCommands,
  buildEquipGongfaCommands,
  buildUnequipCommands,
  buildUnequipGongfaCommands,
  buildUseItemCommands,
  findEquipmentSlotByItemId,
  firstEmptyEquipmentSlot,
  normalizeItemQuantity,
  qualityLabel
} from '../services/inventory'

const gameState = useGameStateStore()
const actionQueueStore = useActionQueueStore()
const characterStore = useCharacterStore()
const undoStore = useUndoStore()
const uiStore = useUIStore()

type TabKey = 'items' | 'equipment' | 'spiritstones'
const activeTab = ref<TabKey>('items')

const searchText = ref('')
const typeFilter = ref<'all' | string>('all')
const sortMode = ref<'default' | 'quality' | 'name' | 'count'>('default')

const selectedKey = ref<string>('')
const tip = ref('')

const qtyDialog = ref({
  visible: false,
  mode: 'use' as 'use' | 'discard',
  title: '使用物品',
  countLabel: '使用数量',
  confirmText: '确定使用',
  itemKey: '',
  itemName: '',
  itemType: '',
  itemDesc: '',
  icon: '',
  max: 1,
  count: 1
})

const confirmDialog = ref({
  visible: false,
  title: '丢弃物品',
  message: '',
  onConfirm: null as null | (() => Promise<void> | void)
})

const equipmentSlots = EQUIPMENT_SLOTS

const bagItems = computed(() => {
  const items = (gameState.背包 as any)?.物品
  if (!items || typeof items !== 'object') return {} as Record<string, any>
  return items as Record<string, any>
})

const selectedItem = computed(() => {
  const key = selectedKey.value
  if (!key) return null
  return bagItems.value[key] || null
})

const selectedItemName = computed(() => String((selectedItem.value as any)?.名称 || selectedKey.value || ''))
const selectedItemCount = computed(() => (selectedItem.value ? normalizeItemQuantity(selectedItem.value) : 0))
const selectedItemTypeText = computed(() => {
  const raw = String((selectedItem.value as any)?.类型 || '')
  const t = raw === '装备' || raw === '功法' ? raw : '其他'
  return t ? `类型：${t}` : '类型：未知'
})
const selectedQualityText = computed(() => {
  const q = (selectedItem.value as any)?.品质
  const l = qualityLabel(q)
  return `${l.top}·${l.sub}`
})

const selectedEquipSlot = computed(() => {
  const it = selectedItem.value
  if (!it) return null
  const id = String(selectedKey.value || '')
  const byKey = findEquipmentSlotByItemId((gameState as any).装备栏, id)
  if (byKey) return byKey
  const legacyId = String((it as any)?.物品ID || '')
  if (!legacyId) return null
  return findEquipmentSlotByItemId((gameState as any).装备栏, legacyId)
})

const hasEmptySlot = computed(() => !!firstEmptyEquipmentSlot((gameState as any).装备栏))

const isEquip = computed(() => String((selectedItem.value as any)?.类型) === '装备')
const isGongfa = computed(() => String((selectedItem.value as any)?.类型) === '功法')
const isGongfaEquipped = computed(() => !!(selectedItem.value as any)?.已装备)

function isUsableItem(item: any): boolean {
  if (!item || typeof item !== 'object') return false
  // 原版逻辑：背包“直接使用”仅允许类型=其他
  return String((item as any)?.类型 || '') === '其他'
}

function closeQtyDialog() {
  qtyDialog.value.visible = false
  qtyDialog.value.mode = 'use'
  qtyDialog.value.title = '使用物品'
  qtyDialog.value.countLabel = '使用数量'
  qtyDialog.value.confirmText = '确定使用'
  qtyDialog.value.itemKey = ''
  qtyDialog.value.itemName = ''
  qtyDialog.value.itemType = ''
  qtyDialog.value.itemDesc = ''
  qtyDialog.value.icon = ''
  qtyDialog.value.max = 1
  qtyDialog.value.count = 1
}

function closeConfirmDialog() {
  confirmDialog.value.visible = false
  confirmDialog.value.title = '丢弃物品'
  confirmDialog.value.message = ''
  confirmDialog.value.onConfirm = null
}

function clampQty() {
  const max = Number(qtyDialog.value.max || 1)
  const n = Math.floor(Number(qtyDialog.value.count) || 1)
  qtyDialog.value.count = Math.max(1, Math.min(max, n))
}

function decQty() {
  qtyDialog.value.count = Math.max(1, Math.floor(Number(qtyDialog.value.count) || 1) - 1)
  clampQty()
}

function incQty() {
  qtyDialog.value.count = Math.floor(Number(qtyDialog.value.count) || 1) + 1
  clampQty()
}

function setQtyOne() {
  qtyDialog.value.count = 1
}

function setQtyAll() {
  qtyDialog.value.count = Number(qtyDialog.value.max || 1)
  clampQty()
}

async function confirmQtyAction() {
  const key = String(qtyDialog.value.itemKey || '')
  const max = Number(qtyDialog.value.max || 1)
  const n = Math.max(1, Math.min(max, Math.floor(Number(qtyDialog.value.count) || 1)))
  const mode = qtyDialog.value.mode
  closeQtyDialog()
  if (mode === 'discard') {
    await discardSelectedWithCount(n, key)
  } else {
    await useSelectedWithCount(n, key)
  }
}

async function confirmConfirmDialog() {
  const fn = confirmDialog.value.onConfirm
  closeConfirmDialog()
  if (fn) await fn()
}

const canUse = computed(() => {
  const it = selectedItem.value as any
  if (!it) return false
  if (selectedItemCount.value <= 0) return false
  return isUsableItem(it)
})

const visibleItems = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  const type = typeFilter.value

  const qualityRank = (quality: any): number => {
    const v = String(quality?.quality ?? '凡')
    if (v === '凡' || v === '凡阶') return 1
    if (v === '黄' || v === '黄阶') return 2
    if (v === '玄' || v === '玄阶') return 3
    if (v === '地' || v === '地阶') return 4
    if (v === '天' || v === '天阶') return 5
    if (v === '仙' || v === '仙阶') return 6
    if (v === '神' || v === '神阶') return 7
    return 1
  }

  const list = Object.entries(bagItems.value)
    .filter(([, v]) => {
      if (!v || typeof v !== 'object') return true
      const hasName = (v as any).名称 != null
      const hasType = (v as any).类型 != null
      if (hasName || hasType) return true

      const keys = Object.keys(v as any)
      if (keys.length === 0) return false
      const onlyFlags = keys.every(x => ['已装备', '修炼中', '修炼进度', '已解锁技能'].includes(x))
      return !onlyFlags
    })
    .map(([k, v]) => {
      const name = String((v as any)?.名称 || k)
      const rawType = String((v as any)?.类型 || '其他')
      const t = rawType === '装备' || rawType === '功法' ? rawType : '其他'
      const count = normalizeItemQuantity(v)
      const labels = qualityLabel((v as any)?.品质)
      const grade = typeof (v as any)?.品质?.grade === 'number' ? Number((v as any).品质.grade) : 0
      const rank = qualityRank((v as any)?.品质)
      return { key: k, value: v, name, type: t, count, qualityTop: labels.top, qualitySub: labels.sub, grade, rank }
    })

  let filtered = list

  if (type !== 'all') filtered = filtered.filter(x => x.type === type)
  if (q) filtered = filtered.filter(x => x.name.toLowerCase().includes(q) || x.key.toLowerCase().includes(q))

  if (sortMode.value === 'name') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortMode.value === 'count') {
    filtered = [...filtered].sort((a, b) => b.count - a.count)
  } else if (sortMode.value === 'quality') {
    filtered = [...filtered].sort((a: any, b: any) => (b.rank - a.rank) || (b.grade - a.grade))
  }

  return filtered
})

const spiritStoneCards = computed(() => {
  const stones = (gameState.背包 as any)?.灵石 || {}
  const get = (k: string) => Number((stones as any)?.[k] ?? 0) || 0
  return [
    { key: '极品', name: '极品灵石', count: get('极品') },
    { key: '上品', name: '上品灵石', count: get('上品') },
    { key: '中品', name: '中品灵石', count: get('中品') },
    { key: '下品', name: '下品灵石', count: get('下品') }
  ]
})

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function resetFilters() {
  searchText.value = ''
  typeFilter.value = 'all'
  sortMode.value = 'default'
  tip.value = ''
}

function selectItem(key: string) {
  selectedKey.value = key
  tip.value = ''
}

function selectEquipmentSlot(slot: any) {
  const ref = (gameState as any).装备栏?.[slot]
  const id = ref && typeof ref === 'object' ? String((ref as any).物品ID || '') : ''
  if (id) {
    if ((bagItems.value as any)[id]) {
      selectedKey.value = id
    } else {
      const found = Object.entries(bagItems.value).find(([, v]) => String((v as any)?.物品ID || '') === id)
      selectedKey.value = found ? found[0] : ''
    }
  } else {
    selectedKey.value = ''
  }
  tip.value = ''
}

function equipmentRef(slot: any) {
  return (gameState as any).装备栏?.[slot] || null
}

function apply(cmds: any[]) {
  if (!cmds || cmds.length === 0) return
  gameState.applyCommands(cmds)
}

function useSelected() {
  const item = selectedItem.value
  if (!item) return
  const id = String(selectedKey.value || '')
  const prev = normalizeItemQuantity(item)
  if (!id || prev <= 0) return
  if (!isUsableItem(item)) {
    uiStore.showToast('该物品无法直接使用', 'error')
    return
  }

  if (prev > 1) {
    qtyDialog.value.visible = true
    qtyDialog.value.mode = 'use'
    qtyDialog.value.title = '使用物品'
    qtyDialog.value.countLabel = '使用数量'
    qtyDialog.value.confirmText = '确定使用'
    qtyDialog.value.itemKey = id
    qtyDialog.value.itemName = String((item as any)?.名称 || id)
    qtyDialog.value.itemType = String((item as any)?.类型 || '其他')
    qtyDialog.value.icon = getItemTypeIcon(String((item as any)?.类型 || '其他'))
    qtyDialog.value.itemDesc =
      (String((item as any)?.类型 || '') === '其他' ? String((item as any)?.使用效果 || '') : '') || '暂无特殊效果'
    qtyDialog.value.max = prev
    qtyDialog.value.count = 1
    return
  }

  void useSelectedWithCount(1, id)
}

async function useSelectedWithCount(count: number, itemKey: string) {
  const item = (bagItems.value as any)[itemKey]
  if (!item) return
  const id = String(itemKey || '')
  const prev = normalizeItemQuantity(item)
  const n = Math.max(1, Math.min(prev, Math.floor(Number(count) || 1)))
  if (!id || prev <= 0 || n <= 0) return
  if (!isUsableItem(item)) {
    uiStore.showToast('该物品无法直接使用', 'error')
    return
  }

  try {
    const itemSnapshot = JSON.parse(JSON.stringify(item))
    // 对齐原版：先消耗物品，然后把“使用了什么”放入行动队列，让下一轮AI结算效果
    apply(buildUseItemCommands(id, n, prev))

    const effectText =
      String((item as any)?.类型 || '') === '其他' && '使用效果' in (item as any)
        ? String((item as any).使用效果)
        : String((item as any)?.描述 || '无特殊效果')

    actionQueueStore.addAction({
      type: 'use',
      itemName: String((item as any)?.名称 || id),
      itemType: String((item as any)?.类型 || ''),
      description: `使用了 ${n} 个《${String((item as any)?.名称 || id)}》（效果：${effectText}）`,
      payload: {
        kind: 'use_item',
        itemId: id,
        quantity: n,
        consumed: true,
        prevQuantity: prev,
        itemData: itemSnapshot
      }
    })

    // 原版：使用后立即持久化
    await characterStore.saveCurrentGame(undefined, undefined, { toast: false })

    // 撤销记录
    undoStore.push({
      type: 'use',
      itemId: id,
      itemName: String((item as any)?.名称 || id),
      restoreData: { originalQuantity: prev },
      itemData: itemSnapshot
    })

    // 原版：使用成功后清空选中物品
    selectedKey.value = ''
    uiStore.showToast('使用物品成功', 'success')
  } catch (e) {
    void e
    uiStore.showToast('使用物品失败', 'error')
  }
}

async function discardSelectedWithCount(count: number, itemKey: string) {
  const item = (bagItems.value as any)[itemKey]
  if (!item) return
  const id = String(itemKey || '')
  if (!id) return

  const prev = normalizeItemQuantity(item)
  const n = Math.max(1, Math.min(prev, Math.floor(Number(count) || 1)))
  if (prev <= 0 || n <= 0) return

  const willRemove = prev <= n
  const itemName = String((item as any)?.名称 || id)
  const itemSnapshot = JSON.parse(JSON.stringify(item))

  try {
    const cmds: any[] = []

    if (willRemove) {
      const legacyId = String((item as any)?.物品ID || '')
      const eqSlot =
        findEquipmentSlotByItemId((gameState as any).装备栏, id) ||
        (legacyId ? findEquipmentSlotByItemId((gameState as any).装备栏, legacyId) : null)
      if (eqSlot) {
        cmds.push(...buildUnequipCommands({ ...item, 物品ID: id }, eqSlot))
      }

      if (String((item as any)?.类型) === '功法' && (item as any)?.已装备) {
        cmds.push(...buildUnequipGongfaCommands({ ...item, 物品ID: id }))
      }

      cmds.push({ action: 'delete', key: `背包.物品.${id}`, value: null })
    } else {
      const next = { ...item, 数量: prev - n }
      cmds.push({ action: 'set', key: `背包.物品.${id}`, value: next })
    }

    apply(cmds)
    // 原版：丢弃后立刻保存
    await characterStore.saveCurrentGame(undefined, undefined, { toast: false })

    // 撤销记录（全丢弃与部分丢弃都存快照）
    undoStore.push({
      type: 'discard',
      itemId: id,
      itemName,
      restoreData: { originalQuantity: prev },
      itemData: itemSnapshot
    })

    // 原版：丢弃后清空选中物品
    selectedKey.value = ''

    if (willRemove) {
      uiStore.showToast(`已丢弃《${itemName}》`, 'success')
    } else {
      uiStore.showToast(`已丢弃 ${n} 个《${itemName}》`, 'success')
    }
  } catch (e) {
    void e
    uiStore.showToast('丢弃物品失败', 'error')
  }
}

async function equipSelectedAuto() {
  const item = selectedItem.value
  if (!item) return
  const id = String(selectedKey.value || '')
  if (!id) return

  const slot = firstEmptyEquipmentSlot((gameState as any).装备栏)
  if (!slot) {
    tip.value = '装备栏已满'
    return
  }

  const currentSlotItem = (gameState as any).装备栏?.[slot]
  const itemSnapshot = JSON.parse(JSON.stringify(item))
  apply(buildEquipCommands({ ...item, 物品ID: id }, slot))
  await characterStore.saveCurrentGame(undefined, undefined, { toast: false })
  undoStore.push({
    type: 'equip',
    itemId: id,
    itemName: String((item as any)?.名称 || id),
    restoreData: {
      slot,
      replacedItem: currentSlotItem ? { ...currentSlotItem } : null
    },
    itemData: itemSnapshot
  })
  actionQueueStore.addAction({
    type: 'equip',
    itemName: String((item as any)?.名称 || id),
    itemType: String((item as any)?.类型 || '装备'),
    description: `装备了《${String((item as any)?.名称 || id)}》`,
    payload: {
      kind: 'equip_item',
      op: 'equip',
      slot,
      itemId: id,
      itemData: itemSnapshot
    }
  })
  tip.value = `已装备至${slot}`
}

async function unequipFromSlot(slot: any) {
  const ref = (gameState as any).装备栏?.[slot]
  const itemId = ref && typeof ref === 'object' ? String((ref as any).物品ID || '') : ''
  if (!itemId) return
  let bagKey = itemId
  let item = bagItems.value[bagKey]
  if (!item) {
    const found = Object.entries(bagItems.value).find(([, v]) => String((v as any)?.物品ID || '') === itemId)
    if (found) {
      bagKey = found[0]
      item = found[1]
    }
  }
  if (!item) return
  const itemSnapshot = JSON.parse(JSON.stringify(item))
  apply(buildUnequipCommands({ ...item, 物品ID: bagKey }, slot))
  await characterStore.saveCurrentGame(undefined, undefined, { toast: false })
  undoStore.push({
    type: 'unequip',
    itemId: bagKey,
    itemName: String((item as any)?.名称 || bagKey),
    restoreData: { originalSlot: slot },
    itemData: itemSnapshot
  })
  actionQueueStore.addAction({
    type: 'unequip',
    itemName: String((item as any)?.名称 || bagKey),
    itemType: String((item as any)?.类型 || '装备'),
    description: `卸下了《${String((item as any)?.名称 || bagKey)}》`,
    payload: {
      kind: 'equip_item',
      op: 'unequip',
      slot,
      itemId: bagKey,
      itemData: itemSnapshot
    }
  })
  tip.value = `已卸下${slot}`
}

function equipGongfa() {
  const item = selectedItem.value
  if (!item) return
  const id = String(selectedKey.value || '')
  if (!id) return
  apply(buildEquipGongfaCommands({ ...item, 物品ID: id }, bagItems.value))
  actionQueueStore.addAction({
    type: 'cultivate',
    itemName: String((item as any)?.名称 || id),
    itemType: '功法',
    description: `开始修炼《${String((item as any)?.名称 || id)}》功法`
  })
  tip.value = '已装备功法'
}

function unequipGongfa() {
  const item = selectedItem.value
  if (!item) return
  const id = String(selectedKey.value || '')
  if (!id) return
  apply(buildUnequipGongfaCommands({ ...item, 物品ID: id }))
  actionQueueStore.addAction({
    type: 'unequip',
    itemName: String((item as any)?.名称 || id),
    itemType: '功法',
    description: `停止修炼并卸下《${String((item as any)?.名称 || id)}》功法`
  })
  tip.value = '已卸下功法'
}

function cultivateGongfa() {
  const item = selectedItem.value
  if (!item) return
  const id = String(selectedKey.value || '')
  if (!id) return
  apply(buildCultivateGongfaCommands({ ...item, 物品ID: id }, 10))
  actionQueueStore.addAction({
    type: 'cultivate',
    itemName: String((item as any)?.名称 || id),
    itemType: '功法',
    description: `修炼《${String((item as any)?.名称 || id)}》功法（进度+10）`
  })
  tip.value = '修炼进度已提升'
}

function discardSelected() {
  const item = selectedItem.value
  if (!item) return
  const id = String(selectedKey.value || '')
  if (!id) return

  const prev = normalizeItemQuantity(item)
  if (prev <= 0) return

  if (prev > 1) {
    qtyDialog.value.visible = true
    qtyDialog.value.mode = 'discard'
    qtyDialog.value.title = '丢弃物品'
    qtyDialog.value.countLabel = '丢弃数量'
    qtyDialog.value.confirmText = '确定丢弃'
    qtyDialog.value.itemKey = id
    qtyDialog.value.itemName = String((item as any)?.名称 || id)
    qtyDialog.value.itemType = String((item as any)?.类型 || '其他')
    qtyDialog.value.icon = getItemTypeIcon(String((item as any)?.类型 || '其他'))

    const q = (item as any)?.品质
    const top = qualityLabel(q).top
    const prefix = top && top !== '凡' ? `【${top}】` : ''
    qtyDialog.value.itemDesc = `${prefix}${String((item as any)?.名称 || id)} - 此操作不可撤销！`

    qtyDialog.value.max = prev
    qtyDialog.value.count = 1
    return
  }

  const q = (item as any)?.品质
  const top = qualityLabel(q).top
  const prefix = top && top !== '凡' ? `【${top}】` : ''
  confirmDialog.value.visible = true
  confirmDialog.value.title = '丢弃物品'
  confirmDialog.value.message = `确定要丢弃 ${prefix}${String((item as any)?.名称 || id)} 吗？\n\n此操作不可撤销！`
  confirmDialog.value.onConfirm = () => discardSelectedWithCount(1, id)
  return
}

watch(
  () => activeTab.value,
  () => {
    tip.value = ''
  }
)
</script>

<style scoped>
.wrap {
  display: grid;
  gap: 12px;
}

.surface {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.tabbar-surface {
  padding: 10px 12px;
}

.tabbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  opacity: 0.9;
}

.tab.active {
  border-color: rgba(147, 197, 253, 0.45);
  background: rgba(147, 197, 253, 0.12);
}

.panel {
  display: grid;
  gap: 12px;
  min-height: 520px;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--panel-border);
}

.search {
  flex: 1;
  min-width: 200px;
}

.input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 10px;
  outline: none;
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.select {
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 10px;
  outline: none;
}

.icon-btn {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-1);
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.items-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  min-height: 0;
}

@media (max-width: 900px) {
  .items-layout {
    grid-template-columns: 1fr;
  }
}

.items-list {
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  min-height: 0;
  overflow: auto;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  align-content: start;
}

@media (max-width: 520px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}

.item-card {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  text-align: left;
  color: var(--text-1);
  display: grid;
  gap: 10px;
  min-height: 132px;
}

.item-card.selected {
  border-color: rgba(147, 197, 253, 0.45);
  background: rgba(147, 197, 253, 0.12);
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.item-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    radial-gradient(circle at 35% 35%, rgba(147, 197, 253, 0.22), rgba(0, 0, 0, 0));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.item-badge {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-2);
}

.item-count {
  color: var(--text-3);
  font-size: 12px;
}

.item-name {
  font-size: 14px;
}

.item-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-2);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.tag-ok {
  border-color: rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.12);
  color: var(--text-1);
}

.detail {
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  display: grid;
  gap: 10px;
  align-content: start;
  min-height: 0;
  overflow: auto;
}

.detail-empty {
  place-content: center;
  text-align: center;
  gap: 12px;
}

.empty-box {
  width: 44px;
  height: 44px;
  margin: 0 auto;
  border-radius: 12px;
  border: 2px dashed rgba(148, 163, 184, 0.6);
  background: rgba(255, 255, 255, 0.02);
}

.detail-title {
  font-size: 15px;
  font-weight: 600;
}

.detail-sub {
  color: var(--text-3);
  font-size: 12px;
}

.detail-desc {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.6;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
}

.detail-meta {
  display: grid;
  gap: 6px;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}

.k {
  color: var(--text-3);
}

.v {
  color: var(--text-1);
}

.detail-json {
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  color: var(--text-1);
  line-height: 1.55;
  margin: 0;
}

.raw {
  border-top: 1px solid var(--panel-border);
  padding-top: 10px;
}

.raw > summary {
  cursor: pointer;
  color: var(--text-3);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-1);
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.02);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tip {
  color: var(--ok);
  font-size: 12px;
}

.muted {
  color: var(--text-3);
}

.grid-eq {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 900px) {
  .grid-eq {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .grid-eq {
    grid-template-columns: 1fr;
  }
}

.eq-slot {
  border: 1px dashed rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  color: var(--text-1);
  min-height: 120px;
  display: grid;
  gap: 10px;
}

.eq-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  min-height: 0;
}

@media (max-width: 900px) {
  .eq-layout {
    grid-template-columns: 1fr;
  }
}

.eq-list {
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  min-height: 0;
  overflow: auto;
}

.qty-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 999;
}

.qty-dialog {
  width: min(560px, 92vw);
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(248, 248, 248, 0.98);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.38);
  overflow: hidden;
}

.qty-head {
  background: rgba(229, 232, 238, 0.95);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qty-head-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.qty-head-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  color: rgba(17, 24, 39, 0.75);
}

.qty-card {
  margin: 16px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(238, 238, 238, 0.8);
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  align-items: center;
}

.qty-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.65);
  display: grid;
  place-items: center;
  font-size: 28px;
}

.qty-card-info {
  display: grid;
  gap: 4px;
}

.qty-card-name {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.qty-card-type {
  font-size: 13px;
  color: rgba(17, 24, 39, 0.7);
}

.qty-card-usable {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}

.qty-card-desc {
  font-size: 13px;
  color: rgba(17, 24, 39, 0.6);
}

.qty-section {
  padding: 0 16px 16px;
  display: grid;
  gap: 12px;
}

.qty-label {
  font-size: 16px;
  color: rgba(17, 24, 39, 0.7);
}

.qty-stepper {
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  gap: 10px;
  align-items: center;
}

.qty-step-btn {
  height: 52px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(243, 244, 246, 0.9);
  cursor: pointer;
  font-size: 22px;
  color: #111827;
}

.qty-step-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qty-step-value {
  height: 52px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(243, 244, 246, 0.95);
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  outline: none;
}

.qty-quick {
  display: flex;
  gap: 10px;
}

.qty-quick-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(243, 244, 246, 0.9);
  cursor: pointer;
  color: rgba(17, 24, 39, 0.8);
}

.qty-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(248, 248, 248, 0.98);
}

.btn-primary {
  background: #2f5fd2;
  border-color: rgba(47, 95, 210, 0.9);
}

.eq-title {
  color: var(--text-3);
  font-size: 12px;
}

.eq-body {
  display: grid;
  place-items: center;
  gap: 6px;
}

.eq-name {
  font-size: 13px;
}

.eq-empty-name {
  font-size: 13px;
  color: var(--text-2);
}

.eq-sub {
  font-size: 12px;
  color: var(--text-3);
}

.eq-ico {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  margin-right: 8px;
}

.sp-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 900px) {
  .sp-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .sp-grid {
    grid-template-columns: 1fr;
  }
}

.sp-card {
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 8px;
  align-content: start;
}

.sp-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    radial-gradient(circle at 35% 35%, rgba(99, 102, 241, 0.26), rgba(0, 0, 0, 0));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.sp-name {
  color: var(--text-2);
  font-size: 12px;
}

.sp-count {
  font-size: 18px;
  font-weight: 700;
}

.sp-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
