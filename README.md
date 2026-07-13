# Laleo 🗣️

Aplicativo open source para ajudar **crianças de 3 a 10 anos com dificuldades de fala**:
exercícios de fonoaudiologia gamificados, guiados por um avatar 3D interativo que fala, reage
e conversa. Roda na web (PWA) e é preparado para virar app Android/iOS.

*Laleo* vem do grego **λαλέω** (*laleō*) — falar, tagarelar. O nome também junta os dois
amiguinhos do app: **Lala** + **Leo**.

> ⚠️ **Apoio, não substituição.** O Laleo apoia o desenvolvimento da fala, mas não substitui
> avaliação e terapia com fonoaudiólogo(a). O conteúdo (palavras, pares, progressão) ainda
> **precisa de validação clínica** antes de uso real com crianças.

## O que já funciona

- **4 tipos de exercício fundamentados em metodologia fonoaudiológica** (ver
  [docs/metodologia.md](docs/metodologia.md)):
  - 🎤 **Ouça e repita** — o avatar demonstra, a criança repete, a fala é analisada
  - 🐀🦆 **Pares mínimos** — escolher a figura da palavra falada (contraste fonológico)
  - 🎵 **Rima** — consciência fonológica, sempre falada em voz alta
  - 👂 **Escuta** — bombardeio auditivo, só ouvir sem pressão
  - 49 exercícios cobrindo os fonemas R, S, CH, LH, L, F, V, J, Z, G, C e encontros BR/TR/PR
- **Análise de pronúncia real** com Whisper (transcrição pt-BR) — não é simulação
- **Avatar 3D (VRM)** com voz neural pt-BR **rodando 100% no dispositivo** (nada de áudio
  sai do aparelho): lipsync pela amplitude do áudio, 9 animações profissionais (acenar,
  pular, palmas, pensar, soneca...), reação ao ser cutucado e cochilo quando ninguém brinca
- **Dois amiguinhos** selecionáveis (Lala e Leo), com voz coerente ao personagem
- **Conversa livre com IA** (Claude), com guardrails de conteúdo infantil no backend —
  funciona em modo demo sem chave, e liga o Claude de verdade ao configurar a chave
- **Gamificação**: estrelas por acerto + álbum de 24 figurinhas surpresa (a cada 5 estrelas)
  com celebração de confete
- **Perfis de criança** — cada uma com seu progresso, estrelas e álbum
- **Área dos responsáveis** protegida por PIN, com relatório de progresso por fonema

## Arquitetura

| Módulo | Stack | Papel |
|--------|-------|-------|
| `backend/` | Java 17 · Spring Boot 4 · H2 (dev) / PostgreSQL (prod) | API REST na porta 8081, exercícios, progresso, gamificação, gateway de IA |
| `frontend/` | React · TypeScript · Vite · three.js + @pixiv/three-vrm · Capacitor | Telas, avatar 3D, voz neural, captura de áudio (PWA) |
| `speech-service/` | Node · Whisper (transformers.js) | Transcrição + nota de pronúncia por fonema (porta 8090) |
| `docs/` | Markdown | Arquitetura e fundamentação metodológica |

Fluxo do exercício: o avatar fala a palavra → a criança grava repetindo → o áudio vira WAV no
navegador → backend → speech-service (Whisper) → nota por fonema volta → o avatar comemora e o
progresso é salvo. **A chave da IA e o áudio nunca vão para o cliente** (regras em
[CLAUDE.md](CLAUDE.md)).

Detalhes completos em [docs/arquitetura.md](docs/arquitetura.md).

## Rodando localmente

Pré-requisitos: **JDK 17**, **Node 20+**, **Maven** (ou o wrapper do projeto).

```bash
# 1. Backend (porta 8081)
cd backend
./mvnw spring-boot:run          # em Windows com TLS interceptado, ver CLAUDE.md

# 2. Serviço de fala (porta 8090) — baixa o modelo Whisper na 1ª vez
cd speech-service
npm install && npm start

# 3. Frontend (porta 5173)
cd frontend
npm install && npm run dev
```

Abra <http://localhost:5173>. O serviço de fala é opcional: sem ele, o backend usa uma
análise mock e o app continua funcionando.

### Ligando o Claude (conversa com IA)

A conversa funciona em modo demo (respostas locais) por padrão. Para usar o Claude de verdade,
crie uma chave em [console.anthropic.com](https://console.anthropic.com) e exporte antes de
subir o backend — a chave **só existe no servidor**:

```bash
export LALEO_IA_CHAVE=sk-ant-...    # modelo em laleo.ia.modelo (padrão claude-opus-4-8)
```

## Créditos e licenças dos assets

- Avatares: **Vita** (VRoid samples, CC0) e **DinoKid** (100Avatars / Polygonal Mind, CC0)
- Animações VRMA: idle de **pixiv/ChatVRM** (MIT) e demais de **tk256ailab/vrm-viewer** (MIT)
- Voz: **Piper TTS** (`pt_BR-faber-medium`) via `@mintplex-labs/piper-tts-web`
- Transcrição: **Whisper** via `@huggingface/transformers`

## Roadmap

- [ ] **Validação clínica** do conteúdo com fonoaudiólogo(a) — prioritário
- [ ] Empacotar como app Android/iOS com Capacitor
- [ ] Pontuação de pronúncia por fonema (GOP) além da transcrição
- [ ] Ciclos completos de Hodson e mais interações

## Status

🟢 **MVP funcional** — jogável de ponta a ponta na web. Conteúdo aguardando validação clínica.
