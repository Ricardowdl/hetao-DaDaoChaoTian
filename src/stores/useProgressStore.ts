import { defineStore } from 'pinia'

export type ProgressStepStatus = 'pending' | 'in_progress' | 'completed' | 'error'

export type ProgressStep = {
  id: string
  title: string
  status: ProgressStepStatus
  detail?: string
  startedAt?: string
  endedAt?: string
}

type ProgressState = {
  visible: boolean
  title: string
  steps: ProgressStep[]
  output: string
  error: string
  done: boolean
}

function nowIso() {
  return new Date().toISOString()
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const useProgressStore = defineStore('progress', {
  state: (): ProgressState => ({
    visible: false,
    title: '',
    steps: [],
    output: '',
    error: '',
    done: false
  }),
  actions: {
    open(title: string) {
      this.visible = true
      this.title = title
      this.steps = []
      this.output = ''
      this.error = ''
      this.done = false
    },
    close() {
      this.visible = false
    },
    addStep(title: string, detail?: string) {
      const id = uid()
      this.steps.push({ id, title, status: 'pending', detail })
      return id
    },
    setStepStatus(id: string, status: ProgressStepStatus, detail?: string) {
      const step = this.steps.find((s) => s.id === id)
      if (!step) return

      if (status === 'in_progress' && !step.startedAt) step.startedAt = nowIso()
      if ((status === 'completed' || status === 'error') && !step.endedAt) step.endedAt = nowIso()

      step.status = status
      if (detail !== undefined) step.detail = detail
    },
    setOutput(text: string) {
      this.output = text
    },
    appendOutput(text: string) {
      this.output += text
    },
    setError(message: string) {
      this.error = message
    },
    markDone() {
      this.done = true
    }
  }
})
