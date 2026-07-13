import { useCallback, useMemo, useRef, useState } from 'react'
import { enviarConversa } from './api'
import { Avatar } from './avatar/Avatar'
import type { PerfilAvatar } from './avatar/perfis'
import { useFala } from './hooks/useFala'
import { useGravador } from './hooks/useGravador'
import type { EstadoAvatar } from './types'

interface Props {
  perfil: PerfilAvatar
  aoVoltar: () => void
}

interface Balao {
  quem: 'crianca' | 'amigo'
  texto: string
}

/**
 * Conversa livre com o amiguinho: a criança fala, o Whisper transcreve,
 * a IA responde (com guardrails no backend) e o avatar fala a resposta.
 */
export function ConversaTela({ perfil, aoVoltar }: Props) {
  const conversaId = useMemo(() => crypto.randomUUID(), [])
  const [baloes, setBaloes] = useState<Balao[]>([])
  const [fase, setFase] = useState<'pronto' | 'gravando' | 'pensando' | 'falando'>('pronto')
  const [erro, setErro] = useState('')
  const { falar, getNivelAudio } = useFala()
  const { gravando, iniciar, parar } = useGravador()
  const fimRef = useRef<HTMLDivElement>(null)

  const comecar = useCallback(async () => {
    setErro('')
    try {
      await iniciar()
      setFase('gravando')
    } catch {
      setErro('Preciso da permissão do microfone para te ouvir!')
    }
  }, [iniciar])

  const terminar = useCallback(async () => {
    setFase('pensando')
    try {
      const audio = await parar()
      const fala = await enviarConversa(conversaId, perfil.nome, audio)
      setBaloes((b) => [
        ...b,
        { quem: 'crianca', texto: fala.pergunta },
        { quem: 'amigo', texto: fala.resposta },
      ])
      setFase('falando')
      falar(fala.resposta, () => setFase('pronto'))
      setTimeout(() => fimRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      const status = (e as Error & { status?: number }).status
      setFase('pronto')
      if (status === 422 || status === 400) {
        falar('Não consegui te ouvir direitinho. Fala de novo?')
      } else {
        setErro('Ops, não consegui conversar agora. Vamos tentar de novo?')
      }
    }
  }, [conversaId, falar, parar, perfil.nome])

  const estadoAvatar: EstadoAvatar =
    fase === 'falando' ? 'falando' : fase === 'gravando' ? 'ouvindo' : 'idle'

  return (
    <div className="tela conversa">
      <button className="botao-adultos" onClick={aoVoltar} aria-label="Voltar">
        ↩️
      </button>
      <Avatar estado={estadoAvatar} modelo={perfil.modelo} getNivelAudio={getNivelAudio} />

      <div className="cartao conversa-cartao">
        <p className="fonema">Conversando com {perfil.nome}</p>

        <div className="baloes">
          {baloes.length === 0 && (
            <p className="status">Aperte o botão e fala comigo! 😊</p>
          )}
          {baloes.map((b, i) => (
            <p key={i} className={b.quem === 'crianca' ? 'balao crianca' : 'balao amigo'}>
              {b.texto}
            </p>
          ))}
          <div ref={fimRef} />
        </div>

        {erro && <p className="gate-erro">{erro}</p>}

        <div className="acoes">
          {gravando ? (
            <button className="botao gravando" onClick={terminar}>
              ⏹️ Pronto!
            </button>
          ) : (
            <button className="botao" onClick={comecar} disabled={fase !== 'pronto'}>
              🎤 Falar
            </button>
          )}
        </div>
        {fase === 'pensando' && <p className="status">{perfil.nome} está pensando...</p>}
      </div>
    </div>
  )
}
