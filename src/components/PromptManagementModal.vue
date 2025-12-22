<template>
  <transition name="fade">
    <div v-if="modelValue" class="pm-overlay" @click.self="close">
      <div class="pm-dialog">
        <header class="pm-top">
          <div class="pm-top-left">
            <button class="pm-back" type="button" @click="close">←</button>
            <div class="pm-top-text">
              <div class="pm-title">提示词管理</div>
              <div class="pm-subtitle">正向游戏流程时对模型的提示词</div>
            </div>
          </div>
          <div class="pm-top-actions">
            <button class="pm-action" type="button" title="展开全部" @click="expandAllGroups">▾</button>
            <button class="pm-action" type="button" title="收起全部" @click="collapseAllGroups">▸</button>
            <button class="pm-action" type="button" title="保存全部" @click="saveAll">💾</button>
            <button class="pm-action" type="button" title="导出" @click="exportAll">⤓</button>
            <button class="pm-action" type="button" title="导入（含酒馆JSON）" @click="importAll">⤒</button>
            <button class="pm-action" type="button" :title="showContent ? '隐藏内容' : '显示内容'" @click="toggleContent">
              {{ showContent ? '🙈' : '👁' }}
            </button>
            <button class="pm-action danger" type="button" title="清空" @click="resetAll">🗑</button>
            <button class="pm-action" type="button" title="关闭" @click="close">✕</button>
          </div>
        </header>

        <div class="pm-layout">
          <section class="pm-main">
            <div class="pm-section-head">
              <div class="pm-section-title">提示词分组</div>
              <div class="pm-section-meta">
                <span class="pm-pill" :class="showInternalPrompts ? 'on' : 'off'">内置提示词</span>
                <span v-if="showTavernPrompts" class="pm-pill on">外部提示词</span>
                <span v-else class="pm-pill off">外部提示词已关闭</span>
              </div>
            </div>

            <div v-if="loading" class="pm-hint block">加载中...</div>

            <template v-else>
              <div v-for="g in groupList" :key="g.key" class="pm-card">
                <div class="pm-card-head" @click="toggleGroup(g.key)">
                  <div class="pm-card-left">
                    <span class="pm-ico">{{ g.info.icon }}</span>
                    <div class="pm-card-text">
                      <div class="pm-card-title">{{ g.info.name }}</div>
                      <div class="pm-card-sub">{{ g.info.description }}</div>
                    </div>
                  </div>
                  <div class="pm-card-right">
                    <span class="pm-count">{{ g.prompts.length }} 个提示词</span>
                    <button class="pm-chevron" type="button" @click.stop="toggleGroup(g.key)">
                      {{ expandedGroups.has(g.key) ? '▾' : '▸' }}
                    </button>
                  </div>
                </div>

                <div v-if="expandedGroups.has(g.key)" class="pm-card-body">
                  <div v-if="g.prompts.length === 0" class="pm-hint">该分类暂无提示词</div>

                  <div v-for="(p, idx) in g.prompts" :key="p.key" class="pm-row">
                    <div class="pm-row-head" @click="toggleExpanded(p.key)">
                      <div class="pm-row-left">
                        <div class="pm-idx">{{ idx + 1 }}</div>
                        <div class="pm-row-text">
                          <div class="pm-row-title">{{ p.name }}</div>
                          <div class="pm-row-sub">{{ p.description }}</div>
                        </div>
                      </div>
                      <div class="pm-row-right">
                        <span class="pm-tag" :class="p.modified ? 'mod' : 'def'">{{ p.modified ? '已修改' : '默认' }}</span>
                      </div>
                    </div>

                    <div v-if="expanded.has(p.key) && showContent" class="pm-row-body">
                      <textarea class="pm-textarea" v-model="draft[p.key]" />
                      <div class="pm-bottom">
                        <div class="pm-meta">key: {{ p.key }}</div>
                        <div class="pm-meta" v-if="p.updatedAt">更新时间: {{ p.updatedAt }}</div>
                        <div class="pm-row-actions">
                          <button class="pm-btn ghost" type="button" @click.stop="resetOne(p.key)">重置</button>
                          <button class="pm-btn primary" type="button" @click.stop="saveOne(p.key)">保存</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="showTavernPrompts" class="pm-card">
                <div class="pm-card-head" @click="toggleTavern">
                  <div class="pm-card-left">
                    <span class="pm-ico">🍺</span>
                    <div class="pm-card-text">
                      <div class="pm-card-title">酒馆提示词</div>
                      <div class="pm-card-sub">导入外部 Tavern JSON 的提示词，支持开关</div>
                    </div>
                  </div>
                  <div class="pm-card-right">
                    <span class="pm-count">{{ tavernPrompts.length }} 个条目</span>
                    <button class="pm-chevron" type="button" @click.stop="toggleTavern">{{ tavernExpanded ? '▾' : '▸' }}</button>
                  </div>
                </div>

                <div v-if="tavernExpanded" class="pm-card-body">
                  <div v-if="loadingTavern" class="pm-hint">加载中...</div>
                  <div v-else-if="tavernPrompts.length === 0" class="pm-hint">尚未导入酒馆提示词</div>

                  <div v-for="(p, idx) in tavernPrompts" :key="p.identifier || p.name" class="pm-trow">
                    <div class="pm-tleft">
                      <div class="pm-idx">{{ idx + 1 }}</div>
                      <div class="pm-row-text">
                        <div class="pm-row-title">{{ p.name }}</div>
                        <div class="pm-row-sub">{{ p.role || 'system' }}</div>
                      </div>
                    </div>
                    <div class="pm-tright">
                      <div class="pm-order">{{ p.injection_order ?? '-' }}</div>
                      <label class="pm-switch">
                        <input type="checkbox" :checked="p.enabled" @change="onToggleTavern(p, $event)" />
                        <span class="pm-slider" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </section>

          <aside class="pm-side">
            <div class="pm-side-card">
              <div class="pm-side-title">外部提示词</div>
              <div class="pm-side-desc">酒馆 JSON 导入的提示词受设置开关控制。</div>
              <div class="pm-side-status" :class="showTavernPrompts ? 'on' : 'off'">
                {{ showTavernPrompts ? '已开启' : '已关闭' }}
              </div>
            </div>
            <div class="pm-side-card">
              <div class="pm-side-title">批量操作</div>
              <div class="pm-side-actions">
                <button class="pm-btn block" type="button" @click="saveAll">保存全部</button>
                <button class="pm-btn block ghost" type="button" @click="resetAll">清空自定义</button>
                <button class="pm-btn block ghost" type="button" @click="exportAll">导出全部</button>
                <button class="pm-btn block ghost" type="button" @click="importAll">导入文件</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { promptStore } from '../services/promptStore'
import { tavernPromptStore, type TavernPrompt } from '../services/tavernPromptStore'
import { downloadTextFile } from '../utils/download'
import type { PromptCategoryKey, PromptKey } from '../config/promptDefaults'
import { useSettingsStore } from '../stores/useSettingsStore'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const settingsStore = useSettingsStore()

const loading = ref(true)
const categories = ref<Record<PromptCategoryKey, any>>({} as any)

const expanded = ref<Set<PromptKey>>(new Set())
const expandedGroups = ref<Set<PromptCategoryKey>>(new Set(['coreRequest']))
const draft = reactive<Record<string, string>>({})

const tavernPrompts = ref<TavernPrompt[]>([])
const tavernExpanded = ref(true)
const loadingTavern = ref(false)
const showContent = ref(true)

watch(
  () => props.modelValue,
  async (v) => {
    if (v) {
      await initData()
    }
  },
  { immediate: true }
)

async function initData() {
  loading.value = true
  try {
    const grouped = await promptStore.loadByCategory()
    categories.value = grouped

    for (const group of Object.values(grouped) as any[]) {
      for (const p of group.prompts || []) {
        draft[p.key] = p.content
      }
    }
    if (showTavernPrompts.value) {
      await loadTavern()
    } else {
      tavernPrompts.value = []
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => settingsStore.useImportedPromptOverrides,
  (enabled) => {
    if (enabled) {
      loadTavern()
    } else {
      tavernPrompts.value = []
    }
  }
)

const categoryOrder = ['coreRequest', 'summary', 'initialization', 'generation'] as const

const showInternalPrompts = computed(() => !settingsStore.useImportedPromptOverrides)
const showTavernPrompts = computed(() => settingsStore.useImportedPromptOverrides)

const groupList = computed(() => {
  if (!showInternalPrompts.value) return []
  const out: Array<{ key: PromptCategoryKey; info: any; prompts: any[] }> = []
  for (const k of categoryOrder) {
    const info = (promptStore.categories as any)[k]
    const group = (categories.value as any)[k]
    const allPrompts = (group?.prompts || []) as any[]
    out.push({ key: k as PromptCategoryKey, info, prompts: allPrompts })
  }
  return out
})

function toggleExpanded(key: PromptKey) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next

  if (!draft[key]) {
    const entry = Object.values(categories.value || {})
      .flatMap((g: any) => g?.prompts || [])
      .find((p: any) => p.key === key)
    if (entry?.content) draft[key] = entry.content
  }
}

function toggleGroup(key: PromptCategoryKey) {
  const next = new Set(expandedGroups.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedGroups.value = next
}

function expandAllGroups() {
  expandedGroups.value = new Set(categoryOrder as any)
}

function collapseAllGroups() {
  expandedGroups.value = new Set()
}

function toggleAllGroups() {
  if (expandedGroups.value.size === categoryOrder.length) {
    expandedGroups.value = new Set()
    return
  }
  expandedGroups.value = new Set(categoryOrder as any)
}

async function saveOne(key: PromptKey) {
  const content = String(draft[key] ?? '')
  await promptStore.save(key, content)
  const grouped = await promptStore.loadByCategory()
  categories.value = grouped
}

async function saveAll() {
  const list = groupList.value.flatMap((g) => g.prompts || [])
  for (const p of list) {
    const key = p.key as PromptKey
    const content = String(draft[key] ?? '')
    await promptStore.save(key, content)
  }
  const grouped = await promptStore.loadByCategory()
  categories.value = grouped
}

async function resetOne(key: PromptKey) {
  await promptStore.reset(key)
  const grouped = await promptStore.loadByCategory()
  categories.value = grouped
  const entry = Object.values(grouped)
    .flatMap((x: any) => x.prompts || [])
    .find((p: any) => p.key === key)
  if (entry) draft[key] = entry.content
}

async function resetAll() {
  if (!confirm('确定要清空所有自定义提示词吗？')) return
  await promptStore.resetAll()
  const grouped = await promptStore.loadByCategory()
  categories.value = grouped
  for (const group of Object.values(grouped) as any[]) {
    for (const p of group.prompts || []) {
      draft[p.key] = p.content
    }
  }
}

async function exportAll() {
  const payload = await promptStore.exportAll()
  downloadTextFile(`prompts_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify(payload, null, 2))
}

async function importAll() {
  try {
    const file = await pickJsonFile()
    if (!file) return
    const text = await file.text()
    const payload = JSON.parse(text)
    let promptCount = 0
    let tavernCount = 0

    if (payload && payload.prompts && Array.isArray(payload.prompts)) {
      tavernCount = await tavernPromptStore.importFromTavernJson(payload)
      await loadTavern()
    } else {
      promptCount = await promptStore.importPrompts(payload)
    }

    if (promptCount > 0) {
      const grouped = await promptStore.loadByCategory()
      categories.value = grouped
      for (const group of Object.values(grouped) as any[]) {
        for (const p of group.prompts || []) {
          draft[p.key] = p.content
        }
      }
    }

    alert(`导入完成：提示词 ${promptCount} 条，酒馆 ${tavernCount} 条`)
  } catch (e) {
    alert(e instanceof Error ? `导入失败：${e.message}` : '导入失败')
  }
}

function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0] || null
      resolve(file)
    }
    input.onclick = () => {
      input.value = ''
    }
    input.click()
  })
}

async function loadTavern() {
  loadingTavern.value = true
  try {
    tavernPrompts.value = await tavernPromptStore.loadAll()
  } finally {
    loadingTavern.value = false
  }
}

function toggleTavern() {
  tavernExpanded.value = !tavernExpanded.value
}

async function onToggleTavern(p: TavernPrompt, ev: Event) {
  const checked = (ev.target as HTMLInputElement)?.checked
  await tavernPromptStore.setEnabled(p.identifier || p.name, Boolean(checked))
  tavernPrompts.value = tavernPrompts.value.map((x) =>
    (x.identifier || x.name) === (p.identifier || p.name) ? { ...x, enabled: Boolean(checked) } : x
  )
}

function toggleContent() {
  showContent.value = !showContent.value
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.pm-dialog {
  width: min(1180px, 96vw);
  height: min(760px, 92vh);
  background: #f7f7fb;
  border-radius: 14px;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--panel-border);
}

.pm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #ffffff;
  border-bottom: 1px solid var(--panel-border);
}

.pm-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-back {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(209, 213, 219, 0.9);
  background: #fff;
  cursor: pointer;
}

.pm-title {
  font-weight: 800;
  color: #1f2937;
}

.pm-desc {
  color: #9ca3af;
  font-size: 12px;
}

.pm-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pm-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(209, 213, 219, 0.9);
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.pm-icon.danger {
  border-color: rgba(248, 113, 113, 0.6);
  color: #b91c1c;
}

.pm-body {
  flex: 1;
  overflow: auto;
  padding: 14px;
}

.pm-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pm-card {
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.pm-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  cursor: pointer;
  background: #fff;
}

.pm-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-ico {
  width: 22px;
  text-align: center;
}

.pm-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm-card-title {
  font-weight: 800;
  color: #1f2937;
}

.pm-card-sub {
  font-size: 12px;
  color: #9ca3af;
}

.pm-card-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pm-count {
  font-size: 12px;
  color: #6b7280;
  border: 1px solid rgba(209, 213, 219, 0.8);
  border-radius: 999px;
  padding: 2px 8px;
}

.pm-chevron {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid rgba(209, 213, 219, 0.9);
  background: #fff;
  cursor: pointer;
}

.pm-card-body {
  padding: 10px 12px 12px 12px;
  background: #f9fafb;
}

.pm-row {
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: #fff;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.pm-row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
}

.pm-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pm-idx {
  min-width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #4f46e5;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
}

.pm-row-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-row-title {
  font-weight: 800;
  color: #111827;
}

.pm-row-sub {
  font-size: 12px;
  color: #6b7280;
}

.pm-row-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-tag {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 8px;
  border: 1px solid rgba(209, 213, 219, 0.9);
  color: #6b7280;
  background: #f9fafb;
}

.pm-tag.mod {
  border-color: rgba(168, 85, 247, 0.45);
  color: #7c3aed;
  background: #f5f3ff;
}

.pm-row-body {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pm-textarea {
  width: 100%;
  min-height: 180px;
  border-radius: 10px;
  border: 1px solid rgba(209, 213, 219, 0.9);
  padding: 10px;
  font-family: 'Fira Code', Consolas, 'SFMono-Regular', monospace;
  background: #fff;
  color: #111827;
}

.pm-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pm-meta {
  font-size: 12px;
  color: #6b7280;
}

.pm-row-actions {
  display: flex;
  gap: 8px;
}

.pm-btn {
  border-radius: 10px;
  border: 1px solid rgba(209, 213, 219, 0.9);
  background: #fff;
  color: #374151;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
}

.pm-btn.primary {
  background: linear-gradient(135deg, #60a5fa, #818cf8);
  border-color: rgba(99, 102, 241, 0.8);
  color: #fff;
}

.pm-btn.ghost {
  background: #f9fafb;
}

.pm-hint {
  color: #9ca3af;
  padding: 8px 12px;
}

.pm-trow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: #fff;
  margin-bottom: 8px;
}

.pm-tleft {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-tright {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-order {
  width: 48px;
  text-align: right;
  color: #6b7280;
  font-size: 12px;
}

.pm-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
}

.pm-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.pm-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(203, 213, 225, 0.8);
  transition: 0.2s;
  border-radius: 999px;
  border: 1px solid rgba(209, 213, 219, 0.9);
}

.pm-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.pm-switch input:checked + .pm-slider {
  background-color: rgba(99, 102, 241, 0.85);
  border-color: rgba(99, 102, 241, 0.85);
}

.pm-switch input:checked + .pm-slider:before {
  transform: translateX(20px);
}
</style>
