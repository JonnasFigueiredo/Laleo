import { useCallback, useEffect, useState } from 'react'
import { definirPin, temPin, verificarPin } from './pinAdulto'

interface Props {
  aoLiberar: () => void
  aoVoltar: () => void
}

type Fase = 'digitar' | 'criar' | 'confirmar'

/**
 * Portão de PIN da área dos adultos. Na primeira vez pede para criar um
 * PIN de 4 dígitos (com confirmação); depois pede o PIN para entrar.
 * Teclado numérico grande, adequado a toque.
 */
export function PortaoPin({ aoLiberar, aoVoltar }: Props) {
  const [fase, setFase] = useState<Fase>(temPin() ? 'digitar' : 'criar')
  const [digitos, setDigitos] = useState('')
  const [primeiro, setPrimeiro] = useState('')
  const [erro, setErro] = useState('')

  const titulo =
    fase === 'digitar' ? 'Digite o PIN' : fase === 'criar' ? 'Crie um PIN de 4 dígitos' : 'Confirme o PIN'

  const processar = useCallback(
    async (pin: string) => {
      if (fase === 'digitar') {
        if (await verificarPin(pin)) {
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
          await definirPin(pin)
          aoLiberar()
        } else {
          setErro('Os PINs não coincidem. Vamos de novo.')
          setPrimeiro('')
          setDigitos('')
          setFase('criar')
        }
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
        <p className="fonema">{titulo}</p>

        <div className="pin-pontos">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i < digitos.length ? 'pin-ponto cheio' : 'pin-ponto'} />
          ))}
        </div>

        {erro && <p className="gate-erro">{erro}</p>}

        <div className="teclado-pin">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} className="tecla-pin" onClick={() => teclar(d)}>
              {d}
            </button>
          ))}
          <button className="tecla-pin vazia" onClick={aoVoltar} aria-label="Voltar">
            ↩
          </button>
          <button className="tecla-pin" onClick={() => teclar('0')}>
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
