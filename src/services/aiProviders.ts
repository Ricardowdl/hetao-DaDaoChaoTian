import type { AiProviderPreset } from '../stores/useSettingsStore'

export function normalizeBaseUrl(url: string) {
  return (url || '').trim().replace(/\/v1\/?$/, '').replace(/\/+$/, '')
}

export function getPresetBaseUrl(preset: AiProviderPreset): string {
  switch (preset) {
    case 'official':
      return '/official'
    case 'deepseek':
      return '/deepseek'
    case 'custom':
    default:
      return ''
  }
}

export function resolveAiBaseUrl(params: { preset: AiProviderPreset; customBaseUrl: string }): string {
  if (params.preset === 'custom') return normalizeBaseUrl(params.customBaseUrl)
  return normalizeBaseUrl(getPresetBaseUrl(params.preset))
}
