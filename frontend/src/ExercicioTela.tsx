import { useCallback, useEffect, useState } from 'react'
import { enviarTentativa, listarExercicios } from './api'
import { Avatar } from './avatar/Avatar'
import { useFala } from './hooks/useFala'
import { useGravador } from './hooks/useGravador'
import type { AnaliseFala, EstadoAvatar, Exercicio } from './types'

type Fase = 'carregando' | 'pronto' | 'demonstrando' | 'gravando' | 'analisando' | 'resultado' | 'erro'

const ELOGIOS = ['Muito bem!', 'Uau, que capricho!', 'Você é demais!', 'Mandou bem!']
const INCENTIVOS = ['Quase lá! Vamos tentar de novo?', 'Boa tentativa! Uma vez mais?']

export function ExercicioTela() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [indice, setIndice] = useState(0)
  const [fase, setFase] = useState<Fase>('carregando')
  const [resultado, setResultado] = useState<AnaliseFala | null>(null)
  const [mensagem, setMensagem] = useState('')
  const { falar } = useFala()
  const { gravando, iniciar, parar } = useGravador()

  const exercicio = exercicios[indice]

  useEffect(() => {
    listarExercicios()
      .then((lista) => {
        setExercicios(lista)
        setFase(lista.length > 0 ? 'pronto' : 'erro')
        if (lista.length === 0) setMensagem('Nenhum exercício encontrado. O backend está no ar?')
      })
      .catch(() => {
        setFase('erro')
        setMensagem('Não consegui falar com o servidor. O backend está no ar?')
      })
  }, [])

  const demonstrar = useCallback(() => {
    if (!exercicio) return
    setFase('demonstrando')
    falar(`${exercicio.dica} Repita comigo: ${exercicio.palavra}`, () => setFase('pronto'))
  }, [exercicio, falar])

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
      const frase =
        analise.notaGeral >= 70
          ? ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)]
          : INCENTIVOS[Math.floor(Math.random() * INCENTIVOS.length)]
      falar(frase)
    } catch {
      setFase('erro')
      setMensagem('Ops, algo deu errado na análise. Vamos tentar de novo?')
    }
  }, [exercicio, falar, parar])

  const proximo = useCallback(() => {
    setResultado(null)
    setIndice((i) => (i + 1) % exercicios.length)
    setFase('pronto')
  }, [exercicios.length])

  const estadoAvatar: EstadoAvatar =
    fase === 'demonstrando'
      ? 'falando'
      : fase === 'gravando'
        ? 'ouvindo'
        : fase === 'resultado' && resultado !== null && resultado.notaGeral >= 70
          ? 'comemorando'
          : 'idle'

  if (fase === 'carregando') {
    return <div className="tela centro">Chamando o Lalê...</div>
  }

  return (
    <div className="tela">
      <Avatar estado={estadoAvatar} />

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
          <h1 className="palavra">{exercicio.palavra}</h1>

          {fase === 'resultado' && resultado ? (
            <>
              <div className="estrelas" aria-label={`Nota ${resultado.notaGeral} de 100`}>
                {'⭐'.repeat(Math.max(1, Math.round(resultado.notaGeral / 20)))}
              </div>
              <div className="acoes">
                <button className="botao secundario" onClick={demonstrar}>
                  🔁 Ouvir de novo
                </button>
                <button className="botao" onClick={proximo}>
                  ➡️ Próxima palavra
                </button>
              </div>
            </>
          ) : (
            <div className="acoes">
              <button className="botao secundario" onClick={demonstrar} disabled={fase !== 'pronto'}>
                🔊 Ouvir
              </button>
              {gravando ? (
                <button className="botao gravando" onClick={terminarGravacao}>
                  ⏹️ Pronto!
                </button>
              ) : (
                <button className="botao" onClick={comecarGravacao} disabled={fase !== 'pronto'}>
                  🎤 Minha vez!
                </button>
              )}
            </div>
          )}
          {fase === 'analisando' && <p className="status">O Lalê está ouvindo com atenção...</p>}
        </div>
      )}
    </div>
  )
}
