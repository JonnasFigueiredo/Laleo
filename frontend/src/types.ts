export type TipoExercicio = 'OUCA_E_REPITA' | 'PARES_MINIMOS' | 'RIMA' | 'ESCUTA'

export interface Exercicio {
  id: number
  palavra: string
  fonemaAlvo: string
  dificuldade: number
  dica: string
  tipo: TipoExercicio
  /** "palavra|emoji;palavra|emoji" (escolha) ou "palavra;palavra" (escuta) */
  opcoes: string | null
  respostaCorreta: string | null
}

export interface OpcaoCartao {
  palavra: string
  emoji: string
}

export function parsearOpcoes(exercicio: Exercicio): OpcaoCartao[] {
  if (!exercicio.opcoes) return []
  return exercicio.opcoes.split(';').map((parte) => {
    const [palavra, emoji] = parte.split('|')
    return { palavra: palavra.trim(), emoji: (emoji ?? '').trim() }
  })
}

export interface NotaFonema {
  fonema: string
  nota: number
}

export interface AnaliseFala {
  palavraAlvo: string
  transcricao: string
  notaGeral: number
  fonemas: NotaFonema[]
}

export interface ResultadoResposta {
  correta: boolean
  respostaCorreta: string
}

export type EstadoAvatar = 'idle' | 'falando' | 'ouvindo' | 'comemorando'
