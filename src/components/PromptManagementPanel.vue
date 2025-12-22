<template>
  <div class="pm-wrap">
    <div class="pm-toolbar">
      <div class="pm-toolbar-left">
        <div class="pm-title">提示词管理</div>
        <div class="pm-sub">正向游戏流程时对模型的提示词</div>
      </div>
      <div class="pm-toolbar-right">
        <button v-if="externalMode" class="pm-icon" type="button" title="导出" @click="exportAll">⤓</button>
        <button v-if="externalMode" class="pm-icon" type="button" title="导入（含酒馆JSON）" @click="importAll">⤒</button>
        <button v-if="externalMode" class="pm-icon danger" type="button" title="清空" @click="resetAll">🗑</button>
      </div>
    </div>

    <div class="pm-body">
      <div v-if="loading" class="pm-loading">加载中...</div>

      <template v-else>
        <div class="pm-mode" :class="externalMode ? 'external' : 'internal'">
          <div class="pm-mode-pill" :class="externalMode ? 'on' : 'off'">外部提示词</div>
          <div class="pm-mode-pill" :class="externalMode ? 'off' : 'on'">内置提示词</div>
        </div>

        <template v-if="!externalMode">
          <div class="pm-categories">
            <div v-for="g in orderedGroups" :key="g.key" class="pm-cat">
              <div class="pm-cat-head">
                <div class="pm-cat-left">
                  <span class="pm-cat-ico">{{ g.info.icon }}</span>
                  <span class="pm-cat-name">{{ g.info.name }}</span>
                  <span class="pm-cat-count">{{ g.prompts.length }} 个提示词</span>
                </div>
                <div class="pm-cat-right">
                  <span class="pm-cat-desc">{{ g.info.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="pm-tavern">
            <div class="pm-tavern-head">
              <div class="pm-tavern-title">酒馆提示词</div>
              <div class="pm-tavern-sub">导入外部 Tavern JSON 的提示词，受设置开关控制。</div>
              <div class="pm-tavern-count">{{ tavernPrompts.length }} 个条目</div>
            </div>

            <div v-if="loadingTavern" class="pm-loading">加载中...</div>
            <div v-else-if="tavernPrompts.length === 0" class="pm-empty">尚未导入酒馆提示词</div>

            <div v-else class="pm-tlist">
              <div v-for="(p, idx) in tavernPrompts" :key="p.identifier || p.name" class="pm-titem">
                <div class="pm-tleft">
                  <div class="pm-tidx">{{ idx + 1 }}</div>
                  <div class="pm-ttext">
                    <div class="pm-tname">{{ p.name }}</div>
                    <div class="pm-tsub">{{ p.role || 'system' }}</div>
                  </div>
                </div>
                <div class="pm-tright">
                  <div class="pm-torder">{{ p.injection_order ?? '-' }}</div>
                  <label class="pm-switch">
                    <input type="checkbox" :checked="p.enabled" @change="onToggleTavern(p, $event)" />
                    <span class="pm-slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { promptStore, type PromptEntry } from '../services/promptStore'
import { tavernPromptStore, type TavernPrompt } from '../services/tavernPromptStore'
import { downloadTextFile } from '../utils/download'
import type { PromptCategoryKey } from '../config/promptDefaults'
import { useSettingsStore } from '../stores/useSettingsStore'

const settingsStore = useSettingsStore()

const loading = ref(true)

const categoryOrder = ['coreRequest', 'summary', 'initialization', 'generation'] as const

const externalMode = computed(() => settingsStore.useImportedPromptOverrides)

const groups = ref<Record<PromptCategoryKey, { info: any; prompts: PromptEntry[] }>>({} as any)

const tavernPrompts = ref<TavernPrompt[]>([])
const loadingTavern = ref(false)

const orderedGroups = computed(() => {
  const out: Array<{ key: PromptCategoryKey; info: any; prompts: PromptEntry[] }> = []
  for (const k of categoryOrder) {
    const g = (groups.value as any)[k]
    if (g) out.push({ key: k as PromptCategoryKey, info: g.info, prompts: g.prompts || [] })
    else out.push({ key: k as PromptCategoryKey, info: (promptStore.categories as any)[k], prompts: [] })
  }
  return out
})

async function loadInternal() {
  loading.value = true
  try {
    const grouped = await promptStore.loadByCategory()
    groups.value = grouped as any
  } finally {
    loading.value = false
  }
}

async function loadTavern() {
  loadingTavern.value = true
  try {
    tavernPrompts.value = await tavernPromptStore.loadAll()
  } finally {
    loadingTavern.value = false
  }
}

async function init() {
  if (externalMode.value) {
    loading.value = false
    await loadTavern()
  } else {
    await loadInternal()
  }
}

watch(
  () => externalMode.value,
  async enabled => {
    if (enabled) {
      await loadTavern()
    } else {
      tavernPrompts.value = []
      await loadInternal()
    }
  },
  { immediate: true }
)

async function resetAll() {
  if (!confirm('确定要清空所有自定义提示词吗？')) return

  if (externalMode.value) {
    await tavernPromptStore.resetAll()
    await loadTavern()
    return
  }

  await promptStore.resetAll()
  await loadInternal()
}

async function exportAll() {
  if (externalMode.value) {
    downloadTextFile(
      `tavern_prompts_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      JSON.stringify({ prompts: tavernPrompts.value }, null, 2)
    )
    return
  }

  const payload = await promptStore.exportAll()
  downloadTextFile(`prompts_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify(payload, null, 2))
}

async function importAll() {
  try {
    const file = await pickJsonFile()
    if (!file) return
    const text = await file.text()
    const payload = JSON.parse(text)

    if (payload && payload.prompts && Array.isArray(payload.prompts)) {
      await tavernPromptStore.importFromTavernJson(payload)
      await loadTavern()
      alert('导入完成：酒馆提示词已更新')
      return
    }

    const promptCount = await promptStore.importPrompts(payload)
    await loadInternal()
    alert(`导入完成：提示词 ${promptCount} 条`)
  } catch (e) {
    alert(e instanceof Error ? `导入失败：${e.message}` : '导入失败')
  }
}

function pickJsonFile(): Promise<File | null> {
  return new Promise(resolve => {
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

async function onToggleTavern(p: TavernPrompt, ev: Event) {
  const checked = (ev.target as HTMLInputElement)?.checked
  await tavernPromptStore.setEnabled(p.identifier || p.name, Boolean(checked))
  tavernPrompts.value = tavernPrompts.value.map(x => ((x.identifier || x.name) === (p.identifier || p.name) ? { ...x, enabled: Boolean(checked) } : x))
}
</script>

<style scoped>
.pm-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #0f172a;
}

.pm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.pm-toolbar-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm-title {
  font-size: 16px;
  font-weight: 800;
}

.pm-sub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.pm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pm-icon {
  width: 32px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  color: rgba(15, 23, 42, 0.75);
}

.pm-icon.danger {
  color: #e11d48;
  border-color: rgba(225, 29, 72, 0.25);
}

.pm-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.pm-loading {
  padding: 14px;
  color: rgba(15, 23, 42, 0.6);
}

.pm-mode {
  display: flex;
  gap: 8px;
}

.pm-mode-pill {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.75);
}

.pm-mode-pill.on {
  border-color: rgba(37, 99, 235, 0.25);
  background: rgba(37, 99, 235, 0.08);
  color: rgba(37, 99, 235, 0.95);
}

.pm-mode-pill.off {
  color: rgba(15, 23, 42, 0.45);
}

.pm-categories {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pm-cat-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  cursor: pointer;
}

.pm-cat-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-cat-ico {
  width: 20px;
  text-align: center;
}

.pm-cat-name {
  font-weight: 800;
}

.pm-cat-count {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  padding: 2px 8px;
}

.pm-cat-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-cat-desc {
  max-width: 360px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pm-cat-chev {
  width: 16px;
  text-align: right;
  color: rgba(15, 23, 42, 0.45);
}

.pm-detail {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  overflow: hidden;
}

.pm-split {
  height: 100%;
  display: grid;
  grid-template-columns: 360px 1fr;
  min-height: 0;
}

.pm-list {
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  padding: 12px;
  overflow: auto;
  min-height: 0;
}

.pm-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.pm-list-title {
  font-weight: 800;
}

.pm-list-actions {
  display: flex;
  gap: 6px;
}

.pm-btn {
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  padding: 6px 10px;
  cursor: pointer;
}

.pm-btn.ghost {
  color: rgba(15, 23, 42, 0.6);
}

.pm-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.9);
  cursor: pointer;
  margin-bottom: 8px;
}

.pm-item.active {
  border-color: rgba(37, 99, 235, 0.28);
  background: rgba(37, 99, 235, 0.08);
}

.pm-item-name {
  font-weight: 700;
  color: rgba(15, 23, 42, 0.85);
}

.pm-item-tag {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: rgba(15, 23, 42, 0.55);
}

.pm-item-tag.mod {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.12);
  color: rgba(91, 33, 182, 0.95);
}

.pm-editor {
  padding: 12px;
  overflow: auto;
  min-height: 0;
}

.pm-editor-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.pm-editor-title {
  font-weight: 800;
}

.pm-editor-meta {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.pm-desc2 {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
  margin-bottom: 8px;
}

.pm-textarea {
  width: 100%;
  min-height: 360px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 10px;
  resize: vertical;
  font-family: Consolas, 'SFMono-Regular', ui-monospace, Menlo, monospace;
}

.pm-empty {
  padding: 14px;
  color: rgba(15, 23, 42, 0.5);
}

.pm-hidden {
  padding: 14px;
  border: 1px dashed rgba(15, 23, 42, 0.18);
  border-radius: 10px;
  color: rgba(15, 23, 42, 0.5);
}

.pm-tavern {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.pm-tavern-head {
  padding: 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-tavern-title {
  font-weight: 800;
}

.pm-tavern-sub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.pm-tavern-count {
  margin-left: auto;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.pm-tlist {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.pm-titem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.9);
}

.pm-tleft {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-tidx {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.12);
  color: rgba(37, 99, 235, 0.95);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
}

.pm-tname {
  font-weight: 800;
}

.pm-tsub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

.pm-tright {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pm-torder {
  width: 40px;
  text-align: right;
  color: rgba(15, 23, 42, 0.55);
  font-size: 12px;
}

.pm-switch {
  position: relative;
  display: inline-block;
  width: 44px;
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
  inset: 0;
  background-color: rgba(148, 163, 184, 0.8);
  border-radius: 999px;
  transition: 0.2s;
}

.pm-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}

.pm-switch input:checked + .pm-slider {
  background-color: rgba(37, 99, 235, 0.85);
}

.pm-switch input:checked + .pm-slider:before {
  transform: translateX(22px);
}
</style>
