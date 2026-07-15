import { useEffect, useState } from 'react'
import { buscarRelatorio, listarRevisao } from './api'
import { htmlRelatorio } from './relatorioImpressao'
import type { Crianca, Relatorio, TentativaResumo } from './types'

interface Props {
  crianca: Crianca
  aoVoltar: () => void
}

/**
 * Tela de exportação dos resultados (Passo 2). Gera o relatório em PDF
 * (imprimível, autocontido) e os dados brutos em CSV para o profissional
 * analisar em planilha. Tudo local — nada sai do aparelho para um servidor.
 */
export function ExportarTela({ crianca, aoVoltar }: Props) {
  const [rel, setRel] = useState<Relatorio | null>(null)
  const [tentativas, setTentativas] = useState<TentativaResumo[]>([])

  useEffect(() => {
    buscarRelatorio(crianca.id)
      .then(setRel)
      .catch(() => setRel(null))
    // TODAS as origens: o CSV precisa das tarefas de percepção também,
    // não só das produções da fila de revisão
    listarRevisao(crianca.id, 1000, 'TODAS')
      .then(setTentativas)
      .catch(() => setTentativas([]))
  }, [crianca.id])

  const baixarPdf = () => {
    if (!rel) return
    // iframe oculto em vez de window.open: bloqueadores de popup (padrão em
    // WebView/Capacitor) faziam o botão falhar em silêncio
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.srcdoc = htmlRelatorio(rel, crianca.nome)
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      // remove depois da impressão sair da fila (print é síncrono na maioria
      // dos navegadores, mas alguns disparam onload antes do diálogo fechar)
      setTimeout(() => iframe.remove(), 60_000)
    }
    document.body.appendChild(iframe)
  }

  const baixarCsv = () => {
    const csv = paraCsv(tentativas)
    baixarArquivo(`laleo-${normalizarNome(crianca.nome)}.csv`, csv, 'text/csv;charset=utf-8')
  }

  const semDados = rel !== null && rel.totalTentativas === 0

  return (
    <div className="tela">
      <div className="cartao adultos">
        <h2>Exportar resultados</h2>
        <p>
          Relatório de <strong>{crianca.nome}</strong> para levar à sessão de fonoterapia. Os
          arquivos são gerados no próprio aparelho.
        </p>

        {rel && !semDados && (
          <div className="metricas">
            <div className="metrica">
              <strong>{rel.percentualProducaoCorreta ?? '—'}%</strong>
              <span>produção correta</span>
            </div>
            <div className="metrica">
              <strong>{rel.totalProducoes}</strong>
              <span>produções</span>
            </div>
            <div className="metrica">
              <strong>{rel.sessoes}</strong>
              <span>sessões</span>
            </div>
          </div>
        )}

        {semDados ? (
          <p>Ainda não há resultados para exportar. Pratiquem os exercícios primeiro.</p>
        ) : (
          <div className="acoes-exportar">
            <button className="botao" onClick={baixarPdf} disabled={!rel}>
              Baixar relatório (PDF)
            </button>
            <button className="botao secundario" onClick={baixarCsv} disabled={tentativas.length === 0}>
              Baixar dados (CSV)
            </button>
          </div>
        )}

        <p className="nota-revisao">
          O PDF é o relatório resumido; o CSV traz cada tentativa (palavra, som, posição,
          transcrição, notas e classificação) para análise em planilha.
        </p>

        <button className="botao secundario" onClick={aoVoltar}>
          ← Voltar
        </button>
      </div>
    </div>
  )
}

const COLUNAS = [
  'data',
  'origem',
  'tipo',
  'palavra',
  'fonema',
  'posicao',
  'transcricao',
  'nota_geral',
  'nota_fonema',
  'veredito_auto',
  'erro_fono',
  'sessao',
]

function paraCsv(tentativas: TentativaResumo[]): string {
  const linhas = tentativas.map((t) =>
    [
      t.criadaEm,
      t.origem ?? '',
      t.tipoExercicio ?? '',
      t.palavraAlvo ?? '',
      t.fonemaAlvo,
      t.posicaoAlvo ?? '',
      t.transcricao ?? '',
      String(t.notaGeral),
      t.notaFonema == null ? '' : String(t.notaFonema),
      t.resultadoAuto ?? '',
      t.tipoErroFono ?? '',
      t.sessaoId ?? '',
    ]
      .map(celulaCsv)
      .join(';'),
  )
  // BOM + separador ';' para o Excel pt-BR abrir com acentos e colunas certas
  return '﻿' + [COLUNAS.join(';'), ...linhas].join('\r\n')
}

function celulaCsv(valor: string): string {
  // Célula começando com = + - @ executaria como fórmula no Excel/Sheets
  // (injeção via CSV); o apóstrofo neutraliza sem alterar a leitura
  let v = valor
  if (/^[=+\-@]/.test(v)) {
    v = `'${v}`
  }
  if (/[";\r\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function normalizarNome(nome: string): string {
  return (
    nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase() || 'crianca'
  )
}
