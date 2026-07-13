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
  const form = new FormData()
  form.append('audio', audio, 'gravacao.webm')
  const res = await fetch(`/api/exercicios/${exercicioId}/tentativas`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(`Erro ao analisar gravação: ${res.status}`)
  return res.json()
}
