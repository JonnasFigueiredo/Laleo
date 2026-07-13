import { useEffect, useMemo, useState } from 'react'
import { buscarProgresso } from './api'
import type { Progresso } from './types'

interface Props {
  aoVoltar: () => void
}

/**
 * Área dos responsáveis/fonoaudiólogo, protegida por portão de adulto
 * (conta de multiplicação — padrão em apps infantis para impedir que a
 * criança entre sozinha).
 */
export function AdultosTela({ aoVoltar }: Props) {
  const desafio = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 6)
    const b = 3 + Math.floor(Math.random() * 6)
    return { a, b, resultado: a * b }
  }, [])
  const [respostaGate, setRespostaGate] = useState('')
  const [liberado, setLiberado] = useState(false)
  const [erroGate, setErroGate] = useState(false)
  const [progresso, setProgresso] = useState<Progresso | null>(null)

  useEffect(() => {
    if (liberado) {
      buscarProgresso().then(setProgresso).catch(() => setProgresso(null))
    }
  }, [liberado])

  const verificarGate = () => {
    if (Number(respostaGate) === desafio.resultado) {
      setLiberado(true)
    } else {
      setErroGate(true)
      setRespostaGate('')
    }
  }

  if (!liberado) {
    return (
      <div className="tela">
        <div className="cartao adultos">
          <h2>Área dos adultos</h2>
          <p>Para continuar, resolva:</p>
          <p className="gate-desafio">
            {desafio.a} × {desafio.b} = ?
          </p>
          <input
            className="gate-entrada"
            type="number"
            inputMode="numeric"
            value={respostaGate}
            onChange={(e) => setRespostaGate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verificarGate()}
            autoFocus
          />
          {erroGate && <p className="gate-erro">Resposta incorreta. Tente novamente.</p>}
          <div className="acoes">
            <button className="botao secundario" onClick={aoVoltar}>
              Voltar
            </button>
            <button className="botao" onClick={verificarGate}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tela">
      <div className="cartao adultos">
        <h2>Progresso da criança</h2>

        {progresso === null ? (
          <p>Carregando o progresso...</p>
        ) : progresso.totalTentativas === 0 ? (
          <p>Ainda não há tentativas registradas. Pratiquem juntos na tela inicial!</p>
        ) : (
          <>
            <p className="resumo-total">
              {progresso.totalTentativas} {progresso.totalTentativas === 1 ? 'tentativa' : 'tentativas'} no total
            </p>
            <div className="relatorio">
              {progresso.porFonema.map((f) => (
                <div key={f.fonema} className="linha-fonema">
                  <span className="rotulo-fonema">Som do {f.fonema}</span>
                  <div className="barra-fundo">
                    <div
                      className={`barra-frente ${f.notaMedia >= 70 ? 'boa' : 'em-treino'}`}
                      style={{ width: `${Math.round(f.notaMedia)}%` }}
                    />
                  </div>
                  <span className="detalhe-fonema">
                    média {Math.round(f.notaMedia)} · {f.tentativas}{' '}
                    {f.tentativas === 1 ? 'tentativa' : 'tentativas'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="orientacoes">
          <h3>Orientações</h3>
          <ul>
            <li>Pratiquem em sessões curtas (5–10 min) e frequentes — de preferência todo dia.</li>
            <li>Celebre as tentativas, não só os acertos. O erro faz parte do aprendizado.</li>
            <li>
              Este app <strong>apoia</strong> o desenvolvimento da fala, mas não substitui
              avaliação e terapia com fonoaudiólogo(a). Se a fala da criança preocupa, procure
              um(a) profissional.
            </li>
            <li>As médias acima são por som treinado — leve-as à sessão de fonoterapia.</li>
          </ul>
        </div>

        <button className="botao" onClick={aoVoltar}>
          ← Voltar para os exercícios
        </button>
      </div>
    </div>
  )
}
