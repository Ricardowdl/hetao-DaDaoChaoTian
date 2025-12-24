export function setupDeviceAdaptation() {
  const root = document.documentElement

  const supportsVisualViewport = typeof window.visualViewport !== 'undefined' && window.visualViewport !== null
  const visualViewport = supportsVisualViewport ? window.visualViewport : null

  let rafId: number | null = null

  function computeIsMobile() {
    const ua = navigator.userAgent || ''
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const hasTouch = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0
    const vw = visualViewport?.width ?? window.innerWidth
    return Boolean((isMobileUA || hasTouch) && vw <= 1024)
  }

  function computeIsIOS() {
    const ua = navigator.userAgent || ''
    return /iPad|iPhone|iPod/i.test(ua)
  }

  function readStoredUiScale(): number {
    try {
      const raw = localStorage.getItem('dad_game_settings')
      if (!raw) return 1
      const parsed = JSON.parse(raw) as any
      const uiScalePercent = typeof parsed?.uiScale === 'number' ? parsed.uiScale : 100
      const scale = uiScalePercent / 100
      return Math.max(0.5, Math.min(2, scale))
    } catch {
      return 1
    }
  }

  function updateVars() {
    const vh = visualViewport?.height ?? window.innerHeight
    const vw = visualViewport?.width ?? window.innerWidth

    root.style.setProperty('--app-vh', `${Math.max(1, Math.round(vh))}px`)
    root.style.setProperty('--app-vw', `${Math.max(1, Math.round(vw))}px`)
    root.style.setProperty('--device-dpr', String(window.devicePixelRatio || 1))

    const isMobile = computeIsMobile()
    root.classList.toggle('is-mobile', isMobile)

    const isIOS = computeIsIOS()
    root.classList.toggle('is-ios', isIOS)

    const autoScale = 1
    root.style.setProperty('--auto-ui-scale', String(autoScale))

    const computedUiScaleRaw = getComputedStyle(root).getPropertyValue('--ui-scale')
    const uiScale = Number.parseFloat(String(computedUiScaleRaw || '').trim())
    const storedUiScale = readStoredUiScale()
    const safeUiScale = Number.isFinite(uiScale) && uiScale > 0 ? uiScale : storedUiScale
    const effectiveScale = safeUiScale * autoScale
    root.style.setProperty('--effective-ui-scale', String(effectiveScale))
    root.style.setProperty('--inv-effective-ui-scale', String(1 / Math.max(0.0001, effectiveScale)))

    window.dispatchEvent(new CustomEvent('deviceAdaptationChanged'))
  }

  function scheduleUpdate() {
    if (rafId) window.cancelAnimationFrame(rafId)
    rafId = window.requestAnimationFrame(() => {
      rafId = null
      updateVars()
    })
  }

  const onResize = () => scheduleUpdate()

  const onSettingsChanged = () => scheduleUpdate()

  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onResize)
  window.addEventListener('settingsChanged', onSettingsChanged)
  visualViewport?.addEventListener('resize', onResize)
  visualViewport?.addEventListener('scroll', onResize)

  scheduleUpdate()

  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    window.removeEventListener('settingsChanged', onSettingsChanged)
    visualViewport?.removeEventListener('resize', onResize)
    visualViewport?.removeEventListener('scroll', onResize)
    if (rafId) window.cancelAnimationFrame(rafId)
    rafId = null
  }
}
