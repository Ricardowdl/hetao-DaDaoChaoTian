import { defineStore } from 'pinia'

import { ENDPOINTS } from '../config/endpoints'

type NsfwGenderFilter = 'all' | 'female' | 'male'

type Theme = 'dark'

export type AiProviderPreset = 'custom' | 'official' | 'deepseek'

export type MemorySummaryMode = 'raw' | 'standard'

export type InitMode = 'generate' | 'standard'

type SettingsState = {
  theme: Theme
  uiScale: number
  fontSize: number
  fastAnimations: boolean
  showHints: boolean

  debugMode: boolean

  enablePreDialogBackup: boolean

  enableAutoSave: boolean
  autoSaveIntervalMinutes: number

  enableNsfwMode: boolean
  nsfwGenderFilter: NsfwGenderFilter

  customApiUrl: string
  customApiKey: string
  cloudSyncUrl: string

  useImportedPromptOverrides: boolean

  aiProviderPreset: AiProviderPreset
  aiModel: string
  aiModelList: string[]
  aiTemperature: number
  aiMaxContextTokens: number
  aiMaxOutputTokens: number
  aiStreaming: boolean
  memorySummaryMode: MemorySummaryMode
  initMode: InitMode

  enableActionOptions: boolean
  actionOptionsPrompt: string
  useSystemCot: boolean
}

const STORAGE_KEY = 'dad_game_settings'

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: 'dark',
    uiScale: 100,
    fontSize: 16,
    fastAnimations: false,
    showHints: true,

    debugMode: false,

    enablePreDialogBackup: true,

    enableAutoSave: true,
    autoSaveIntervalMinutes: 5,

    enableNsfwMode: false,
    nsfwGenderFilter: 'all',

    customApiUrl: ENDPOINTS.AI_CUSTOM_API_URL || '',
    customApiKey: ENDPOINTS.AI_CUSTOM_API_KEY || '',
    cloudSyncUrl: ENDPOINTS.CLOUD_SYNC_URL || '',

    useImportedPromptOverrides: false,

    aiProviderPreset: 'custom',
    aiModel: '',
    aiModelList: [],
    aiTemperature: 1.1,
    aiMaxContextTokens: 128000,
    aiMaxOutputTokens: 8192,
    aiStreaming: true,
    memorySummaryMode: 'raw',
    initMode: 'generate',

    enableActionOptions: true,
    actionOptionsPrompt: '',
    useSystemCot: true
  }),
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SettingsState>

          if (parsed.theme === 'dark') this.theme = 'dark'
          if (typeof parsed.uiScale === 'number') this.uiScale = clampInt(parsed.uiScale, 50, 200)
          if (typeof parsed.fontSize === 'number') this.fontSize = clampInt(parsed.fontSize, 10, 30)
          if (typeof parsed.fastAnimations === 'boolean') this.fastAnimations = parsed.fastAnimations
          if (typeof parsed.showHints === 'boolean') this.showHints = parsed.showHints

          if (typeof parsed.debugMode === 'boolean') this.debugMode = parsed.debugMode

          if (typeof parsed.enablePreDialogBackup === 'boolean') this.enablePreDialogBackup = parsed.enablePreDialogBackup

          if (typeof parsed.enableAutoSave === 'boolean') this.enableAutoSave = parsed.enableAutoSave
          if (typeof parsed.autoSaveIntervalMinutes === 'number') {
            this.autoSaveIntervalMinutes = clampInt(parsed.autoSaveIntervalMinutes, 1, 120)
          }
          this.enableNsfwMode = false
          this.nsfwGenderFilter = 'all'

          if (typeof parsed.customApiUrl === 'string') this.customApiUrl = parsed.customApiUrl
          if (typeof parsed.customApiKey === 'string') this.customApiKey = parsed.customApiKey
          if (typeof parsed.cloudSyncUrl === 'string') this.cloudSyncUrl = parsed.cloudSyncUrl

          if (typeof parsed.useImportedPromptOverrides === 'boolean') {
            this.useImportedPromptOverrides = parsed.useImportedPromptOverrides
          }

          const rawPreset = (parsed as any).aiProviderPreset
          if (rawPreset === 'custom' || rawPreset === 'official' || rawPreset === 'deepseek') {
            this.aiProviderPreset = rawPreset
          } else if (typeof rawPreset === 'string' && rawPreset) {
            // 兼容旧版本：glm/kimi/minimax 等预设降级为自定义
            this.aiProviderPreset = 'custom'
          }
          if (typeof parsed.aiModel === 'string') this.aiModel = parsed.aiModel
          if (Array.isArray(parsed.aiModelList)) this.aiModelList = parsed.aiModelList.filter((x) => typeof x === 'string')

          if (typeof parsed.aiTemperature === 'number' && Number.isFinite(parsed.aiTemperature)) {
            this.aiTemperature = Math.min(2, Math.max(0, parsed.aiTemperature))
          }
          if (typeof parsed.aiMaxContextTokens === 'number' && Number.isFinite(parsed.aiMaxContextTokens)) {
            this.aiMaxContextTokens = clampInt(parsed.aiMaxContextTokens, 256, 400000)
          }
          if (typeof parsed.aiMaxOutputTokens === 'number' && Number.isFinite(parsed.aiMaxOutputTokens)) {
            this.aiMaxOutputTokens = clampInt(parsed.aiMaxOutputTokens, 16, 200000)
          }
          if (typeof (parsed as any).aiStreaming === 'boolean') this.aiStreaming = (parsed as any).aiStreaming
          if ((parsed as any).memorySummaryMode === 'raw' || (parsed as any).memorySummaryMode === 'standard') {
            this.memorySummaryMode = (parsed as any).memorySummaryMode
          }
          if ((parsed as any).initMode === 'generate' || (parsed as any).initMode === 'standard') {
            this.initMode = (parsed as any).initMode
          }
          if (typeof parsed.enableActionOptions === 'boolean') this.enableActionOptions = parsed.enableActionOptions
          if (typeof parsed.actionOptionsPrompt === 'string') this.actionOptionsPrompt = parsed.actionOptionsPrompt
          if (typeof parsed.useSystemCot === 'boolean') this.useSystemCot = parsed.useSystemCot
        }

        try {
          const rawModels = localStorage.getItem('ai_available_models')
          if (rawModels) {
            const models = JSON.parse(rawModels)
            if (Array.isArray(models)) this.aiModelList = models.filter((x) => typeof x === 'string')
          }
        } catch {
          void 0
        }

        try {
          const rawAi = localStorage.getItem('ai_service_config')
          if (rawAi) {
            const aiCfg = JSON.parse(rawAi) as any
            if (typeof aiCfg?.streaming === 'boolean') this.aiStreaming = aiCfg.streaming
            if (aiCfg?.memorySummaryMode === 'raw' || aiCfg?.memorySummaryMode === 'standard') {
              this.memorySummaryMode = aiCfg.memorySummaryMode
            }
            if (aiCfg?.initMode === 'generate' || aiCfg?.initMode === 'standard') {
              this.initMode = aiCfg.initMode
            }
            const custom = aiCfg?.customAPI
            if (custom && typeof custom === 'object') {
              if (typeof custom.url === 'string' && custom.url.trim()) this.customApiUrl = custom.url.trim()
              if (typeof custom.apiKey === 'string') this.customApiKey = custom.apiKey
              if (typeof custom.model === 'string') this.aiModel = custom.model
              if (typeof custom.temperature === 'number' && Number.isFinite(custom.temperature)) {
                this.aiTemperature = Math.min(2, Math.max(0, custom.temperature))
              }
              if (typeof custom.maxTokens === 'number' && Number.isFinite(custom.maxTokens)) {
                this.aiMaxOutputTokens = clampInt(custom.maxTokens, 16, 200000)
              }
            }
          }
        } catch {
          void 0
        }
      } catch {
        return
      }
    },
    resetToDefaults() {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        void 0
      }
      this.$reset()
      this.save()
    },
    save() {
      const payload: SettingsState = {
        theme: this.theme,
        uiScale: clampInt(this.uiScale, 50, 200),
        fontSize: clampInt(this.fontSize, 10, 30),
        fastAnimations: this.fastAnimations,
        showHints: this.showHints,

        debugMode: this.debugMode,

        enablePreDialogBackup: this.enablePreDialogBackup,

        enableAutoSave: this.enableAutoSave,
        autoSaveIntervalMinutes: clampInt(this.autoSaveIntervalMinutes, 1, 120),

        enableNsfwMode: false,
        nsfwGenderFilter: 'all',

        customApiUrl: this.customApiUrl,
        customApiKey: this.customApiKey,
        cloudSyncUrl: this.cloudSyncUrl,

        useImportedPromptOverrides: this.useImportedPromptOverrides,

        aiProviderPreset: this.aiProviderPreset,
        aiModel: this.aiModel,
        aiModelList: Array.isArray(this.aiModelList) ? this.aiModelList : [],
        aiTemperature: Math.min(2, Math.max(0, this.aiTemperature)),
        aiMaxContextTokens: clampInt(this.aiMaxContextTokens, 256, 400000),
        aiMaxOutputTokens: clampInt(this.aiMaxOutputTokens, 16, 200000),
        aiStreaming: this.aiStreaming,
        memorySummaryMode: this.memorySummaryMode,
        initMode: this.initMode,

        enableActionOptions: this.enableActionOptions,
        actionOptionsPrompt: this.actionOptionsPrompt,
        useSystemCot: this.useSystemCot
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      try {
        const normalizeUrl = (url: string) => String(url || '').trim().replace(/\/v1\/?$/, '').replace(/\/+$/, '')
        const rawAi = localStorage.getItem('ai_service_config')
        const prev = rawAi ? (JSON.parse(rawAi) as any) : null
        const next: any = prev && typeof prev === 'object' ? prev : {}

        next.streaming = this.aiStreaming
        next.memorySummaryMode = this.memorySummaryMode
        next.initMode = this.initMode
        if (!next.mode) next.mode = 'custom'

        const custom = next.customAPI && typeof next.customAPI === 'object' ? next.customAPI : {}
        if (typeof custom.url !== 'string' || !custom.url.trim()) custom.url = normalizeUrl(this.customApiUrl)
        if (typeof custom.apiKey !== 'string') custom.apiKey = this.customApiKey
        if (typeof custom.model !== 'string' || !custom.model.trim()) custom.model = (this.aiModel || '').trim() || 'gpt-3.5-turbo'
        if (typeof custom.temperature !== 'number' || !Number.isFinite(custom.temperature)) custom.temperature = Math.min(2, Math.max(0, this.aiTemperature))
        if (typeof custom.maxTokens !== 'number' || !Number.isFinite(custom.maxTokens)) custom.maxTokens = clampInt(this.aiMaxOutputTokens, 16, 200000)
        next.customAPI = custom

        localStorage.setItem('ai_service_config', JSON.stringify(next))
      } catch {
        void 0
      }
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: payload }))
    },
    update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
      if (key === 'enableNsfwMode') {
        ;(this as any)[key] = false
      } else if (key === 'nsfwGenderFilter') {
        ;(this as any)[key] = 'all'
      } else {
        ;(this as any)[key] = value
      }
      this.save()
    },
    exportSettings() {
      const payload = localStorage.getItem(STORAGE_KEY) || JSON.stringify(this.$state)
      return payload
    },
    importSettings(jsonText: string) {
      const parsed = JSON.parse(jsonText) as Partial<SettingsState>
      ;(parsed as any).enableNsfwMode = false
      ;(parsed as any).nsfwGenderFilter = 'all'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      this.load()
      this.save()
    }
  }
})
