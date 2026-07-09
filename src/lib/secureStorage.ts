import { supabase } from './supabase'

const SALT_KEY = 'psi-secure-salt'

async function deriveKey(): Promise<CryptoKey> {
  const session = (await supabase.auth.getSession()).data.session
  if (!session) throw new Error('No active session')
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(session.access_token.slice(0, 32)),
    'PBKDF2', false, ['deriveKey']
  )
  let salt = localStorage.getItem(SALT_KEY)
  if (!salt) { salt = crypto.randomUUID(); localStorage.setItem(SALT_KEY, salt) }
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
}

export async function secureSet(key: string, value: unknown): Promise<void> {
  try {
    const cryptoKey = await deriveKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, cryptoKey, enc.encode(JSON.stringify(value))
    )
    localStorage.setItem(key, JSON.stringify({
      iv: Array.from(iv),
      data: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    }))
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export async function secureGet<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { iv, data } = JSON.parse(raw)
    const cryptoKey = await deriveKey()
    const ciphertext = Uint8Array.from(atob(data), c => c.charCodeAt(0))
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) }, cryptoKey, ciphertext
    )
    return JSON.parse(new TextDecoder().decode(plaintext)) as T
  } catch { return null }
}

export function secureRemove(key: string) {
  localStorage.removeItem(key)
}