import type { Relatorio } from './types'

/**
 * Monta um HTML autocontido e imprimível do relatório clínico. O painel abre
 * numa janela nova e chama print() — o navegador salva como PDF, sem servidor
 * nem biblioteca (tudo local). Pensado para o fono levar à sessão.
 */
export function htmlRelatorio(rel: Relatorio, nomeCrianca: string): string {
  const data = new Date().toLocaleDateString('pt-BR')
  const pct = rel.percentualProducaoCorreta === null ? '—' : `${rel.percentualProducaoCorreta}%`

  const linhasFonema = rel.porFonema
    .map((f) => {
      const posicoes = f.porPosicao.map((p) => `${p.posicao}: ${p.corretas}/${p.avaliaveis}`).join('; ') || '—'
      return `<tr>
        <td>${escapar(f.fonema)}</td>
        <td>${f.tentativas}</td>
        <td>${f.producoesCorretas}/${f.producoesAvaliaveis}</td>
        <td>${Math.round(f.notaMedia)}</td>
        <td>${posicoes}</td>
      </tr>`
    })
    .join('')

  const errosFono = Object.entries(rel.errosFono)
  const blocoErros = errosFono.length
    ? `<h2>Erros classificados pelo profissional</h2>
       <ul>${errosFono.map(([k, v]) => `<li>${escapar(rotuloErro(k))}: ${v}</li>`).join('')}</ul>`
    : ''

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Laleo — ${escapar(nomeCrianca)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, Arial, sans-serif; color: #222; margin: 32px; line-height: 1.45; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  h2 { font-size: 15px; margin: 22px 0 6px; color: #444; }
  .sub { color: #666; font-size: 13px; margin-bottom: 18px; }
  .metricas { display: flex; gap: 16px; margin: 12px 0 4px; }
  .metrica { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; min-width: 120px; }
  .metrica b { display: block; font-size: 20px; }
  .metrica span { font-size: 12px; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 6px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f4f2fb; }
  .aviso { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
  .assinatura { margin-top: 40px; font-size: 13px; }
  .linha-assinatura { margin-top: 34px; border-top: 1px solid #333; width: 280px; padding-top: 4px; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <h1>Relatório de prática — Laleo</h1>
  <div class="sub">Criança: <b>${escapar(nomeCrianca)}</b> · Gerado em ${data}</div>

  <div class="metricas">
    <div class="metrica"><b>${pct}</b><span>produção correta</span></div>
    <div class="metrica"><b>${rel.totalProducoes}</b><span>produções</span></div>
    <div class="metrica"><b>${rel.sessoes}</b><span>sessões</span></div>
    <div class="metrica"><b>${rel.totalTentativas}</b><span>tentativas no total</span></div>
  </div>

  <h2>Desempenho por som</h2>
  <table>
    <thead><tr><th>Som</th><th>Tentativas</th><th>Produção correta</th><th>Nota média</th><th>Por posição (avaliadas)</th></tr></thead>
    <tbody>${linhasFonema || '<tr><td colspan="5">Sem dados</td></tr>'}</tbody>
  </table>

  ${blocoErros}

  <div class="assinatura">
    <div>Observações do(a) fonoaudiólogo(a):</div>
    <div class="linha-assinatura">Assinatura / CRFa</div>
  </div>

  <p class="aviso">
    O Laleo é uma ferramenta de apoio à prática e não substitui a avaliação e a terapia
    fonoaudiológicas. A "produção correta" é uma estimativa automática do reconhecimento de fala,
    aproximada para a fala infantil — vale como tendência, não como diagnóstico. Onde há
    classificação do profissional, ela prevalece sobre a automática.
  </p>
</body></html>`
}

function rotuloErro(chave: string): string {
  const mapa: Record<string, string> = {
    CORRETO: 'Correto',
    OMISSAO: 'Omissão',
    SUBSTITUICAO: 'Substituição',
    DISTORCAO: 'Distorção',
    ADICAO: 'Adição',
  }
  return mapa[chave] ?? chave
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
}
