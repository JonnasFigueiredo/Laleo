# Contrato do speech-service

Serviço de análise de pronúncia do Laleo. **Ainda não implementado** — em dev o backend usa
`FalaServiceMock` (mesmo contrato). Este documento é a especificação para a implementação real.

## Princípios

- Stateless: recebe áudio, devolve análise, **não persiste nada** (LGPD — voz de criança é dado sensível)
- Chamado **somente pelo backend Java** (rede interna); nunca exposto ao cliente
- pt-BR como língua alvo; falantes são crianças de 3–10 anos

## Endpoint

```
POST /analisar
Content-Type: multipart/form-data
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `audio` | arquivo (webm/ogg/wav) | Gravação da criança (≤ 15 s) |
| `palavraAlvo` | string | Palavra ou frase esperada, ex.: `"Rato"` |
| `fonemaAlvo` | string | Fonema em treino, ex.: `"R"`, `"CH"`, `"LH"` |

### Resposta `200`

```json
{
  "palavraAlvo": "Rato",
  "transcricao": "rato",
  "notaGeral": 82,
  "fonemas": [
    { "fonema": "R", "nota": 74 },
    { "fonema": "A", "nota": 95 }
  ]
}
```

- `notaGeral`: 0–100 (qualidade global da produção contra a palavra alvo)
- `fonemas[].nota`: 0–100 por fonema (estilo GOP — Goodness of Pronunciation)

### Erros

- `400`: áudio ausente/corrompido ou parâmetros faltando
- `422`: áudio válido mas sem fala detectável

## Roteiro de implementação (fases)

1. **v0 — acertou/errou**: ASR (Whisper small multilingual ou wav2vec2 pt-BR) + comparação
   fuzzy da transcrição com a palavra alvo. `fonemas` devolve só o fonema alvo com nota derivada.
2. **v1 — nota por fonema**: alinhamento forçado (ex.: Montreal Forced Aligner ou wav2vec2
   CTC segmentation) + GOP por fonema.
3. **v2 — fala infantil**: fine-tuning/calibração com dados reais (coletados com consentimento),
   avaliação com fonoaudiólogo(a).

## Ambiente

Empacotar em Docker (a máquina de dev não tem Python nativo). Sugestão: FastAPI + faster-whisper.
