import { useEffect, useState } from 'react'
import { buscarAlbum, buscarCrianca, buscarProgresso, definirConsentimentoAudio } from './api'
import { ExportarTela } from './ExportarTela'
import { MetasFono } from './MetasFono'
import { PortaoPin } from './PortaoPin'
import { RelatorioProfissional } from './RelatorioProfissional'
import { apagarPin } from './pinAdulto'
import { PERFIS, perfilDisponivel, type PerfilAvatar } from './avatar/perfis'
import type { Crianca, Progresso } from './types'

interface Props {
  aoVoltar: () => void
  perfilAtual: PerfilAvatar
  aoTrocarPerfil: (perfil: PerfilAvatar) => void
  crianca: Crianca
}

/**
 * Área dos responsáveis/fonoaudiólogo, protegida por PIN — o adulto cria
 * um PIN na primeira vez e digita nas próximas, impedindo que a criança
 * entre sozinha.
 */
export function AdultosTela({ aoVoltar, perfilAtual, aoTrocarPerfil, crianca }: Props) {
  const [liberado, setLiberado] = useState(false)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [figurinhas, setFigurinhas] = useState(0)
  const [consentido, setConsentido] = useState(!!crianca.audioConsentido)
  const [mostrarExportar, setMostrarExportar] = useState(false)
  // Muda a cada alteração de consentimento → remonta o relatório, para os
  // players de áudio não apontarem para gravações recém-apagadas
  const [versaoConsentimento, setVersaoConsentimento] = useState(0)

  const alternarConsentimento = async () => {
    const novo = !consentido
    setConsentido(novo)
    try {
      await definirConsentimentoAudio(crianca.id, novo)
      setVersaoConsentimento((v) => v + 1)
    } catch {
      setConsentido(!novo)
    }
  }

  useEffect(() => {
    if (liberado) {
      buscarProgresso(crianca.id).then(setProgresso).catch(() => setProgresso(null))
      // O `crianca` do App pode estar velho (não é atualizado após o toggle):
      // o estado real do consentimento vem sempre do servidor
      buscarCrianca(crianca.id)
        .then((c) => setConsentido(!!c.audioConsentido))
        .catch(() => {})
      // Desbloqueio de avatar (ex.: Moranguinha com 10 figurinhas)
      buscarAlbum(crianca.id)
        .then((a) => setFigurinhas(a.ganhas.length))
        .catch(() => setFigurinhas(0))
    }
  }, [liberado, crianca.id])

  const trocarPin = () => {
    void apagarPin().finally(() => setLiberado(false))
  }

  if (!liberado) {
    return <PortaoPin aoLiberar={() => setLiberado(true)} aoVoltar={aoVoltar} />
  }

  if (mostrarExportar) {
    return <ExportarTela crianca={crianca} aoVoltar={() => setMostrarExportar(false)} />
  }

  return (
    <div className="tela">
      <div className="cartao adultos">
        <h2>Amiguinho da criança</h2>
        <p>Escolha quem vai guiar os exercícios — a voz acompanha o personagem.</p>
        <div className="opcoes">
          {PERFIS.map((p) => {
            const liberadoPerfil = perfilDisponivel(p, figurinhas)
            return (
              <button
                key={p.id}
                className={
                  !liberadoPerfil
                    ? 'cartao-opcao bloqueado'
                    : p.id === perfilAtual.id
                      ? 'cartao-opcao selecionado'
                      : 'cartao-opcao'
                }
                disabled={!liberadoPerfil}
                onClick={() => aoTrocarPerfil(p)}
              >
                <span className="opcao-emoji">{liberadoPerfil ? p.emoji : '🔒'}</span>
                <span className="opcao-palavra">{p.nome}</span>
                {!liberadoPerfil ? (
                  <span className="marca-selecao">
                    {figurinhas}/{p.desbloqueioFigurinhas} figurinhas
                  </span>
                ) : (
                  p.id === perfilAtual.id && <span className="marca-selecao">✓ escolhido</span>
                )}
              </button>
            )
          })}
        </div>

        <h2>
          Progresso de {crianca.emoji} {crianca.nome} — ⭐ {crianca.estrelas}
        </h2>

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

        <h2>Metas do profissional</h2>
        <MetasFono criancaId={crianca.id} />

        <h2>Gravações</h2>
        <label className="consentimento">
          <input type="checkbox" checked={consentido} onChange={alternarConsentimento} />
          <span>
            Guardar as gravações de {crianca.nome} <strong>neste aparelho</strong> para o(a)
            fonoaudiólogo(a) ouvir na revisão. Ficam só aqui; ao desligar, as gravações guardadas
            são apagadas.
          </span>
        </label>

        <h2>Relatório clínico</h2>
        <RelatorioProfissional key={versaoConsentimento} criancaId={crianca.id} />

        <button className="botao secundario exportar" onClick={() => setMostrarExportar(true)}>
          Exportar resultados
        </button>

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
        <button className="trocar-pin" onClick={trocarPin}>
          Trocar o PIN
        </button>
      </div>
    </div>
  )
}
