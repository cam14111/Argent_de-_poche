/**
 * Hachage du code PIN parent.
 *
 * Format actuel : PBKDF2-SHA256 avec sel aléatoire et 150 000 itérations,
 * sérialisé en `pbkdf2$<itérations>$<sel hex>$<hash hex>`.
 *
 * Rétrocompatibilité : les anciens PIN étaient stockés en SHA-256 simple
 * (64 caractères hexadécimaux). `verifyPin` les accepte toujours et
 * `needsRehash` permet de les migrer vers le nouveau format.
 */

const PBKDF2_ITERATIONS = 150_000
const SALT_BYTES = 16
const KEY_BITS = 256

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function sha256Legacy(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return toHex(new Uint8Array(hashBuffer))
}

async function pbkdf2(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS
  )
  return toHex(new Uint8Array(bits))
}

/** Compare deux chaînes en temps constant. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await pbkdf2(pin, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2$')) {
    const [, iterationsRaw, saltHex, expected] = storedHash.split('$')
    const iterations = Number.parseInt(iterationsRaw, 10)
    if (!Number.isFinite(iterations) || !saltHex || !expected) return false
    const hash = await pbkdf2(pin, fromHex(saltHex), iterations)
    return timingSafeEqual(hash, expected)
  }

  // Ancien format SHA-256 simple
  const legacy = await sha256Legacy(pin)
  return timingSafeEqual(legacy, storedHash)
}

/** Indique si un hash stocké utilise l'ancien format et doit être migré. */
export function needsRehash(storedHash: string): boolean {
  return !storedHash.startsWith(`pbkdf2$${PBKDF2_ITERATIONS}$`)
}
