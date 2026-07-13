export interface Exercicio {
  id: number
  palavra: string
  fonemaAlvo: string
  dificuldade: number
  dica: string
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

export type EstadoAvatar = 'idle' | 'falando' | 'ouvindo' | 'comemorando'
