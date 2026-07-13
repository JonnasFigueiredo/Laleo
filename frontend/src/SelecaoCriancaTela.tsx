import { useEffect, useState } from 'react'
import { criarCrianca, listarCriancas } from './api'
import type { Crianca } from './types'

interface Props {
  aoEscolher: (crianca: Crianca) => void
}

const EMOJIS = ['🦊', '🐼', '🦄', '🐸', '🦁', '🐙', '🐰', '🐯']

/** "Quem está brincando?" — perfis separam progresso e álbum por criança. */
export function SelecaoCriancaTela({ aoEscolher }: Props) {
  const [criancas, setCriancas] = useState<Crianca[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarCriancas()
      .then((lista) => {
        setCriancas(lista)
        setCriando(lista.length === 0)
      })
      .catch(() => setErro('Não consegui falar com o servidor. Ele está no ar?'))
      .finally(() => setCarregando(false))
  }, [])

  const salvar = async () => {
    if (!nome.trim()) return
    try {
      const nova = await criarCrianca(nome.trim(), emoji)
      aoEscolher(nova)
    } catch {
      setErro('Não consegui criar o perfil. Tenta de novo?')
    }
  }

  if (carregando) {
    return <div className="tela centro">Carregando...</div>
  }

  return (
    <div className="tela">
      <div className="cartao">
        <h1 className="palavra">Quem vai brincar?</h1>

        {erro && <p className="gate-erro">{erro}</p>}

        {!criando && (
          <>
            <div className="opcoes perfis">
              {criancas.map((c) => (
                <button key={c.id} className="cartao-opcao" onClick={() => aoEscolher(c)}>
                  <span className="opcao-emoji">{c.emoji}</span>
                  <span className="opcao-palavra">{c.nome}</span>
                  <span className="marca-selecao">⭐ {c.estrelas}</span>
                </button>
              ))}
            </div>
            <button className="botao secundario" onClick={() => setCriando(true)}>
              ➕ Novo amiguinho
            </button>
          </>
        )}

        {criando && (
          <>
            <input
              className="gate-entrada nome-crianca"
              placeholder="Nome ou apelido"
              maxLength={20}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
              autoFocus
            />
            <p className="fonema">Escolha seu bichinho</p>
            <div className="grade-emojis">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  className={e === emoji ? 'emoji-opcao ativo' : 'emoji-opcao'}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="acoes">
              {criancas.length > 0 && (
                <button className="botao secundario" onClick={() => setCriando(false)}>
                  Voltar
                </button>
              )}
              <button className="botao" onClick={salvar} disabled={!nome.trim()}>
                Vamos brincar!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
