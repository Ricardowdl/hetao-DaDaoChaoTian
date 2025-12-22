import { defineStore } from 'pinia'

import { AUTH_CONFIG } from '../config/auth'
import { generateStableMachineCode } from '../utils/machineCode'

type AuthState = {
  isVerified: boolean
  appId: string
  machineCode: string
  expiresAt: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isVerified: !AUTH_CONFIG.ENABLE_AUTH,
    appId: AUTH_CONFIG.APP_ID,
    machineCode: '',
    expiresAt: ''
  }),
  actions: {
    loadFromStorage() {
      if (!AUTH_CONFIG.ENABLE_AUTH) {
        this.isVerified = true
        this.appId = AUTH_CONFIG.APP_ID
        return
      }

      const verified = localStorage.getItem('auth_verified') === 'true'
      const appId = localStorage.getItem('auth_app_id') || AUTH_CONFIG.APP_ID
      const machineCode = localStorage.getItem('auth_machine_code') || ''
      const expiresAt = localStorage.getItem('auth_expires_at') || ''

      this.appId = appId
      this.machineCode = machineCode
      this.expiresAt = expiresAt

      if (verified && expiresAt) {
        const exp = new Date(expiresAt)
        this.isVerified = Number.isFinite(exp.getTime()) && exp.getTime() > Date.now()
      } else {
        this.isVerified = false
      }

      if (!this.isVerified) {
        this.clearLocalAuth()
      }
    },
    clearLocalAuth() {
      localStorage.removeItem('auth_verified')
      localStorage.removeItem('auth_timestamp')
      localStorage.removeItem('auth_app_id')
      localStorage.removeItem('auth_machine_code')
      localStorage.removeItem('auth_expires_at')
    },
    clearAuth() {
      if (!AUTH_CONFIG.ENABLE_AUTH) {
        this.isVerified = true
        this.appId = AUTH_CONFIG.APP_ID
        this.machineCode = ''
        this.expiresAt = ''
        return
      }

      this.isVerified = false
      this.appId = AUTH_CONFIG.APP_ID
      this.machineCode = ''
      this.expiresAt = ''
      this.clearLocalAuth()
    },
    async ensureMachineCode() {
      if (!AUTH_CONFIG.ENABLE_AUTH) return
      if (this.machineCode) return
      this.machineCode = await generateStableMachineCode()
      localStorage.setItem('auth_machine_code', this.machineCode)
    },
    async verifyAuth(params: { appId: string; code: string; machineCode: string; bindingType: string }) {
      const { appId, code, machineCode, bindingType } = params

      if (!AUTH_CONFIG.ENABLE_AUTH) {
        this.isVerified = true
        return { success: true, message: '授权验证已关闭' }
      }

      if (AUTH_CONFIG.SERVER_URL) {
        const url = AUTH_CONFIG.SERVER_URL.replace(/\/$/, '') + AUTH_CONFIG.VERIFY_ENDPOINT
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify',
            app_id: appId,
            code,
            machine_code: machineCode,
            binding_type: bindingType
          })
        })

        const data = (await res.json()) as any
        if (data?.success) {
          const expiresAt = data.data?.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          localStorage.setItem('auth_verified', 'true')
          localStorage.setItem('auth_timestamp', Date.now().toString())
          localStorage.setItem('auth_app_id', appId)
          localStorage.setItem('auth_machine_code', machineCode)
          localStorage.setItem('auth_expires_at', expiresAt)

          this.isVerified = true
          this.appId = appId
          this.machineCode = machineCode
          this.expiresAt = expiresAt
          return { success: true, message: '验证成功！授权已激活' }
        }

        return { success: false, message: data?.message || '验证失败，请检查输入信息' }
      }

      if (!appId || !code || !machineCode) {
        return { success: false, message: '请填写应用ID/兑换码/机器码' }
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem('auth_verified', 'true')
      localStorage.setItem('auth_timestamp', Date.now().toString())
      localStorage.setItem('auth_app_id', appId)
      localStorage.setItem('auth_machine_code', machineCode)
      localStorage.setItem('auth_expires_at', expiresAt)

      this.isVerified = true
      this.appId = appId
      this.machineCode = machineCode
      this.expiresAt = expiresAt
      return { success: true, message: '验证成功！授权已激活' }
    }
  }
})
