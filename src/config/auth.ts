import { ENDPOINTS } from './endpoints'

const env = (import.meta as any).env || {}

export const AUTH_CONFIG = {
  ENABLE_AUTH: false, // 临时关闭授权方便测试
  APP_ID: (env.VITE_APP_ID as string) || 'v32_08f3deaf',
  SERVER_URL: (ENDPOINTS.AUTH_SERVER_URL as string) || '',
  VERIFY_ENDPOINT: (env.VITE_AUTH_VERIFY_ENDPOINT as string) || '/server.php'
}
