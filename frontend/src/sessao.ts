/**
 * Sessão de brincadeira: agrupa as tentativas de uma mesma sentada. O id
 * vive em sessionStorage por criança — remontar a tela (ir ao álbum e
 * voltar) NÃO cria sessão nova, senão a métrica "sessões" do relatório
 * inflaria. Fechar o app/aba começa outra sessão, que é o comportamento
 * clínico esperado.
 */

function uuid(): string {
  // crypto.randomUUID não existe em contexto não-seguro/WebView antigo
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function obterSessaoId(criancaId: number): string {
  const chave = `laleo.sessao.${criancaId}`
  const atual = sessionStorage.getItem(chave)
  if (atual) return atual
  const novo = uuid()
  sessionStorage.setItem(chave, novo)
  return novo
}
