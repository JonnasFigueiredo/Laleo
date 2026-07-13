/**
 * PIN da área dos responsáveis. É um portão para impedir que a criança
 * entre sozinha — não um controle de segurança forte. Guardamos só o
 * hash SHA-256 no aparelho (nunca o PIN em texto plano). Se o adulto
 * esquecer, pode redefinir limpando os dados do app.
 */

const CHAVE = 'laleo.pinAdulto'

export function temPin(): boolean {
  return localStorage.getItem(CHAVE) !== null
}

async function hash(pin: string): Promise<string> {
  const dados = new TextEncoder().encode(`laleo:${pin}`)
  const buffer = await crypto.subtle.digest('SHA-256', dados)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function definirPin(pin: string): Promise<void> {
  localStorage.setItem(CHAVE, await hash(pin))
}

export async function verificarPin(pin: string): Promise<boolean> {
  const salvo = localStorage.getItem(CHAVE)
  return salvo !== null && salvo === (await hash(pin))
}

export function apagarPin(): void {
  localStorage.removeItem(CHAVE)
}
