/**
 * PIN da área dos responsáveis — verificado no SERVIDOR. O backend guarda o
 * hash e emite um token de sessão que os endpoints sensíveis (áudio e
 * transcrições das crianças, metas, relatório) exigem. Antes o hash vivia só
 * no localStorage, o que não protegia os dados na rede. O token fica em
 * sessionStorage: fechar o app pede o PIN de novo.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''
const CHAVE_TOKEN = 'laleo.tokenAdulto'

export async function temPin(): Promise<boolean> {
  const res = await fetch(`${BASE}/api/adulto/pin`)
  if (!res.ok) throw new Error(`Erro ao consultar PIN: ${res.status}`)
  const corpo = (await res.json()) as { existe: boolean }
  return corpo.existe
}

/** Cria (primeira vez) ou verifica o PIN; guarda o token da sessão adulta. */
export async function entrarComPin(pin: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/adulto/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  if (res.status === 401) return false
  if (!res.ok) throw new Error(`Erro ao verificar PIN: ${res.status}`)
  const corpo = (await res.json()) as { token: string }
  sessionStorage.setItem(CHAVE_TOKEN, corpo.token)
  return true
}

export function tokenAdulto(): string | null {
  return sessionStorage.getItem(CHAVE_TOKEN)
}

/** Header de autenticação dos endpoints da área adulta. */
export function cabecalhoAdulto(): Record<string, string> {
  const token = tokenAdulto()
  return token ? { 'X-Laleo-Token': token } : {}
}

/** Apaga o PIN no servidor (para trocá-lo) e encerra a sessão local. */
export async function apagarPin(): Promise<void> {
  await fetch(`${BASE}/api/adulto/pin`, { method: 'DELETE', headers: cabecalhoAdulto() })
  sessionStorage.removeItem(CHAVE_TOKEN)
}
