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

export interface Crianca {
  id: number
  nome: string
  emoji: string
  estrelas: number
  audioConsentido?: boolean
}

export interface FigurinhaGanha {
  emoji: string
  nome: string
}

export interface Figurinha extends FigurinhaGanha {
  id: number
}

export interface Album {
  ganhas: Figurinha[]
  totalCatalogo: number
}

export interface ResultadoTentativa {
  analise: AnaliseFala
  estrelas: number | null
  figurinha: FigurinhaGanha | null
}

export interface ResultadoResposta {
  correta: boolean
  respostaCorreta: string
  estrelas: number | null
  figurinha: FigurinhaGanha | null
}

export interface ProgressoFonema {
  fonema: string
  tentativas: number
  notaMedia: number
}

export interface Progresso {
  totalTentativas: number
  porFonema: ProgressoFonema[]
}

// ── Devolutiva ao profissional (Passo 2) ────────────────────────────────
export type ResultadoAuto = 'CORRETO' | 'ALTERADO' | 'INDETERMINADO'
export type TipoErroFono = 'CORRETO' | 'OMISSAO' | 'SUBSTITUICAO' | 'DISTORCAO' | 'ADICAO'

export interface ResumoPosicao {
  posicao: string
  avaliaveis: number
  corretas: number
}

export interface ResumoFonema {
  fonema: string
  tentativas: number
  notaMedia: number
  producoesAvaliaveis: number
  producoesCorretas: number
  porPosicao: ResumoPosicao[]
}

export interface Relatorio {
  totalTentativas: number
  totalProducoes: number
  sessoes: number
  percentualProducaoCorreta: number | null
  vereditosAuto: Record<string, number>
  errosFono: Record<string, number>
  porFonema: ResumoFonema[]
}

export interface Meta {
  id: number
  criancaId: number
  fonema: string
  criadaEm: string
}

export interface TentativaResumo {
  id: number
  exercicioId: number
  tipoExercicio: string | null
  origem: string | null
  fonemaAlvo: string
  palavraAlvo: string | null
  posicaoAlvo: string | null
  transcricao: string | null
  notaGeral: number
  notaFonema: number | null
  resultadoAuto: ResultadoAuto | null
  tipoErroFono: TipoErroFono | null
  sessaoId: string | null
  criadaEm: string
  temAudio: boolean
}

export type EstadoAvatar = 'idle' | 'falando' | 'ouvindo' | 'comemorando' | 'pensando'
