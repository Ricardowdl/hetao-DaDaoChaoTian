import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import JavaScriptObfuscator from 'javascript-obfuscator'

const projectRoot = path.resolve(process.cwd())
const distDir = path.join(projectRoot, 'dist')
const assetsDir = path.join(distDir, 'assets')

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

function getObfuscatorOptions() {
  const level = String(process.env.OBFUSCATE_LEVEL || 'balanced').toLowerCase()

  const base = {
    compact: true,
    sourceMap: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    splitStrings: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    simplify: true,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
  }

  if (level === 'aggressive') {
    return {
      ...base,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: false,
      debugProtection: false
    }
  }

  if (level === 'light') {
    return {
      ...base,
      stringArrayThreshold: 0.5,
      simplify: true
    }
  }

  return {
    ...base,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false
  }
}

async function main() {
  if (!(await exists(distDir))) {
    throw new Error(`dist directory not found: ${distDir}. Run \"npm run build\" first.`)
  }
  if (!(await exists(assetsDir))) {
    throw new Error(`assets directory not found: ${assetsDir}. Run \"npm run build\" first.`)
  }

  const options = getObfuscatorOptions()
  let processed = 0

  for await (const filePath of walk(assetsDir)) {
    if (!filePath.endsWith('.js')) continue

    const code = await fs.readFile(filePath, 'utf8')

    const obfuscated = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode()
    await fs.writeFile(filePath, obfuscated, 'utf8')

    processed += 1
  }

  if (processed === 0) {
    throw new Error(`No .js files found under: ${assetsDir}`)
  }

  process.stdout.write(`Obfuscation done. Processed ${processed} file(s). Level=${String(process.env.OBFUSCATE_LEVEL || 'balanced')}\n`)
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`)
  process.exit(1)
})
