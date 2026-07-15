import { useCallback, useEffect, useState } from 'react'
import { entrarComPin, temPin } from './pinAdulto'

interface Props {
  aoLiberar: () => void
  aoVoltar: () => void
}

type Fase = 'carregando' | 'digitar' | 'criar' | 'confirmar'

/**
 * Portão de PIN da área dos adultos. Na primeira vez pede para criar um
 * PIN de 4 dígitos (com confirmação); depois pede o PIN para entrar. A
 * verificação acontece no servidor (ver pinAdulto.ts), que emite o token
 * exigido pelos endpoints sensíveis. Teclado numérico grande, para toque.
 */
export function PortaoPin({ aoLiberar, aoVoltar }: Props) {
  const [fase, setFase] = useState<Fase>('carregando')
  const [digitos, setDigitos] = useState('')
  const [primeiro, setPrimeiro] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    temPin()
      .then((existe) => setFase(existe ? 'digitar' : 'criar'))
      .catch(() => {
        setFase('digitar')
        setErro('Não consegui falar com o servidor. Ele está no ar?')
      })
  }, [])

  const titulo =
    fase === 'digitar' ? 'Digite o PIN' : fase === 'criar' ? 'Crie um PIN de 4 dígitos' : 'Confirme o PIN'

  const processar = useCallback(
    async (pin: string) => {
      try {
        if (fase === 'digitar') {
          if (await entrarComPin(pin)) {
            aoLiberar()
          } else {
            setErro('PIN incorreto. Tente de novo.')
            setDigitos('')
          }
        } else if (fase === 'criar') {
          setPrimeiro(pin)
          setDigitos('')
          setErro('')
          setFase('confirmar')
        } else {
          if (pin === primeiro) {
            if (await entrarComPin(pin)) {
              aoLiberar()
            } else {
              // Outro aparelho criou um PIN diferente nesse meio-tempo
              setErro('Já existe um PIN diferente. Digite o PIN atual.')
              setDigitos('')
              setFase('digitar')
            }
          } else {
            setErro('Os PINs não coincidem. Vamos de novo.')
            setPrimeiro('')
            setDigitos('')
            setFase('criar')
          }
        }
      } catch {
        setErro('Não consegui falar com o servidor. Tente de novo.')
        setDigitos('')
      }
    },
    [fase, primeiro, aoLiberar],
  )

  // Ao completar 4 dígitos, processa automaticamente
  useEffect(() => {
    if (digitos.length === 4) {
      const pin = digitos
      const t = setTimeout(() => void processar(pin), 120)
      return () => clearTimeout(t)
    }
  }, [digitos, processar])

  const teclar = (d: string) => {
    setErro('')
    setDigitos((atual) => (atual.length < 4 ? atual + d : atual))
  }
  const apagar = () => {
    setErro('')
    setDigitos((atual) => atual.slice(0, -1))
  }

  return (
    <div className="tela">
      <div className="cartao adultos pin-cartao">
        <h2>Área dos adultos</h2>
        <p className="fonema">{fase === 'carregando' ? 'Um instante…' : titulo}</p>

        <div className="pin-pontos">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i < digitos.length ? 'pin-ponto cheio' : 'pin-ponto'} />
          ))}
        </div>

        {erro && <p className="gate-erro">{erro}</p>}

        <div className="teclado-pin">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} className="tecla-pin" disabled={fase === 'carregando'} onClick={() => teclar(d)}>
              {d}
            </button>
          ))}
          <button className="tecla-pin vazia" onClick={aoVoltar} aria-label="Voltar">
            ↩
          </button>
          <button className="tecla-pin" disabled={fase === 'carregando'} onClick={() => teclar('0')}>
            0
          </button>
          <button className="tecla-pin vazia" onClick={apagar} aria-label="Apagar">
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
