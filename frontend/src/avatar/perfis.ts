/**
 * Perfis de avatar: modelo 3D + voz coerentes. O adulto escolhe na área
 * dos responsáveis. Três personagens: Lala e Moranguinha (meninas, vozes
 * fofas e agudas) e Leo (menino, voz mais grave).
 *
 * Nota técnica: o Piper só tem voz pt-BR masculina; as vozes fofas são a
 * mesma voz neural com pitch elevado (SoundTouch, ver fala/pitchFofo.ts) —
 * agora SEM acelerar a fala, para a palavra sair clara para a criança.
 */
export interface PerfilAvatar {
  id: string
  nome: string
  emoji: string
  modelo: string
  /** multiplicador de pitch da voz neural: >1 = mais aguda/fofa (sem mudar a velocidade) */
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
    taxaVoz: 1.24,
    tomFallback: 1.6,
  },
  {
    id: 'morango',
    nome: 'Moranguinha',
    emoji: '🍓',
    modelo: '/models/morango.vrm',
    // A mais fofa: voz bem aguda e doce, de menininha pequena
    taxaVoz: 1.32,
    tomFallback: 1.9,
  },
  {
    id: 'leo',
    nome: 'Leo',
    emoji: '🦖',
    modelo: '/models/leo.vrm',
    // Voz de menino: menos aguda que as meninas
    taxaVoz: 1.08,
    tomFallback: 1.15,
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
