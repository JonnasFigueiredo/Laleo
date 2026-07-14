import { gravacaoParaWav } from './fala/paraWav'
import type {
  Album,
  Crianca,
  Exercicio,
  Progresso,
  ResultadoResposta,
  ResultadoTentativa,
} from './types'

// Na web/dev fica vazio (URLs relativas + proxy do Vite). No app nativo
// (Capacitor) não há proxy: define-se VITE_API_URL para o backend acessível
// (ex.: http://192.168.0.x:8081 na mesma rede, ou um servidor hospedado).
const BASE = import.meta.env.VITE_API_URL ?? ''

export async function listarExercicios(): Promise<Exercicio[]> {
  const res = await fetch(`${BASE}/api/exercicios`)
  if (!res.ok) throw new Error(`Erro ao buscar exercícios: ${res.status}`)
  return res.json()
}

function comStatus(mensagem: string, status: number): Error {
  const erro = new Error(mensagem)
  ;(erro as Error & { status?: number }).status = status
  return erro
}

export async function enviarTentativa(
  exercicioId: number,
  criancaId: number,
  audio: Blob,
): Promise<ResultadoTentativa> {
  const wav = await gravacaoParaWav(audio)
  const form = new FormData()
  form.append('audio', wav, 'gravacao.wav')
  const res = await fetch(`${BASE}/api/exercicios/${exercicioId}/tentativas?criancaId=${criancaId}`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw comStatus(`Erro ao analisar gravação: ${res.status}`, res.status)
  return res.json()
}

export async function enviarResposta(
  exercicioId: number,
  criancaId: number,
  escolha: string,
): Promise<ResultadoResposta> {
  const res = await fetch(`${BASE}/api/exercicios/${exercicioId}/respostas?criancaId=${criancaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escolha }),
  })
  if (!res.ok) throw comStatus(`Erro ao enviar resposta: ${res.status}`, res.status)
  return res.json()
}

export async function buscarProgresso(criancaId?: number): Promise<Progresso> {
  const query = criancaId ? `?criancaId=${criancaId}` : ''
  const res = await fetch(`${BASE}/api/progresso${query}`)
  if (!res.ok) throw new Error(`Erro ao buscar progresso: ${res.status}`)
  return res.json()
}

export async function listarCriancas(): Promise<Crianca[]> {
  const res = await fetch(`${BASE}/api/criancas`)
  if (!res.ok) throw new Error(`Erro ao buscar crianças: ${res.status}`)
  return res.json()
}

export async function criarCrianca(nome: string, emoji: string): Promise<Crianca> {
  const res = await fetch(`${BASE}/api/criancas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, emoji }),
  })
  if (!res.ok) throw new Error(`Erro ao criar perfil: ${res.status}`)
  return res.json()
}

export async function buscarAlbum(criancaId: number): Promise<Album> {
  const res = await fetch(`${BASE}/api/criancas/${criancaId}/figurinhas`)
  if (!res.ok) throw new Error(`Erro ao buscar álbum: ${res.status}`)
  return res.json()
}

export interface FalaConversa {
  pergunta: string
  resposta: string
}

export async function enviarConversa(
  conversaId: string,
  amigo: string,
  audio: Blob,
): Promise<FalaConversa> {
  const wav = await gravacaoParaWav(audio)
  const form = new FormData()
  form.append('conversaId', conversaId)
  form.append('amigo', amigo)
  form.append('audio', wav, 'gravacao.wav')
  const res = await fetch(`${BASE}/api/conversa`, { method: 'POST', body: form })
  if (!res.ok) throw comStatus(`Erro na conversa: ${res.status}`, res.status)
  return res.json()
}
