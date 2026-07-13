# Laleo

Aplicativo para ajudar crianças (3–10 anos) com dificuldades de fala: exercícios de fonoaudiologia gamificados, apresentados por um avatar 3D interativo com IA. Roda na web (PWA) e em celulares (Android/iOS). Nome vem do grego *laleō* (λαλέω) = falar/tagarelar.

## Arquitetura

| Módulo | Pasta | Stack | Papel |
|--------|-------|-------|-------|
| Backend | `backend/` | Java 17, Spring Boot 4.1, Maven, H2 (dev) / PostgreSQL (prod) | API REST na porta **8081**, exercícios, progresso, gateway de IA |
| Frontend | `frontend/` | React + TS + Vite, three.js + @pixiv/three-vrm, Capacitor | Telas, avatar 3D VRM, captura de áudio, PWA + apps mobile |
| Voz | `frontend/src/fala/` | Piper TTS (`@mintplex-labs/piper-tts-web`), voz `pt_BR-faber-medium` | TTS neural 100% no dispositivo (WASM); fallback speechSynthesis |
| Serviço de fala | `speech-service/` | Node + Whisper-small (transformers.js), porta **8090** | v0: transcrição + nota por similaridade; iniciar com `npm start` (usa `--use-system-ca`) |
| Docs | `docs/` | Markdown | Decisões de arquitetura e pesquisa |

Fluxo principal: criança ouve o avatar demonstrar a palavra → grava repetindo → frontend envia o áudio ao backend → backend chama o speech-service → resultado (nota por fonema) volta e o avatar reage/comemora → progresso persiste.

## Regras invioláveis

1. **Chaves de API (LLM, TTS) só existem no backend** — nunca no cliente.
2. **LGPD**: voz de criança é dado sensível. Áudio é processado e descartado; nada de logs com conteúdo identificável.
3. **Conteúdo para criança passa por guardrails**: toda saída de LLM é filtrada no backend antes de chegar ao app.
4. **UX infantil**: feedback sempre positivo, botões grandes, áudio como guia; área adulta separada por gate.

## Agentes disponíveis

- `laleo-backend` — backend Java/Spring Boot
- `laleo-frontend` — React, avatar 3D, Capacitor
- `laleo-fala` — serviço de análise de fala/ML

## Ambiente desta máquina (Windows)

- **JDK 17** em `C:\Program Files\Java\jdk-17.0.19` (exportar `JAVA_HOME` antes do Maven)
- **Maven local** em `tools/apache-maven-3.9.16/bin/mvn` (o mvnw falha: curl da máquina precisa de `--ssl-no-revoke`)
- **TLS interceptado** (antivírus/proxy): Maven exige `MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"`
- Sem `jq` e **sem Python** instalados; Node 24 disponível. Validar JSON com `node -e`.
- Shell principal: Git Bash (caminhos `/d/Projetos/Laleo`).
- **Porta 8080 costuma estar ocupada** por outro java.exe — backend do Laleo usa 8081.

Build do backend:
```bash
cd /d/Projetos/Laleo/backend && export JAVA_HOME="/c/Program Files/Java/jdk-17.0.19" \
  && export MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT" \
  && ../tools/apache-maven-3.9.16/bin/mvn -q verify
```

## Assets e binários auto-hospedados (frontend/public/)

- `models/lala.vrm` (Vita) e `models/leo.vrm` (Sendagaya Shibu) — VRoid beta samples, **CC0**,
  de `madjin/vrm-samples`. Perfis avatar+voz em `frontend/src/avatar/perfis.ts` (Laleo = Lala + Leo);
  a voz da Lala é o faber com playbackRate 1.18 (Piper não tem voz feminina pt-BR)
- `ort/` — onnxruntime-web **1.18.0** WASM (a versão precisa casar com a resolvida no package-lock;
  é peerDependency do piper-tts-web e está fixada no package.json por isso)
- `piper/` — piper_phonemize WASM/data (de `@diffusionstudio/piper-wasm`)
- A voz (`pt_BR-faber-medium.onnx`, 60 MB) é baixada do HuggingFace no primeiro uso e cacheada
  em OPFS pelo navegador — não fica no repositório
- PENDENTE: confirmar licença do dataset da voz "faber" para uso comercial

## Projetos open source de referência

- Exercícios gamificados + reconhecimento: `MosheT01/Speech-Therapy-For-Kids-...` (GitHub)
- Avatar VRM conversacional: Amica (heyamica.com), Utsuwa, `kiranbaby14/TalkMateAI`
- Pontuação de pronúncia: `jimbozhang/speechocean762` (corpus + receita GOP/Kaldi)
