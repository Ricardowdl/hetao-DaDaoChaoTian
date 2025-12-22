type AutoSaveOptions = {
  enabled: () => boolean
  intervalMs: () => number
  onSave: () => Promise<void>
}

export class AutoSaveScheduler {
  private timerId: number | null = null
  private saving = false

  constructor(private options: AutoSaveOptions) {}

  start() {
    this.stop()

    const tick = async () => {
      if (this.saving) return
      if (!this.options.enabled()) return

      try {
        this.saving = true
        await this.options.onSave()
      } finally {
        this.saving = false
      }
    }

    const interval = Math.max(10_000, this.options.intervalMs())
    this.timerId = window.setInterval(() => {
      tick()
    }, interval)
  }

  restart() {
    this.start()
  }

  stop() {
    if (this.timerId != null) {
      window.clearInterval(this.timerId)
      this.timerId = null
    }
  }
}
