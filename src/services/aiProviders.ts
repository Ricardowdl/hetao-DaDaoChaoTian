import type { AiProviderPreset } from '../stores/useSettingsStore'

export function normalizeBaseUrl(url: string) {
  return (url || '').trim().replace(/\/v1\/?$/, '').replace(/\/+$/, '')
}

export function getPresetBaseUrl(preset: AiProviderPreset): string {
  switch (preset) {
    case 'official':
      return import.meta.env.DEV ? '/official' : 'http://43.160.245.153/v1'
    case 'deepseek':
      return import.meta.env.DEV ? '/deepseek' : 'https://api.deepseek.com'
    case 'custom':
    default:
      return ''
  }
}

export function resolveAiBaseUrl(params: { preset: AiProviderPreset; customBaseUrl: string }): string {
  if (params.preset === 'custom') return normalizeBaseUrl(params.customBaseUrl)
  return normalizeBaseUrl(getPresetBaseUrl(params.preset))
}
