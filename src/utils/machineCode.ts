async function sha256Hex(input: string): Promise<string> {
  if (typeof TextEncoder !== 'undefined' && globalThis.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(hashBuffer))
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  }

  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(16).padStart(16, '0').slice(0, 16).toUpperCase()
}

export async function generateStableMachineCode(): Promise<string> {
  const parts: string[] = []

  try {
    parts.push(navigator.userAgent)
  } catch {
    parts.push('ua')
  }

  try {
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'tz')
  } catch {
    parts.push('tz')
  }

  try {
    parts.push(String(screen.width))
    parts.push(String(screen.height))
    parts.push(String(screen.colorDepth))
  } catch {
    parts.push('screen')
  }

  const feature = parts.join('|')
  try {
    const hex = await sha256Hex(feature)
    return `UMC-${hex}`
  } catch {
    return `UMC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  }
}
