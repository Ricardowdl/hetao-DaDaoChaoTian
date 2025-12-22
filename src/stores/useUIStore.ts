import { defineStore } from 'pinia'

type Theme = 'dark'

type ToastType = 'info' | 'success' | 'error' | 'loading'

let toastTimer: number | null = null

export const useUIStore = defineStore('ui', {
  state: () => ({
    theme: 'dark' as Theme,
    fullscreen: false,
    pendingAction: '',
    toast: {
      show: false,
      text: '',
      type: 'info' as ToastType,
      id: 0
    }
  }),
  actions: {
    showToast(text: string, type: ToastType = 'info', durationMs = 2200) {
      this.toast = {
        show: true,
        text: String(text || ''),
        type,
        id: Date.now()
      }

      if (toastTimer) window.clearTimeout(toastTimer)
      toastTimer = null

      if (type !== 'loading') {
        toastTimer = window.setTimeout(() => {
          this.toast.show = false
        }, Math.max(800, Number(durationMs) || 2200))
      }
    },
    showLoading(text = '正在保存…') {
      const id = Date.now()
      this.toast = {
        show: true,
        text: String(text || '正在保存…'),
        type: 'loading',
        id
      }

      if (toastTimer) window.clearTimeout(toastTimer)
      toastTimer = null

      return id
    },
    resolveLoading(id: number, text: string, type: Exclude<ToastType, 'loading'> = 'success', durationMs = 2200) {
      if (this.toast?.show && this.toast.id === id) {
        this.showToast(text, type, durationMs)
        return
      }
      this.showToast(text, type, durationMs)
    },
    applyTheme() {
      this.theme = 'dark'
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('ui_theme', 'dark')
    },
    setTheme(theme: Theme) {
      void theme
      this.applyTheme()
    },
    toggleTheme() {
      this.applyTheme()
    },
    async toggleFullscreen() {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
          this.fullscreen = true
        } else {
          await document.exitFullscreen()
          this.fullscreen = false
        }
      } catch {
        this.fullscreen = Boolean(document.fullscreenElement)
      }
    },
    setPendingAction(text: string) {
      this.pendingAction = String(text || '')
    },
    consumePendingAction(): string {
      const v = String(this.pendingAction || '')
      this.pendingAction = ''
      return v
    }
  }
})
