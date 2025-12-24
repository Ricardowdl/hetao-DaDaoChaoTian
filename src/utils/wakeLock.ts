let wakeLock: WakeLockSentinel | null = null
let lockCount = 0
let noSleepVideo: HTMLVideoElement | null = null

function createNoSleepVideo(): HTMLVideoElement {
  const video = document.createElement('video')
  video.setAttribute('playsinline', '')
  video.setAttribute('muted', '')
  video.setAttribute('loop', '')
  video.style.position = 'fixed'
  video.style.top = '-9999px'
  video.style.left = '-9999px'
  video.style.width = '1px'
  video.style.height = '1px'
  video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA3RtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjY0MyA1YzY1NzA0IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAFbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAABhpb2RzAAAAABCAgIAHAE/////+/wAAAiF0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAGZbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAKABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABRG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAQRzdGJsAAAAmHN0c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMGF2Y0MBZAAf/+EAGGdkAB+s2UCYM+XhAAADAAEAAAMAZA8YMZYBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAACgAAFAAAAAAUc3RzcwAAAAAAAAABAAAAAQAAABhjdHRzAAAAAAAAAAoAAAABAAApAAAAABRzdHNjAAAAAAAAAAEAAAABAAAACgAAAAEAAABEc3RzegAAAAAAAAAAAAAACgAAA3QAAAAXAAAAFQAAABUAAAAVAAAAFQAAABUAAAAVAAAAFQAAABUAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTYuNDAuMTAx'
  video.muted = true
  return video
}

function startNoSleepFallback() {
  if (noSleepVideo) return
  noSleepVideo = createNoSleepVideo()
  document.body.appendChild(noSleepVideo)
  noSleepVideo.play().catch(() => void 0)
  console.log('[WakeLock] NoSleep video fallback started')
}

function stopNoSleepFallback() {
  if (!noSleepVideo) return
  noSleepVideo.pause()
  noSleepVideo.remove()
  noSleepVideo = null
  console.log('[WakeLock] NoSleep video fallback stopped')
}

export async function requestWakeLock(): Promise<void> {
  lockCount++
  if (lockCount > 1) return

  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Wake lock released')
        if (lockCount > 0) startNoSleepFallback()
      })
      console.log('[WakeLock] Wake lock acquired')
      return
    } catch (err) {
      console.warn('[WakeLock] Failed to acquire wake lock:', err)
    }
  }

  startNoSleepFallback()
}

export async function releaseWakeLock(): Promise<void> {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  stopNoSleepFallback()

  if (wakeLock) {
    try {
      await wakeLock.release()
      wakeLock = null
      console.log('[WakeLock] Wake lock released manually')
    } catch (err) {
      console.warn('[WakeLock] Failed to release wake lock:', err)
    }
  }
}

export function setupVisibilityReacquire(): () => void {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && lockCount > 0) {
      if (!wakeLock && 'wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
          stopNoSleepFallback()
          console.log('[WakeLock] Wake lock reacquired after visibility change')
        } catch (err) {
          console.warn('[WakeLock] Failed to reacquire wake lock:', err)
          startNoSleepFallback()
        }
      } else if (!wakeLock) {
        startNoSleepFallback()
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
