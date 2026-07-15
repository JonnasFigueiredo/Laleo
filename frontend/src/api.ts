import { gravacaoParaWav } from './fala/paraWav'
import { cabecalhoAdulto, tokenAdulto } from './pinAdulto'
import type {
  Album,
  Crianca,
  Exercicio,
  Meta,
  Progresso,
  Relatorio,
  ResultadoResposta,
  ResultadoTentativa,
  TentativaResumo,
  TipoErroFono,
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

function paramSessao(sessaoId?: string): string {
  return sessaoId ? `&sessaoId=${encodeURIComponent(sessaoId)}` : ''
}

export async function enviarTentativa(
  exercicioId: number,
  criancaId: number,
  audio: Blob,
  sessaoId?: string,
): Promise<ResultadoTentativa> {
  const wav = await gravacaoParaWav(audio)
  const form = new FormData()
  form.append('audio', wav, 'gravacao.wav')
  const res = await fetch(
    `${BASE}/api/exercicios/${exercicioId}/tentativas?criancaId=${criancaId}${paramSessao(sessaoId)}`,
    { method: 'POST', body: form },
  )
  if (!res.ok) throw comStatus(`Erro ao analisar gravação: ${res.status}`, res.status)
  return res.json()
}

export async function enviarResposta(
  exercicioId: number,
  criancaId: number,
  escolha: string,
  sessaoId?: string,
): Promise<ResultadoResposta> {
  const res = await fetch(
    `${BASE}/api/exercicios/${exercicioId}/respostas?criancaId=${criancaId}${paramSessao(sessaoId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escolha }),
    },
  )
  if (!res.ok) throw comStatus(`Erro ao enviar resposta: ${res.status}`, res.status)
  return res.json()
}

export async function buscarProgresso(criancaId?: number): Promise<Progresso> {
  const query = criancaId ? `?criancaId=${criancaId}` : ''
  const res = await fetch(`${BASE}/api/progresso${query}`, { headers: cabecalhoAdulto() })
  if (!res.ok) throw new Error(`Erro ao buscar progresso: ${res.status}`)
  return res.json()
}

export async function buscarCrianca(id: number): Promise<Crianca> {
  const res = await fetch(`${BASE}/api/criancas/${id}`)
  if (!res.ok) throw new Error(`Erro ao buscar criança: ${res.status}`)
  return res.json()
}

export async function buscarRelatorio(criancaId: number): Promise<Relatorio> {
  const res = await fetch(`${BASE}/api/relatorio?criancaId=${criancaId}`, {
    headers: cabecalhoAdulto(),
  })
  if (!res.ok) throw new Error(`Erro ao buscar relatório: ${res.status}`)
  return res.json()
}

export async function listarRevisao(
  criancaId: number,
  limite?: number,
  origem?: 'TODAS',
): Promise<TentativaResumo[]> {
  const q = (limite ? `&limite=${limite}` : '') + (origem ? `&origem=${origem}` : '')
  const res = await fetch(`${BASE}/api/tentativas?criancaId=${criancaId}${q}`, {
    headers: cabecalhoAdulto(),
  })
  if (!res.ok) throw new Error(`Erro ao buscar revisão: ${res.status}`)
  return res.json()
}

export async function classificarTentativa(
  id: number,
  tipoErroFono: TipoErroFono,
): Promise<TentativaResumo> {
  const res = await fetch(`${BASE}/api/tentativas/${id}/classificacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cabecalhoAdulto() },
    body: JSON.stringify({ tipoErroFono }),
  })
  if (!res.ok) throw new Error(`Erro ao classificar: ${res.status}`)
  return res.json()
}

export async function listarMetas(criancaId: number): Promise<Meta[]> {
  const res = await fetch(`${BASE}/api/metas?criancaId=${criancaId}`)
  if (!res.ok) throw new Error(`Erro ao buscar metas: ${res.status}`)
  return res.json()
}

export async function adicionarMeta(criancaId: number, fonema: string): Promise<Meta> {
  const res = await fetch(`${BASE}/api/metas?criancaId=${criancaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cabecalhoAdulto() },
    body: JSON.stringify({ fonema }),
  })
  if (!res.ok) throw new Error(`Erro ao adicionar meta: ${res.status}`)
  return res.json()
}

export async function removerMeta(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/metas/${id}`, {
    method: 'DELETE',
    headers: cabecalhoAdulto(),
  })
  if (!res.ok && res.status !== 204) throw new Error(`Erro ao remover meta: ${res.status}`)
}

export async function definirConsentimentoAudio(
  criancaId: number,
  consentido: boolean,
): Promise<Crianca> {
  const res = await fetch(`${BASE}/api/criancas/${criancaId}/consentimento-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cabecalhoAdulto() },
    body: JSON.stringify({ consentido }),
  })
  if (!res.ok) throw new Error(`Erro ao salvar consentimento: ${res.status}`)
  return res.json()
}

/**
 * URL da gravação guardada de uma tentativa (só existe com consentimento).
 * O <audio> não envia headers, então o token da sessão adulta vai na query.
 */
export function urlAudioTentativa(id: number): string {
  const token = tokenAdulto()
  return `${BASE}/api/tentativas/${id}/audio${token ? `?token=${encodeURIComponent(token)}` : ''}`
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
