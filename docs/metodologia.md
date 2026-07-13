# Fundamentação metodológica das interações

As interações do Laleo seguem as abordagens de terapia para desvios fonológicos com melhor
evidência na literatura de fonoaudiologia/patologia da fala. Este documento mapeia cada
abordagem → interação implementada. **O app apoia a terapia conduzida por fonoaudiólogo(a);
não a substitui** — a seleção de alvos e a alta são decisões clínicas.

## 1. Pares mínimos (contraste fonológico) → interação `PARES_MINIMOS`

Weiner (1981), Blache (1982); revisão recente de Baker (2021). A abordagem mais usada por
fonoaudiólogos para desvios fonológicos consistentes: a criança percebe que trocar um único
fonema muda o significado ("Rato" ≠ "Pato").

**No app:** o Lalê fala a palavra alvo; a criança escolhe entre dois cartões (figura + palavra)
que diferem por um fonema. Trabalha a *percepção* antes da produção. Acerto/erro alimenta o
progresso por fonema.

## 2. Estimulação auditiva focalizada (bombardeio auditivo) → interação `ESCUTA`

Componente central da abordagem de Ciclos de Hodson: no início e fim da sessão a criança
*apenas escuta* uma lista de palavras carregadas no padrão alvo, sem pressão de produção.

**No app:** modo "escuta" — o Lalê fala uma sequência de palavras do fonema em treino,
destacando cada uma na tela. Sem nota, sem microfone: exposição de baixa pressão.

## 3. Consciência fonológica → interação `RIMA`

Estudos com crianças brasileiras com fala desviante mostram defasagem em consciência
silábica/fonêmica (Marchetti et al.; SciELO/UFSM), e RCTs mostram que percepção auditiva
combinada com correspondência onset-rima melhora percepção fonêmica e acurácia articulatória
(o treino de consciência fonológica *isolado* não basta — por isso ela entra integrada às
demais interações, não sozinha).

**No app:** o Lalê pergunta "o que rima com X?" e a criança escolhe entre cartões. As palavras
são sempre faladas em voz alta (a rima é um julgamento auditivo, não visual).

## 4. Hierarquia de complexidade (terapia articulatória tradicional, Van Riper) → `OUCA_E_REPITA`

Progressão clássica: som isolado → sílaba → palavra → frase → conversa. O campo `dificuldade`
dos exercícios codifica essa hierarquia (1 = palavra curta, 2 = palavra longa, 3 = frase) e a
trilha de cada fonema é ordenada por ela.

## 5. Reforço positivo

Feedback sempre celebratório ou encorajador, nunca punitivo — princípio transversal em todas
as abordagens infantis. Erro em exercício de escolha → o Lalê nomeia a resposta certa e
oferece nova tentativa; nota baixa em produção → incentivo e repetição.

## Roadmap metodológico (não implementado)

- **Ciclos completos de Hodson**: rotacionar padrões-alvo por período (requer plano terapêutico)
- **Oposições máximas / multiple oppositions**: variações do contraste para desvios mais graves
- **Educação parental**: relatórios e orientação de prática em casa para responsáveis
- **Envolvimento clínico**: validação do conteúdo (palavras, pares, progressão) por fonoaudiólogo(a) — PENDENTE e prioritário antes de uso real

## Referências

- Baker, E. (2021). *Minimal pairs intervention*. Em revisões de intervenção para SSD.
- Hodson, B. & Paden, E. — *Cycles Phonological Remediation Approach*.
- Weiner, F. (1981); Blache, S. (1982) — terapia de contrastes/pares mínimos.
- Storkel, H. — seleção de alvos e complexidade.
- ASHA Practice Portal: Speech Sound Disorders — https://pubs.asha.org/doi/10.1044/2020_LSHSS-20-00092
- RCT tratamento integrado para SSD: https://pmc.ncbi.nlm.nih.gov/articles/PMC8700312/
- Consciência fonológica em pt-BR: https://www.scielo.br/j/rcefac/a/8NRLR3srMNJg5FXFsNbkGbN/
- Abordagem contrastiva (UFSM): https://repositorio.ufsm.br/handle/1/465
