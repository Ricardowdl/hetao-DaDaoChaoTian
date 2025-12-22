type OptionalString = string | ''

export const ENDPOINTS = {
  AUTH_SERVER_URL: ((import.meta as any).env?.VITE_AUTH_SERVER_URL as OptionalString) || 'https://auth.ddct.top',
  AI_CUSTOM_API_URL: ((import.meta as any).env?.VITE_AI_CUSTOM_API_URL as OptionalString) || '',
  AI_CUSTOM_API_KEY: ((import.meta as any).env?.VITE_AI_CUSTOM_API_KEY as OptionalString) || '',
  CLOUD_SYNC_URL: ((import.meta as any).env?.VITE_CLOUD_SYNC_URL as OptionalString) || ''
}
