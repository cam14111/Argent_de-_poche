/**
 * Service de chiffrement/dechiffrement pour les backups
 * Utilise Web Crypto API avec AES-256-GCM
 */

export interface EncryptedBackup {
  encrypted: true
  salt: string
  iv: string
  data: string
  version: number
}

export interface DecryptedBackup {
  encrypted: false
  data: string
}

export type BackupData = EncryptedBackup | DecryptedBackup

const ENCRYPTION_VERSION = 1
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12

/**
 * Convertit un ArrayBuffer en string base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convertit une string base64 en ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Derive une cle AES-256 a partir d'un mot de passe avec PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Importer le mot de passe comme cle brute
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Deriver la cle AES-256 avec PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Chiffre les donnees avec AES-256-GCM
 */
export async function encryptBackup(
  jsonData: string,
  password: string
): Promise<EncryptedBackup> {
  // Generer un sel et un IV aleatoires
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Deriver la cle
  const key = await deriveKey(password, salt)

  // Chiffrer les donnees
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(jsonData)

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    dataBuffer
  )

  return {
    encrypted: true,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(encryptedBuffer),
    version: ENCRYPTION_VERSION,
  }
}

/**
 * Dechiffre les donnees chiffrees avec AES-256-GCM
 */
export async function decryptBackup(
  encryptedBackup: EncryptedBackup,
  password: string
): Promise<string> {
  // Verifier la version
  if (encryptedBackup.version !== ENCRYPTION_VERSION) {
    throw new EncryptionError(
      'version_mismatch',
      `Version de chiffrement non supportee: ${encryptedBackup.version}`
    )
  }

  // Decoder les donnees base64
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedBackup.salt))
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedBackup.iv))
  const encryptedData = base64ToArrayBuffer(encryptedBackup.data)

  // Deriver la cle
  const key = await deriveKey(password, salt)

  try {
    // Dechiffrer les donnees
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encryptedData
    )

    // Decoder en string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch {
    throw new EncryptionError(
      'decryption_failed',
      'Echec du dechiffrement. Verifiez votre mot de passe.'
    )
  }
}

/**
 * Verifie si un backup est chiffre
 */
export function isEncryptedBackup(data: unknown): data is EncryptedBackup {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    obj.encrypted === true &&
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.data === 'string' &&
    typeof obj.version === 'number'
  )
}

/**
 * Valide la force du mot de passe
 */
export function validatePassword(password: string): {
  valid: boolean
  message?: string
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins 8 caracteres.',
    }
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre.',
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre.',
    }
  }

  return { valid: true }
}

/**
 * Erreur specifique au chiffrement
 */
export class EncryptionError extends Error {
  constructor(
    public code: 'version_mismatch' | 'decryption_failed' | 'invalid_password',
    message: string
  ) {
    super(message)
    this.name = 'EncryptionError'
  }
}
