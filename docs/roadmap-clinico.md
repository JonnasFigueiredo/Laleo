# Roadmap clínico do Laleo

Plano de evolução do Laleo em três frentes, para que ele deixe de ser um
protótipo e passe a apoiar a terapia de fala com integridade: **prender a
atenção da criança**, **devolver dados úteis ao fonoaudiólogo** e **garantir que
o áudio é capturado e avaliado corretamente**.

> Este documento é o mapa de trabalho. A metodologia dos exercícios está em
> [metodologia.md](metodologia.md); a lista de conteúdo a validar, em
> [validacao-clinica.md](validacao-clinica.md).

## Princípio que orienta tudo

O ingrediente terapêutico é o **número de produções corretas da criança**
(prática massiva; *principles of motor learning*). Toda mecânica de engajamento
precisa **aumentar repetições**, não competir com elas. E nenhuma nota
automática pode ser apresentada como verdade clínica sem validação — o
fonoaudiólogo é o padrão-ouro.

## Frente 1 — Engajamento (sem atrapalhar a fala)

Mecânicas baseadas em autodeterminação (autonomia, competência, vínculo),
aprendizado motor e reforço:

- Meta de dose por sessão (barra que enche com as falas) — alvo ~15–25 produções.
- Jornada/mapa por fonema (mundos) com progressão visível.
- Avatar-companheiro que evolui com estrelas (acessórios).
- Eco/espelho: o avatar repete a fala da criança.
- Dificuldade adaptativa mirando ~70–80% de acerto (flow).
- Escolha/autonomia (tema, avatar, ordem); modo calmo; co-brincar com o adulto.

A evitar: comparação entre crianças, timers punitivos, perder progresso,
reforço só no fim.

## Frente 2 — Devolutiva ao profissional

Capturar por tentativa (base entregue no Passo 1) e computar métricas que o
fono usa: **PCC/PCC-R**, acurácia por fonema e por posição, inventário de
**processos fonológicos**, estimulabilidade, generalização, dose e engajamento.

Formas de devolver: painel do profissional (separado da área dos pais),
relatório PDF por período, ciclo de metas (o fono define alvos → o app monta os
exercícios → reporta) e revisão de áudio (que também gera dados de treino).

## Frente 3 — Validade da captura e da avaliação

Duas perguntas: o áudio é capturado fielmente e a nota é válida.

- **Captura**: desligar o processamento do navegador (AGC/supressão/eco) que
  distorce a produção; pré-roll para não cortar o fonema inicial; checagem de
  sinal (nível, clipping, duração). *(Entregue no Passo 1.)*
- **Nota**: o Whisper é treinado em fala adulta e fluente; para criança — e mais
  ainda a população de terapia — ele erra muito e tende a **"consertar" a fala**
  (falso positivo). O escore atual (similaridade de transcrição) serve como
  *gate* de "falou algo perto", **não** como julgamento clínico de um fonema.
  Caminho: conjunto de referência rotulado pelo fono → medir o sistema → migrar
  para GOP por fonema (wav2vec2/alinhamento) → confiança + humano no circuito.

**LGPD**: validar exige áudio; o fluxo padrão é *stateless* (nada é guardado).
A retenção de áudio para revisão é um armazenamento **separado e consentido**
(responsável e fono), com finalidade limitada, prazo e direito ao apagamento.

## Ordem de execução

O maior ponto de alavancagem: instrumentar os dados + a fila de revisão do fono
resolve as Frentes 2 e 3 juntas (a mesma feature dá a devolutiva e gera o
conjunto de referência que valida o ASR).

| Passo | O quê | Status |
|-------|-------|--------|
| 1 | Modelo de dados rico + qualidade de captura | **Concluído** |
| 2 | Fila de revisão + devolutiva (métricas, PDF, metas, ouvir áudio) | **Concluído** |
| 3 | Medir o ASR contra o conjunto de referência; harness de regressão | A fazer |
| 4 | Engajamento (barra de dose + jornada por fonema) | A fazer |

## Passo 2 — o que foi entregue

**Backend.** `GET /api/relatorio` (acerto de produção como proxy de PCC, acurácia
por fonema e por posição, distribuição de vereditos e de erros do fono);
`GET /api/tentativas` (fila de revisão) e `POST /api/tentativas/{id}/classificacao`
(o fono rotula; o rótulo dele prevalece e vira dado de referência); metas por
criança em `/api/metas` (GET/POST/DELETE, idempotente). Tudo com testes.

**Frontend (área dos responsáveis).** Painel do relatório clínico (métricas,
tabela por fonema/posição, fila de revisão com seletor de erro); **Baixar
relatório (PDF)** — imprime uma página autocontida, sem servidor nem biblioteca
(tudo local); **Metas do profissional** — o fono escolhe os sons-alvo e o app
**prioriza esses exercícios na trilha** (fecha o ciclo terapia → casa).

**Ouvir os clipes (áudio consentido, local).** O responsável liga o
consentimento na área protegida; a partir daí cada produção é guardada como WAV
**no próprio aparelho** (`ArmazenamentoAudio`, pasta `dados/audio`, ignorada pelo
git — nunca vai a servidor externo). O fono ouve na fila de revisão (`GET
/api/tentativas/{id}/audio`). Ao desligar o consentimento, as gravações
guardadas são **apagadas** (LGPD — direito ao apagamento). Verificado por teste
de integração e ao vivo.

**Exportar resultados.** Tela dedicada (área protegida): **PDF** do relatório
(imprimível, autocontido) e **CSV** com cada tentativa para análise em planilha.
Tudo gerado localmente.

**Segurança no servidor (pós-revisão).** O PIN da área dos adultos passou a ser
verificado **no backend** (`AdultoAuthService`), que emite um token de sessão
exigido pelos endpoints sensíveis — fila de revisão, áudio das crianças,
relatório, progresso, metas (escrita) e consentimento. Antes o PIN vivia só no
localStorage e qualquer aparelho na rede podia baixar as gravações por id. O
fluxo da criança (exercícios, tentativas, GET de metas) segue sem PIN.

## Passo 1 — o que foi entregue

**Dados (backend).** `Tentativa` passou a guardar, além de fonema e nota geral:
tipo de exercício, origem (PRODUCAO/ESCOLHA), palavra-alvo, **posição do fonema**
(inicial/medial/final), **transcrição** do ASR, nota do fonema-alvo, **veredito
automático** e **id de sessão**. Campos anuláveis — tentativas antigas seguem
válidas. Persistido em `TentativaController` (produção) e `RespostaController`
(percepção).

**Honestidade na classificação.** O veredito automático
([`ResultadoAuto`](../backend/src/main/java/app/laleo/tentativa/ResultadoAuto.java))
é grosseiro de propósito — `CORRETO` / `ALTERADO` / `INDETERMINADO` — porque a
transcrição ortográfica não permite separar omissão, substituição e distorção de
forma confiável. A tipificação clínica fina
([`TipoErroFono`](../backend/src/main/java/app/laleo/tentativa/TipoErroFono.java))
fica com o fono na revisão (Passo 2). Regras em
[`ClassificadorAuto`](../backend/src/main/java/app/laleo/tentativa/ClassificadorAuto.java),
com testes.

**Captura (frontend).** Gravação sem o processamento do navegador
([`useGravador`](../frontend/src/hooks/useGravador.ts)); **pré-roll** de ~700 ms
antes de pedir a fala, para não cortar o fonema inicial; **checagem de qualidade**
([`qualidadeAudio`](../frontend/src/fala/qualidadeAudio.ts)) que evita mandar
áudio inavaliável e pede para repetir com carinho. Uma sessão de brincadeira
recebe um id que agrupa as tentativas.

**Ainda pendente de teste em dispositivo real:** o pré-roll e a rejeição por
qualidade dependem de microfone; foram verificados por build e lógica, mas
convém experimentar num aparelho com criança.
