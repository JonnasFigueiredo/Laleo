/**
 * Perfis de avatar: modelo 3D + voz coerentes. O nome do app vem daqui:
 * Laleo = Lala + Leo. O adulto escolhe na área dos responsáveis.
 *
 * Nota técnica: o Piper só tem vozes pt-BR masculinas; a voz da Lala é a
 * mesma voz neural com pitch elevado via playbackRate (estilo desenho
 * animado). Quando houver voz feminina pt-BR local, trocar aqui.
 */
export interface PerfilAvatar {
  id: string
  nome: string
  emoji: string
  modelo: string
  /** playbackRate do áudio neural: >1 = voz mais aguda (e um pouco mais rápida) */
  taxaVoz: number
  /** pitch do speechSynthesis no fallback */
  tomFallback: number
}

export const PERFIS: PerfilAvatar[] = [
  {
    id: 'lala',
    nome: 'Lala',
    emoji: '👧',
    modelo: '/models/lala.vrm',
    taxaVoz: 1.18,
    tomFallback: 1.5,
  },
  {
    id: 'leo',
    nome: 'Leo',
    emoji: '👦',
    modelo: '/models/leo.vrm',
    taxaVoz: 1.0,
    tomFallback: 1.0,
  },
]

const CHAVE = 'laleo.avatar'

export function carregarPerfil(): PerfilAvatar {
  const id = localStorage.getItem(CHAVE)
  return PERFIS.find((p) => p.id === id) ?? PERFIS[0]
}

export function salvarPerfil(id: string) {
  localStorage.setItem(CHAVE, id)
}
