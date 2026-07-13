---
name: rodar
description: Sobe o ambiente de desenvolvimento do Laleo (backend Spring Boot e/ou frontend Vite) e verifica se está tudo no ar. Use quando pedirem para rodar, subir, testar no navegador ou verificar o app.
---

# Rodar o Laleo em desenvolvimento

## Backend (porta 8081)
```bash
cd /d/Projetos/Laleo/backend \
  && export JAVA_HOME="/c/Program Files/Java/jdk-17.0.19" \
  && export MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT" \
  && ../tools/apache-maven-3.9.16/bin/mvn -q spring-boot:run
```
(Não usar `./mvnw` — o curl desta máquina quebra o download do wrapper.)
Em dev usa H2 em memória. Health check: `http://localhost:8081/actuator/health`.

Alternativa mais rápida se o jar já foi buildado:
```bash
"$JAVA_HOME/bin/java" -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```

## Frontend (porta 5173)
```bash
cd /d/Projetos/Laleo/frontend && npm run dev
```
O Vite faz proxy de `/api` para `localhost:8081`.

## Preview no navegador
Prefira `preview_start` com `.claude/launch.json` (configurações `backend` e `frontend`) em vez de Bash — o harness gerencia o ciclo de vida dos servidores.

## Verificação mínima antes de concluir tarefa
1. `mvn -q verify` passa no backend (se o backend foi tocado) — com JAVA_HOME e MAVEN_OPTS acima
2. `npm run build` passa no frontend (se o frontend foi tocado)
3. A tela afetada carrega sem erros no console do navegador

## Aviso sobre screenshot no Browser pane
Screenshots travam com o canvas WebGL do avatar, e o requestAnimationFrame do
painel embutido não roda (canvas fica vazio). Para verificar o visual do avatar:
faça um render manual via `javascript_tool` — importe three e @pixiv/three-vrm de
`/node_modules/.vite/deps/`, carregue `/models/lale.vrm`, chame `renderer.render()`
uma vez e leia pixels com `gl.readPixels` (pele = R alto e R-B > 25). Exemplo real:
sessão de 2026-07-13 detectou avatar de costas medindo pixels de pele nas duas rotações.
