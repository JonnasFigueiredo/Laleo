# Arquitetura do Laleo

> Decisões tomadas em 2026-07-12, na sessão de concepção do projeto.

## O que é

Aplicativo para crianças (3–10 anos) com dificuldades de fala. Une três coisas que só existem separadas no open source:

1. **Exercícios de fonoaudiologia gamificados** com reconhecimento de fala e feedback em tempo real
2. **Avatar 3D interativo** (formato VRM) que apresenta os exercícios, demonstra sons e reage
3. **IA conversacional** para a criança interagir com o avatar, com guardrails de conteúdo infantil

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Nome | **Laleo** (grego *laleō* = falar) | Verificado livre nas lojas em 2026-07; Tagarela, Calíope, Eulalia e Pheme já têm conflitos |
| Frontend | React + TypeScript + Vite, empacotado com **Capacitor** para mobile | Ecossistema VRM/three.js é JavaScript; um só código para web + Android + iOS |
| Avatar 3D | three.js + @pixiv/three-vrm | Mesmo formato dos projetos de referência (Amica, Utsuwa) — dá para reaproveitar |
| Backend | **Java 17 + Spring Boot 4.1** (Java é exigência do projeto; 17 é o JDK da máquina) | REST na porta 8081, H2 em dev, PostgreSQL em prod |
| Análise de fala | Microserviço separado (Python/ONNX, Docker), chamado só pelo backend | Modelos de pronúncia (GOP, wav2vec2) vivem no ecossistema Python; isola a parte pesada |
| IA conversacional | LLM via gateway no backend, nunca direto do cliente | Segurança da chave + guardrails centralizados |

## Componentes

```
frontend/ (React+TS+Capacitor)
   │  REST /api + WebSocket
   ▼
backend/ (Spring Boot)
   ├── módulo auth (JWT; perfis CRIANCA, RESPONSAVEL, FONOAUDIOLOGO)
   ├── módulo exercicios (catálogo, trilhas por fonema)
   ├── módulo progresso (pontos, conquistas, relatórios p/ fono)
   ├── módulo ia-gateway (LLM p/ conversa do avatar + TTS; filtros infantis)
   └── módulo fala-client → speech-service/
                              (transcrição + nota por fonema, pt-BR)
```

## Fluxo do exercício "ouça e repita"

1. Backend escolhe a palavra-alvo conforme o plano da criança (fonemas em treino)
2. Avatar fala a palavra (TTS) e anima a boca
3. Criança grava repetindo; áudio vai ao backend → speech-service
4. Resposta: transcrição + nota por fonema → avatar reage (sempre positivo)
5. Progresso persiste; fonemas fracos ganham peso nos próximos exercícios

## Riscos conhecidos

- **Pronúncia pt-BR infantil**: não há modelo pronto; corpus speechocean762 é inglês. Começar com transcrição simples (acertou/errou a palavra) e evoluir para nota por fonema.
- **Voz infantil degrada ASR** treinado em adultos — validar cedo com áudio real.
- **LGPD**: consentimento dos responsáveis, áudio efêmero, dados mínimos.
- Envolver fonoaudiólogo(a) na definição dos exercícios — o app apoia a terapia, não a substitui.

## Referências open source

- https://github.com/MosheT01/Speech-Therapy-For-Kids-With-Speech-impediments-Using-Speech-Recognition-Technologies
- https://www.heyamica.com/ · https://www.utsuwa.ai/
- https://github.com/kiranbaby14/TalkMateAI
- https://github.com/jimbozhang/speechocean762
- https://arxiv.org/pdf/2605.01101 (Virtual Speech Therapist, clinician-in-the-loop)
