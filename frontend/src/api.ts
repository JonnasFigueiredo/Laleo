import { gravacaoParaWav } from './fala/paraWav'
import type { AnaliseFala, Exercicio } from './types'

export async function listarExercicios(): Promise<Exercicio[]> {
  const res = await fetch('/api/exercicios')
  if (!res.ok) throw new Error(`Erro ao buscar exercícios: ${res.status}`)
  return res.json()
}

export async function enviarTentativa(
  exercicioId: number,
  audio: Blob,
): Promise<AnaliseFala> {
  const wav = await gravacaoParaWav(audio)
  const form = new FormData()
  form.append('audio', wav, 'gravacao.wav')
  const res = await fetch(`/api/exercicios/${exercicioId}/tentativas`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const erro = new Error(`Erro ao analisar gravação: ${res.status}`)
    ;(erro as Error & { status?: number }).status = res.status
    throw erro
  }
  return res.json()
}
