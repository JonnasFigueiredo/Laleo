import { useCallback, useEffect, useState } from 'react'
import { enviarResposta, enviarTentativa, listarExercicios } from './api'
import { Avatar } from './avatar/Avatar'
import { useFala } from './hooks/useFala'
import { useGravador } from './hooks/useGravador'
import { parsearOpcoes, type AnaliseFala, type EstadoAvatar, type Exercicio } from './types'

type Fase =
  | 'carregando'
  | 'pronto'
  | 'demonstrando'
  | 'gravando'
  | 'analisando'
  | 'resultado'
  | 'escutando'
  | 'erro'

const ELOGIOS = ['Muito bem!', 'Uau, que capricho!', 'Você é demais!', 'Mandou bem!']
const INCENTIVOS = ['Quase lá! Vamos tentar de novo?', 'Boa tentativa! Uma vez mais?']

function sortear(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)]
}

/**
 * Ordena a trilha conforme a metodologia (docs/metodologia.md): para cada
 * fonema, primeiro escuta (input), depois percepção (pares mínimos), depois
 * produção (ouça-e-repita) e por fim consciência fonológica (rima).
 */
const ORDEM_TIPOS = { ESCUTA: 0, PARES_MINIMOS: 1, OUCA_E_REPITA: 2, RIMA: 3 } as const

function ordenarTrilha(lista: Exercicio[]): Exercicio[] {
  return [...lista].sort(
    (a, b) =>
      a.fonemaAlvo.localeCompare(b.fonemaAlvo) ||
      ORDEM_TIPOS[a.tipo] - ORDEM_TIPOS[b.tipo] ||
      a.dificuldade - b.dificuldade,
  )
}

export function ExercicioTela() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [indice, setIndice] = useState(0)
  const [fase, setFase] = useState<Fase>('carregando')
  const [resultado, setResultado] = useState<AnaliseFala | null>(null)
  const [acertou, setAcertou] = useState<boolean | null>(null)
  const [palavraDestacada, setPalavraDestacada] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState('')
  const { falar, statusVoz, progressoVoz, getNivelAudio } = useFala()
  const { gravando, iniciar, parar } = useGravador()

  const exercicio = exercicios[indice]
  const opcoes = exercicio ? parsearOpcoes(exercicio) : []

  const falarAsync = useCallback(
    (texto: string) => new Promise<void>((resolve) => falar(texto, resolve)),
    [falar],
  )

  useEffect(() => {
    listarExercicios()
      .then((bruto) => {
        const lista = ordenarTrilha(bruto)
        setExercicios(lista)
        setFase(lista.length > 0 ? 'pronto' : 'erro')
        if (lista.length === 0) setMensagem('Nenhum exercício encontrado. O backend está no ar?')
      })
      .catch(() => {
        setFase('erro')
        setMensagem('Não consegui falar com o servidor. O backend está no ar?')
      })
  }, [])

  // ── Ouça e repita (produção, Van Riper) ──────────────────────────────
  const demonstrar = useCallback(() => {
    if (!exercicio) return
    setFase('demonstrando')
    const fala =
      exercicio.tipo === 'PARES_MINIMOS'
        ? `${exercicio.dica} Onde está: ${exercicio.palavra}?`
        : exercicio.tipo === 'RIMA'
          ? `${exercicio.dica} O que rima com ${exercicio.palavra}? ${opcoes.map((o) => o.palavra).join(', ou ')}?`
          : `${exercicio.dica} Repita comigo: ${exercicio.palavra}`
    falar(fala, () => setFase('pronto'))
  }, [exercicio, falar, opcoes])

  const comecarGravacao = useCallback(async () => {
    try {
      await iniciar()
      setFase('gravando')
    } catch {
      setFase('erro')
      setMensagem('Preciso da permissão do microfone para te ouvir!')
    }
  }, [iniciar])

  const terminarGravacao = useCallback(async () => {
    setFase('analisando')
    try {
      const audio = await parar()
      const analise = await enviarTentativa(exercicio.id, audio)
      setResultado(analise)
      setFase('resultado')
      falar(analise.notaGeral >= 70 ? sortear(ELOGIOS) : sortear(INCENTIVOS))
    } catch (e) {
      const status = (e as Error & { status?: number }).status
      if (status === 400 || status === 422) {
        setFase('pronto')
        falar('Não consegui te ouvir direitinho. Vamos tentar mais uma vez?')
      } else {
        setFase('erro')
        setMensagem('Ops, algo deu errado na análise. Vamos tentar de novo?')
      }
    }
  }, [exercicio, falar, parar])

  // ── Escolha (pares mínimos / rima) ───────────────────────────────────
  const escolher = useCallback(
    async (palavra: string) => {
      if (fase !== 'pronto') return
      setFase('analisando')
      try {
        const r = await enviarResposta(exercicio.id, palavra)
        setAcertou(r.correta)
        setFase('resultado')
        if (r.correta) {
          falar(sortear(ELOGIOS))
        } else {
          falar(`Quase! A resposta certa é ${r.respostaCorreta}. Vamos ouvir de novo?`)
        }
      } catch {
        setFase('erro')
        setMensagem('Ops, algo deu errado. Vamos tentar de novo?')
      }
    },
    [exercicio, falar, fase],
  )

  const tentarDeNovo = useCallback(() => {
    setAcertou(null)
    setResultado(null)
    setFase('pronto')
    demonstrar()
  }, [demonstrar])

  // ── Escuta (bombardeio auditivo: só ouvir) ───────────────────────────
  const escutar = useCallback(async () => {
    if (!exercicio) return
    setFase('escutando')
    await falarAsync(exercicio.dica)
    for (const opcao of opcoes) {
      setPalavraDestacada(opcao.palavra)
      await falarAsync(opcao.palavra)
      await new Promise((r) => setTimeout(r, 400))
    }
    setPalavraDestacada(null)
    setAcertou(true)
    setFase('resultado')
    falar('Que orelhas atentas! Muito bem!')
  }, [exercicio, falarAsync, opcoes, falar])

  const proximo = useCallback(() => {
    setResultado(null)
    setAcertou(null)
    setPalavraDestacada(null)
    setIndice((i) => (i + 1) % exercicios.length)
    setFase('pronto')
  }, [exercicios.length])

  const estadoAvatar: EstadoAvatar =
    fase === 'demonstrando' || fase === 'escutando'
      ? 'falando'
      : fase === 'gravando'
        ? 'ouvindo'
        : fase === 'resultado' && (acertou === true || (resultado !== null && resultado.notaGeral >= 70))
          ? 'comemorando'
          : 'idle'

  if (fase === 'carregando') {
    return <div className="tela centro">Chamando o Lalê...</div>
  }

  const eEscolha = exercicio?.tipo === 'PARES_MINIMOS' || exercicio?.tipo === 'RIMA'
  const eEscuta = exercicio?.tipo === 'ESCUTA'

  return (
    <div className="tela">
      <Avatar estado={estadoAvatar} getNivelAudio={getNivelAudio} />
      {statusVoz === 'carregando' && progressoVoz > 0 && progressoVoz < 100 && (
        <p className="status-voz">Preparando a voz do Lalê... {progressoVoz}%</p>
      )}

      {fase === 'erro' ? (
        <div className="cartao erro">
          <p>{mensagem}</p>
          <button className="botao" onClick={() => window.location.reload()}>
            Tentar de novo
          </button>
        </div>
      ) : (
        <div className="cartao">
          <p className="fonema">Som do {exercicio.fonemaAlvo}</p>
          <h1 className="palavra">
            {exercicio.tipo === 'RIMA' ? `O que rima com ${exercicio.palavra}?` : exercicio.palavra}
          </h1>

          {/* Cartões de escolha: pares mínimos e rima */}
          {eEscolha && fase !== 'resultado' && (
            <div className="opcoes">
              {opcoes.map((o) => (
                <button
                  key={o.palavra}
                  className="cartao-opcao"
                  disabled={fase !== 'pronto'}
                  onClick={() => escolher(o.palavra)}
                >
                  <span className="opcao-emoji">{o.emoji}</span>
                  <span className="opcao-palavra">{o.palavra}</span>
                </button>
              ))}
            </div>
          )}

          {/* Sequência do modo escuta */}
          {eEscuta && fase === 'escutando' && (
            <div className="sequencia-escuta">
              {opcoes.map((o) => (
                <span
                  key={o.palavra}
                  className={o.palavra === palavraDestacada ? 'palavra-escuta ativa' : 'palavra-escuta'}
                >
                  {o.palavra}
                </span>
              ))}
            </div>
          )}

          {fase === 'resultado' ? (
            <>
              {resultado && (
                <div className="estrelas" aria-label={`Nota ${resultado.notaGeral} de 100`}>
                  {'⭐'.repeat(Math.max(1, Math.round(resultado.notaGeral / 20)))}
                </div>
              )}
              {acertou !== null && !resultado && (
                <div className="estrelas">{acertou ? '⭐⭐⭐⭐⭐' : '💪'}</div>
              )}
              <div className="acoes">
                {acertou === false ? (
                  <button className="botao" onClick={tentarDeNovo}>
                    🔁 Tentar de novo
                  </button>
                ) : (
                  <button className="botao secundario" onClick={demonstrar}>
                    🔁 Ouvir de novo
                  </button>
                )}
                <button className="botao" onClick={proximo}>
                  ➡️ Próxima
                </button>
              </div>
            </>
          ) : (
            <div className="acoes">
              {eEscuta ? (
                <button className="botao" onClick={escutar} disabled={fase !== 'pronto'}>
                  👂 Escutar
                </button>
              ) : (
                <>
                  <button className="botao secundario" onClick={demonstrar} disabled={fase !== 'pronto'}>
                    🔊 Ouvir
                  </button>
                  {!eEscolha &&
                    (gravando ? (
                      <button className="botao gravando" onClick={terminarGravacao}>
                        ⏹️ Pronto!
                      </button>
                    ) : (
                      <button className="botao" onClick={comecarGravacao} disabled={fase !== 'pronto'}>
                        🎤 Minha vez!
                      </button>
                    ))}
                </>
              )}
            </div>
          )}
          {fase === 'analisando' && <p className="status">O Lalê está pensando...</p>}
        </div>
      )}
    </div>
  )
}
