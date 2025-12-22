<template>
  <div class="root">
    <div class="search">
      <div class="search-left">
        <span class="ico">🗄</span>
        <span class="search-title">游戏变量查看</span>
      </div>
      <div class="search-right">
        <div class="search-box">
          <span class="sico">⌕</span>
          <input class="input" type="text" v-model.trim="searchQuery" placeholder="搜索数据..." />
        </div>
        <button class="icon-btn" type="button" title="刷新" @click="refresh">⟳</button>
        <button class="icon-btn" type="button" title="保存" :disabled="saving" @click="saveNow">💾</button>
        <button class="icon-btn" type="button" title="统计" @click="showStats = true">📊</button>
        <button class="btn" type="button" @click="showFormatGuide = true">格式说明</button>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.id" class="tab" type="button" :class="{ active: activeTab === t.id }" @click="activeTab = t.id">
        <span class="tab-ico">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count != null" class="tab-count">{{ t.count }}</span>
      </button>
    </div>

    <div class="content">
      <div class="card">
        <div class="card-head">
          <div class="card-title">{{ activeTabTitle }}</div>
          <button v-if="activeTab === 'custom-options'" class="mini-add" type="button" @click="addCustomOption">＋ 新增变量</button>
        </div>

        <div v-if="searchQuery" class="search-results">
          <div v-if="filteredResults.length === 0" class="muted">未找到匹配项</div>
          <div v-for="r in filteredResults" :key="r.path" class="result-item">
            <div class="result-main">
              <div class="result-path">{{ r.path }}</div>
              <div class="result-preview">{{ r.preview }}</div>
            </div>
            <div class="result-actions">
              <button class="mini" type="button" @click="copyText(r.path)">复制路径</button>
              <button class="mini" type="button" @click="openEditor(r.path)">编辑</button>
              <button class="mini" type="button" @click="openJsonViewer(r.value)">查看</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'save-data'" class="split">
          <div class="tree-pane">
            <div class="tree">
              <TreeNode
                v-for="node in rootNodes"
                :key="node.path"
                :node="node"
                :expanded="expandedMap[node.path] === true"
                :selected-path="selectedPath"
                @toggle="toggleExpanded"
                @select="selectPath"
              />
            </div>
          </div>

          <div class="detail-pane">
            <div v-if="!selectedPath" class="muted">请选择左侧节点</div>
            <div v-else class="detail">
              <div class="detail-head">
                <div class="detail-path mono" :title="selectedPath">{{ selectedPath }}</div>
                <div class="pill">{{ selectedTypeLabel }}</div>
              </div>

              <div class="detail-actions">
                <button class="btn btn-ghost" type="button" @click="copyText(selectedPath)">复制路径</button>
                <button class="btn btn-ghost" type="button" @click="copyText(selectedJson)">复制当前值</button>
                <button class="btn" type="button" @click="openEditor(selectedPath)">编辑</button>
                <button class="btn btn-ghost" type="button" @click="openJsonViewer(selectedValue)">查看</button>
              </div>

              <div v-if="selectedChildren.length > 0" class="child-table">
                <div class="child-head">
                  <div class="child-col key">字段</div>
                  <div class="child-col type">类型</div>
                  <div class="child-col preview">预览</div>
                </div>
                <button
                  v-for="c in selectedChildren"
                  :key="c.path"
                  type="button"
                  class="child-row"
                  @click="selectPath(c.path)"
                >
                  <div class="child-col key mono">{{ c.key }}</div>
                  <div class="child-col type"><span class="pill">{{ c.typeLabel }}</span></div>
                  <div class="child-col preview">{{ c.preview }}</div>
                </button>
              </div>

              <pre class="json-pre">{{ selectedJson }}</pre>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'custom-options'" class="kv-list">
          <div v-if="customOptionEntries.length === 0" class="muted">暂无自定义变量</div>
          <div v-for="it in customOptionEntries" :key="it.key" class="kv-card">
            <div class="kv-card-head">
              <div class="kv-key">{{ it.key }}</div>
              <div class="pill">{{ it.typeLabel }}</div>
              <div class="kv-actions">
                <button class="icon-mini" type="button" title="复制路径" @click.stop="copyText(it.path)">⧉</button>
                <button class="icon-mini" type="button" title="编辑" @click.stop="openEditor(it.path)">✎</button>
                <button class="icon-mini danger" type="button" title="删除" @click.stop="deleteCustomOption(it.key)">🗑</button>
              </div>
            </div>
            <pre class="json-pre">{{ it.text }}</pre>
          </div>
        </div>

        <div v-else class="sections">
          <div v-for="s in sectionBlocks" :key="s.path || s.title" class="section">
            <div class="section-head">
              <div class="section-title">{{ s.title }}</div>
              <div class="pill">{{ s.typeLabel }}</div>
              <button v-if="s.path" class="icon-mini" type="button" title="复制路径" @click.stop="copyText(s.path)">⧉</button>
              <button class="icon-mini" type="button" title="查看" @click.stop="openJsonViewer(s.value)">👁</button>
            </div>
            <pre class="json-pre">{{ s.text }}</pre>
          </div>
        </div>
      </div>

      <div v-if="tip" class="muted">{{ tip }}</div>
    </div>

    <div v-if="showEditor" class="overlay" @click.self="closeEditor">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">编辑变量</div>
          <button class="icon-btn" type="button" title="关闭" @click="closeEditor">✕</button>
        </div>

        <div class="modal-body">
          <div class="kv"><span class="k">路径</span><span class="v mono">{{ editorPath }}</span></div>
          <div class="actions" style="justify-content: flex-start; margin-top: 10px">
            <button class="btn btn-ghost" type="button" @click="copyText(editorPath)">复制路径</button>
            <button class="btn btn-ghost" type="button" @click="copyText(currentValueText)">复制当前值</button>
          </div>

          <div class="kv" style="align-items: center; margin-top: 12px">
            <span class="k">操作</span>
            <span class="v">
              <select class="select" v-model="editorAction">
                <option value="set">set</option>
                <option value="add">add</option>
                <option value="push">push</option>
                <option value="pull">pull</option>
                <option value="delete">delete</option>
              </select>
            </span>
          </div>

          <div v-if="editorAction !== 'delete'" class="kv" style="align-items: flex-start">
            <span class="k">值</span>
            <span class="v" style="flex: 1">
              <textarea class="textarea" v-model="editorValueText" placeholder="支持 JSON（对象/数组/数字/字符串），不能解析时会按原文本作为字符串" />
            </span>
          </div>

          <div class="actions" style="justify-content: flex-start">
            <button class="btn" type="button" @click="applyEditor">应用到本地</button>
            <button class="btn btn-ghost" type="button" @click="copyEditorCommand">复制 tavern_commands</button>
            <button class="btn btn-ghost" type="button" @click="fillAction">填入行动（让AI生成）</button>
          </div>

          <div class="muted" style="margin-top: 10px">注意：本地应用只会修改当前运行内存状态；如需持久化请点击顶部💾保存。</div>
        </div>
      </div>
    </div>

    <div v-if="showFormatGuide" class="overlay" @click.self="showFormatGuide = false">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">数据格式说明</div>
          <button class="icon-btn" type="button" title="关闭" @click="showFormatGuide = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="actions" style="justify-content: flex-start">
            <button class="btn btn-ghost" type="button" @click="copyText(formatGuideText)">复制完整说明</button>
          </div>
          <pre class="pre">{{ formatGuideText }}</pre>
        </div>
      </div>
    </div>

    <div v-if="showStats" class="overlay" @click.self="showStats = false">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">统计</div>
          <button class="icon-btn" type="button" title="关闭" @click="showStats = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="kv"><span class="k">根节点数量</span><span class="v">{{ rootNodes.length }}</span></div>
          <div class="kv"><span class="k">总Key数量（估算）</span><span class="v">{{ stats.totalKeys }}</span></div>
          <div class="kv"><span class="k">JSON大小（估算）</span><span class="v">{{ stats.jsonBytes }} bytes</span></div>
          <div class="actions" style="justify-content: flex-start; margin-top: 10px">
            <button class="btn btn-ghost" type="button" @click="downloadJson">导出JSON</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="jsonViewerOpen" class="overlay" @click.self="closeJsonViewer">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">详情</div>
          <button class="icon-btn" type="button" title="关闭" @click="closeJsonViewer">✕</button>
        </div>
        <div class="modal-body">
          <div class="actions" style="justify-content: flex-start">
            <button class="btn btn-ghost" type="button" @click="copyText(jsonViewerText)">复制</button>
          </div>
          <pre class="pre">{{ jsonViewerText }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'

import type { TavernCommand } from '../services/tavernCommands'
import { downloadTextFile } from '../utils/download'
import { useCharacterStore } from '../stores/useCharacterStore'
import { useGameStateStore } from '../stores/useGameStateStore'

type TabId = 'save-data' | 'core-data' | 'character-data' | 'world-info' | 'memory-data' | 'custom-options' | 'original-data'

type Node = {
  label: string
  path: string
  value: any
  hasChildren: boolean
  preview: string
  children?: Node[]
}

const emit = defineEmits<{
  (e: 'fill-action', text: string): void
}>()

const gameState = useGameStateStore()
const characterStore = useCharacterStore()

const saving = ref(false)
const tip = ref('')

const activeTab = ref<TabId>('save-data')
const searchQuery = ref('')

const showFormatGuide = ref(false)
const showStats = ref(false)

const expandedMap = reactive<Record<string, boolean>>({})

const tabRoots: Record<TabId, Array<{ label: string; path: string }>> = {
  'save-data': [
    { label: '角色基础信息', path: '角色基础信息' },
    { label: '玩家角色状态', path: '玩家角色状态' },
    { label: '背包', path: '背包' },
    { label: '装备栏', path: '装备栏' },
    { label: '人物关系', path: '人物关系' },
    { label: '记忆', path: '记忆' },
    { label: '游戏时间', path: '游戏时间' },
    { label: '世界信息', path: '世界信息' },
    { label: '三千大道', path: '三千大道' },
    { label: '任务系统', path: '任务系统' },
    { label: '修炼功法', path: '修炼功法' },
    { label: '掌握技能', path: '掌握技能' },
    { label: '系统', path: '系统' },
    { label: '叙事历史', path: '叙事历史' }
  ],
  'core-data': [
    { label: '游戏时间', path: '游戏时间' },
    { label: '系统', path: '系统' },
    { label: '叙事历史', path: '叙事历史' },
    { label: '任务系统', path: '任务系统' }
  ],
  'character-data': [
    { label: '角色基础信息', path: '角色基础信息' },
    { label: '玩家角色状态', path: '玩家角色状态' },
    { label: '装备栏', path: '装备栏' },
    { label: '修炼功法', path: '修炼功法' },
    { label: '掌握技能', path: '掌握技能' }
  ],
  'world-info': [
    { label: '世界信息', path: '世界信息' },
    { label: '位置', path: '玩家角色状态.位置' },
    { label: '人物关系', path: '人物关系' }
  ],
  'memory-data': [
    { label: '记忆', path: '记忆' },
    { label: '短期记忆', path: '记忆.短期记忆' },
    { label: '中期记忆', path: '记忆.中期记忆' },
    { label: '长期记忆', path: '记忆.长期记忆' }
  ],
  'custom-options': [{ label: '自定义选项', path: '自定义选项' }],
  'original-data': [
    { label: 'SaveData（完整）', path: '' }
  ]
}

const customOptionsCount = computed(() => {
  const saveData = gameState.toSaveData() as any
  const dict = (saveData && typeof saveData === 'object' ? saveData.自定义选项 : null) as any
  if (!dict || typeof dict !== 'object') return 0
  return Object.keys(dict).length
})

const tabs = computed(() => {
  const map = tabRoots
  const countRoots = (id: TabId) => map[id].length
  return [
    { id: 'save-data' as const, icon: '💾', label: '存档数据(修改游戏数据)', count: countRoots('save-data') },
    { id: 'core-data' as const, icon: '⌘', label: '核心数据', count: countRoots('core-data') },
    { id: 'character-data' as const, icon: '👤', label: '角色数据', count: countRoots('character-data') },
    { id: 'world-info' as const, icon: '🌍', label: '世界信息', count: countRoots('world-info') },
    { id: 'memory-data' as const, icon: '🧠', label: '记忆数据', count: countRoots('memory-data') },
    { id: 'custom-options' as const, icon: '⚙', label: '自定义选项', count: customOptionsCount.value },
    { id: 'original-data' as const, icon: '🧾', label: '原始数据', count: countRoots('original-data') }
  ]
})

const activeTabTitle = computed(() => {
  const item = tabs.value.find(x => x.id === activeTab.value)
  return item ? item.label : '变量'
})

type PathSeg = string | number

function parsePath(path: string): PathSeg[] {
  const out: PathSeg[] = []
  const parts = String(path || '').split('.')
  for (const part of parts) {
    if (!part) continue
    const re = /([^\[\]]+)|(\[(\d+)\])/g
    let m: RegExpExecArray | null
    while ((m = re.exec(part))) {
      if (m[1]) out.push(m[1])
      else if (m[3]) out.push(Number(m[3]))
    }
  }
  return out
}

function getByPath(root: any, path: string) {
  if (!path) return root
  const segs = parsePath(path)
  let cur = root
  for (const seg of segs) {
    if (cur == null) return undefined
    cur = (cur as any)[seg as any]
  }
  return cur
}

function valuePreview(v: any) {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') {
    const s = v.length > 80 ? v.slice(0, 80) + '…' : v
    return JSON.stringify(s)
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `Array(${v.length})`
  if (typeof v === 'object') return `Object(${Object.keys(v || {}).length})`
  return String(v)
}

function buildNode(label: string, path: string, value: any): Node {
  const hasChildren = value != null && (Array.isArray(value) || typeof value === 'object')
  return {
    label,
    path,
    value,
    hasChildren,
    preview: valuePreview(value)
  }
}

function buildChildren(node: Node): Node[] {
  const v = node.value
  if (v == null) return []

  if (Array.isArray(v)) {
    return v.map((item, idx) => {
      const p = `${node.path}[${idx}]`
      return buildNode(String(idx), p, item)
    })
  }

  if (typeof v === 'object') {
    return Object.keys(v)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => {
        const p = node.path ? `${node.path}.${k}` : k
        return buildNode(k, p, (v as any)[k])
      })
  }

  return []
}

const rootNodes = computed(() => {
  const roots = tabRoots[activeTab.value]
  const saveData = gameState.toSaveData()

  return roots.map((r) => {
    const v = r.path ? getByPath(saveData, r.path) : saveData
    const node = buildNode(`${r.label}：`, r.path, v)
    return node
  })
})

function toggleExpanded(path: string) {
  expandedMap[path] = !expandedMap[path]
}

const selectedPath = ref('')

function escapeAttrValue(v: string) {
  return String(v || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function buildPathProgression(segs: PathSeg[]) {
  const out: string[] = []
  let cur = ''
  for (const seg of segs) {
    if (typeof seg === 'number') cur = `${cur}[${seg}]`
    else cur = cur ? `${cur}.${seg}` : seg
    out.push(cur)
  }
  return out
}

function ensureExpandedForPath(path: string) {
  const p = String(path || '')
  if (!p) return
  const saveData = gameState.toSaveData()
  const steps = buildPathProgression(parsePath(p))
  for (const parent of steps.slice(0, -1)) {
    expandedMap[parent] = true
  }
  const v = getByPath(saveData, p)
  if (v != null && (Array.isArray(v) || typeof v === 'object')) {
    expandedMap[p] = true
  }
}

function scrollSelectedIntoView(path: string) {
  const p = String(path || '')
  if (!p) return
  requestAnimationFrame(() => {
    const selector = `[data-var-path="${escapeAttrValue(p)}"]`
    const el = document.querySelector(selector)
    if (el && 'scrollIntoView' in el) {
      ;(el as any).scrollIntoView({ block: 'nearest' })
    }
  })
}

function selectPath(path: string) {
  const p = String(path || '')
  selectedPath.value = p
  ensureExpandedForPath(p)
  scrollSelectedIntoView(p)
}

const selectedValue = computed(() => {
  const saveData = gameState.toSaveData()
  if (!selectedPath.value) return null
  return getByPath(saveData, selectedPath.value)
})

const selectedJson = computed(() => safeStringify(selectedValue.value))
const selectedTypeLabel = computed(() => valueTypeLabel(selectedValue.value))

type ChildEntry = { key: string; path: string; typeLabel: string; preview: string }

const selectedChildren = computed((): ChildEntry[] => {
  const v = selectedValue.value
  const base = selectedPath.value
  if (!base) return []
  if (v == null) return []

  if (Array.isArray(v)) {
    return v.map((item, idx) => {
      const p = `${base}[${idx}]`
      return { key: String(idx), path: p, typeLabel: valueTypeLabel(item), preview: valuePreview(item) }
    })
  }
  if (typeof v === 'object') {
    return Object.keys(v)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => {
        const p = `${base}.${k}`
        const item = (v as any)[k]
        return { key: k, path: p, typeLabel: valueTypeLabel(item), preview: valuePreview(item) }
      })
  }
  return []
})

watch(
  () => activeTab.value,
  () => {
    tip.value = ''
    searchQuery.value = ''

    if (activeTab.value === 'save-data') {
      const first = tabRoots['save-data']?.[0]?.path || ''
      if (!selectedPath.value) {
        selectPath(first)
      } else {
        ensureExpandedForPath(selectedPath.value)
        scrollSelectedIntoView(selectedPath.value)
      }
    }
  },
  { immediate: true }
)

type SearchResult = { path: string; value: any; preview: string }

function flatten(node: Node): SearchResult[] {
  const out: SearchResult[] = []
  const push = (p: string, v: any) => out.push({ path: p, value: v, preview: valuePreview(v) })

  push(node.path || '(root)', node.value)
  const children = buildChildren(node)
  for (const c of children) {
    out.push(...flatten(c))
  }
  return out
}

const filteredResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return [] as SearchResult[]

  const roots = rootNodes.value
  const items: SearchResult[] = []
  for (const r of roots) items.push(...flatten(r))

  const matched = items.filter((it) => {
    const p = it.path.toLowerCase()
    const s = it.preview.toLowerCase()
    return p.includes(q) || s.includes(q)
  })

  return matched.slice(0, 200)
})

async function copyText(text: string) {
  const t = String(text || '')
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(t)
      tip.value = '已复制'
      return
    }
  } catch {
    void 0
  }

  const ta = document.createElement('textarea')
  ta.value = t
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    tip.value = '已复制'
  } finally {
    document.body.removeChild(ta)
  }
}

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function valueTypeLabel(v: any) {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (Array.isArray(v)) return `array(${v.length})`
  if (typeof v === 'object') return `object(${Object.keys(v || {}).length})`
  return typeof v
}

type SectionBlock = { title: string; path: string; value: any; text: string; typeLabel: string }

const sectionBlocks = computed((): SectionBlock[] => {
  const id = activeTab.value
  if (id === 'save-data' || id === 'custom-options') return []
  const roots = tabRoots[id]
  const saveData = gameState.toSaveData() as any
  return roots.map((r) => {
    const v = r.path ? getByPath(saveData, r.path) : saveData
    return {
      title: r.label,
      path: r.path,
      value: v,
      text: safeStringify(v),
      typeLabel: valueTypeLabel(v)
    }
  })
})

type CustomOptionEntry = { key: string; path: string; value: any; text: string; typeLabel: string }

const customOptionEntries = computed((): CustomOptionEntry[] => {
  if (activeTab.value !== 'custom-options') return []
  const saveData = gameState.toSaveData() as any
  const dict = (saveData && typeof saveData === 'object' ? saveData.自定义选项 : null) as any
  if (!dict || typeof dict !== 'object') return []
  return Object.keys(dict)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => {
      const path = `自定义选项.${k}`
      const v = dict[k]
      return { key: k, path, value: v, text: safeStringify(v), typeLabel: valueTypeLabel(v) }
    })
})

function addCustomOption() {
  const name = window.prompt('请输入变量名（不要包含点号 . ）')
  if (!name) return
  if (String(name).includes('.')) {
    tip.value = '变量名不能包含点号（.）'
    return
  }
  openEditor(`自定义选项.${String(name).trim()}`)
}

function deleteCustomOption(key: string) {
  const k = String(key || '').trim()
  if (!k) return
  if (!confirm(`确定要删除变量「${k}」吗？`)) return
  try {
    gameState.applyCommands([{ action: 'delete', key: `自定义选项.${k}`, value: null }])
    tip.value = '已删除'
  } catch (e) {
    tip.value = e instanceof Error ? `删除失败：${e.message}` : '删除失败'
  }
}

function refresh() {
  tip.value = '已刷新'
}

async function saveNow() {
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

function downloadJson() {
  const filename = `dad_save_vars_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  downloadTextFile(filename, safeStringify(gameState.toSaveData()))
}

const stats = computed(() => {
  const roots = rootNodes.value
  let totalKeys = 0
  for (const r of roots) totalKeys += flatten(r).length
  const jsonText = safeStringify(gameState.toSaveData())
  return { totalKeys, jsonBytes: jsonText.length }
})

const jsonViewerOpen = ref(false)
const jsonViewerText = ref('')

function openJsonViewer(v: any) {
  jsonViewerText.value = safeStringify(v)
  jsonViewerOpen.value = true
}

function closeJsonViewer() {
  jsonViewerOpen.value = false
  jsonViewerText.value = ''
}

const showEditor = ref(false)
const editorPath = ref('')
const editorAction = ref<TavernCommand['action']>('set')
const editorValueText = ref('')

const currentValueText = computed(() => {
  const saveData = gameState.toSaveData()
  const v = editorPath.value ? getByPath(saveData, editorPath.value) : saveData
  return safeStringify(v)
})

function openEditor(path: string) {
  editorPath.value = path
  editorAction.value = 'set'
  editorValueText.value = ''
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
}

function parseEditorValue(text: string, action: TavernCommand['action']) {
  if (action === 'add') {
    const n = Number(text)
    return Number.isFinite(n) ? n : 0
  }

  const raw = String(text ?? '')
  const t = raw.trim()
  if (!t) return ''

  try {
    return JSON.parse(t)
  } catch {
    return raw
  }
}

function buildCommand(): TavernCommand {
  const key = String(editorPath.value || '').trim()
  if (!key) {
    throw new Error('路径不能为空')
  }
  const action = editorAction.value
  const value = action === 'delete' ? null : parseEditorValue(editorValueText.value, action)

  return {
    action,
    key,
    value
  }
}

function applyEditor() {
  try {
    const cmd = buildCommand()
    gameState.applyCommands([cmd])
    tip.value = '已应用到本地'
  } catch (e) {
    tip.value = e instanceof Error ? `应用失败：${e.message}` : '应用失败'
  }
}

function copyEditorCommand() {
  const cmd = buildCommand()
  const payload = { tavern_commands: [cmd] }
  void copyText(JSON.stringify(payload, null, 2))
}

function fillAction() {
  const cmd = buildCommand()
  const prompt =
    '请根据我的要求生成标准游戏响应。\n' +
    '输出要求：\n' +
    '- 先输出思维链：<thinking>...</thinking>\n' +
    '- 再输出JSON（必须用```json代码块包裹），且仅输出一个JSON对象（不要额外解释文字）\n' +
    '- JSON必须包含 text / mid_term_memory / tavern_commands\n' +
    '目标：修改游戏变量。\n' +
    `建议的 tavern_commands 如下（你可以调整为更安全/更合理的命令序列）：\n${JSON.stringify([cmd], null, 2)}`

  emit('fill-action', prompt)
}

const formatGuideText = computed(() => {
  return (
    '【路径格式】\n' +
    '- 使用点号访问对象：例如 玩家角色状态.位置.描述\n' +
    '- 数组下标用 [n]：例如 叙事历史[0].text\n\n' +
    '【tavern_commands 操作】\n' +
    '- set：设置指定路径为给定值（对象/数组/数字/字符串均可）\n' +
    '- add：对数值字段做增量修改（value 必须为数字）\n' +
    '- push：向数组末尾追加元素（如果目标不是数组会自动创建数组）\n' +
    '- pull：从数组中移除与 value 匹配的元素（用于回滚/删除某条记录等）\n' +
    '- delete：删除对象字段或数组项（数组项按 index 删除）\n\n' +
    '【示例】\n' +
    '{"action":"add","key":"玩家角色状态.声望","value":10}\n' +
    '{"action":"set","key":"玩家角色状态.位置.描述","value":"青云门山门"}\n' +
    '{"action":"push","key":"玩家角色状态.状态效果","value":{"状态名称":"灵气充盈","类型":"buff","生成时间":{"年":1000,"月":1,"日":1,"小时":8,"分钟":0},"持续时间分钟":120,"状态描述":"灵气恢复速度提升"}}\n' +
    '{"action":"pull","key":"玩家角色状态.状态效果","value":{"状态名称":"灵气充盈","类型":"buff"}}\n' +
    '{"action":"delete","key":"背包.物品.item_001"}'
  )
})

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as any, required: true },
    expanded: { type: Boolean, required: true },
    selectedPath: { type: String, default: '' }
  },
  emits: ['toggle', 'select'],
  setup(props, { emit }) {
    const children = computed(() => {
      const n = props.node as Node
      if (!props.expanded) return []
      return buildChildren(n)
    })

    return () => {
      const n = props.node as Node
      const isLeaf = !n.hasChildren
      const isSelected = Boolean(props.selectedPath && n.path === props.selectedPath)

      return h('div', { class: 'tree-node' }, [
        h(
          'div',
          {
            class: ['tree-row', { leaf: isLeaf, selected: isSelected }],
            'data-var-path': n.path,
            onClick: () => emit('select', n.path)
          },
          [
            n.hasChildren
              ? h(
                  'button',
                  {
                    class: 'chev',
                    type: 'button',
                    onClick: (e: MouseEvent) => {
                      e.stopPropagation()
                      emit('toggle', n.path)
                    }
                  },
                  props.expanded ? '▾' : '▸'
                )
              : h('span', { class: 'chev placeholder' }, '•'),
            h(
              'span',
              {
                class: 'label',
                title: n.path || ''
              },
              n.label
            ),
            h('span', { class: 'value' }, n.preview),
            h('div', { class: 'row-actions' }, [])
          ]
        ),
        props.expanded
          ? h(
              'div',
              { class: 'tree-children' },
              children.value.map((c) =>
                h(TreeNode as any, {
                  node: c,
                  expanded: (expandedMap as any)[c.path] === true,
                  selectedPath: props.selectedPath,
                  onToggle: (p: string) => emit('toggle', p),
                  onSelect: (p: string) => emit('select', p)
                })
              )
            )
          : null
      ])
    }
  }
})
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(245, 245, 245, 0.98);
  border-radius: 12px;
  padding: 12px;
}

.icon-btn {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(30, 41, 59, 0.92);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-title {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 700;
}

.search-right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
}

.sico {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(100, 116, 139, 0.95);
}

.input {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(15, 23, 42, 0.92);
  border-radius: 10px;
  padding: 7px 10px 7px 30px;
  width: 260px;
}

.btn {
  border: 1px solid rgba(196, 181, 253, 0.9);
  background: rgba(124, 58, 237, 0.92);
  color: white;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.95);
  color: rgba(30, 41, 59, 0.92);
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(30, 41, 59, 0.92);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  position: relative;
}

.tab.active {
  background: rgba(37, 99, 235, 0.95);
  border-color: rgba(37, 99, 235, 0.95);
  color: rgba(255, 255, 255, 0.98);
}

.tab-ico {
  font-size: 12px;
}

.tab-count {
  position: absolute;
  top: -8px;
  right: -6px;
  background: rgba(124, 58, 237, 0.95);
  color: rgba(255, 255, 255, 0.98);
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1.2;
  border: 2px solid rgba(245, 245, 245, 0.98);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.split {
  display: grid;
  grid-template-columns: minmax(280px, 36%) 1fr;
  gap: 12px;
  align-items: stretch;
}

.tree-pane,
.detail-pane {
  min-height: 520px;
}

.tree-pane .tree,
.detail-pane {
  height: min(64vh, 640px);
  overflow: auto;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.card-title {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 700;
  margin-bottom: 0;
}

.mini-add {
  border: 1px solid rgba(196, 181, 253, 0.9);
  background: rgba(124, 58, 237, 0.92);
  color: rgba(255, 255, 255, 0.98);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
}

.mini-add:hover {
  filter: brightness(1.05);
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.12);
  color: rgba(124, 58, 237, 0.95);
  border: 1px solid rgba(196, 181, 253, 0.6);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

.icon-mini {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(30, 41, 59, 0.92);
  border-radius: 10px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.2;
}

.icon-mini.danger {
  color: rgba(220, 38, 38, 0.95);
  border-color: rgba(248, 113, 113, 0.6);
  background: rgba(254, 242, 242, 0.95);
}

.json-pre {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 8px;
  color: rgba(15, 23, 42, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

.kv-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kv-card {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  padding: 10px;
}

.kv-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kv-key {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 700;
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kv-actions {
  display: flex;
  gap: 8px;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  padding: 10px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  color: rgba(15, 23, 42, 0.92);
  font-weight: 700;
  font-size: 13px;
  flex: 1;
}

.tree {
  background: rgba(248, 250, 252, 0.98) !important;
  color: rgba(15, 23, 42, 0.92) !important;
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 12px;
  padding: 10px;
}

.tree-node {
  margin-left: 8px;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  color: rgba(15, 23, 42, 0.92) !important;
  font-size: 13px;
}

.tree-row:hover {
  background: rgba(148, 163, 184, 0.18);
}

.tree-row.selected {
  background: rgba(37, 99, 235, 0.14);
  outline: 1px solid rgba(37, 99, 235, 0.25);
}

.tree-row.selected .label {
  color: rgba(37, 99, 235, 0.98) !important;
}

.tree-row.selected .value {
  color: rgba(15, 23, 42, 0.88) !important;
}

.chev {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(30, 41, 59, 0.92);
  cursor: pointer;
}

.chev.placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  color: rgba(100, 116, 139, 0.95);
}

.label {
  color: rgba(30, 41, 59, 0.95) !important;
  font-size: 13px;
  font-weight: 700;
  min-width: 110px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value {
  color: rgba(51, 65, 85, 0.92) !important;
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-path {
  flex: 1;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.child-table {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  overflow: hidden;
}

.child-head {
  display: grid;
  grid-template-columns: 1.3fr 0.8fr 2fr;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid rgba(203, 213, 225, 0.7);
  color: rgba(71, 85, 105, 0.92);
  font-size: 12px;
  font-weight: 700;
}

.child-row {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 1.3fr 0.8fr 2fr;
  gap: 10px;
  padding: 10px;
  border: 0;
  border-bottom: 1px solid rgba(203, 213, 225, 0.55);
  background: transparent;
  cursor: pointer;
}

.child-row:hover {
  background: rgba(148, 163, 184, 0.18);
}

.child-row:last-child {
  border-bottom: 0;
}

.child-col.preview {
  color: rgba(71, 85, 105, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(30, 41, 59, 0.92);
  border-radius: 10px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}

.tree-children {
  margin-left: 18px;
  border-left: 1px solid rgba(148, 163, 184, 0.35);
  padding-left: 10px;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(248, 250, 252, 0.95);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.result-path {
  color: rgba(37, 99, 235, 0.95);
  font-size: 13px;
}

.result-preview {
  color: rgba(71, 85, 105, 0.92);
  font-size: 12px;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 560px;
}

.result-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.7);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 80;
}

.modal {
  width: min(920px, 100%);
  max-height: min(720px, 92vh);
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--panel-border);
}

.modal-title {
  color: var(--text-1);
  font-weight: 700;
}

.modal-body {
  padding: 12px 14px;
  overflow: auto;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  padding: 6px 0;
}

.k {
  color: var(--text-muted);
}

.v {
  color: var(--text-1);
  text-align: right;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.select {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 10px;
  padding: 6px 10px;
}

.textarea {
  width: 100%;
  min-height: 90px;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-1);
  border-radius: 10px;
  padding: 8px 10px;
}

.pre {
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 10px;
  color: var(--text-1);
}

.muted {
  color: var(--text-muted);
}
</style>
