import { listarCriancas } from './api'
import type { Crianca } from './types'

const CHAVE = 'laleo.criancaId'

/** Retoma o perfil da última criança que brincou neste aparelho. */
export async function buscarCriancaAtiva(): Promise<Crianca | null> {
  const id = Number(localStorage.getItem(CHAVE))
  if (!id) return null
  try {
    const criancas = await listarCriancas()
    return criancas.find((c) => c.id === id) ?? null
  } catch {
    return null
  }
}

export function salvarCriancaAtiva(id: number) {
  localStorage.setItem(CHAVE, String(id))
}
