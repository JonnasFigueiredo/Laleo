@echo off
rem Duplo clique para buildar e iniciar o Laleo (backend + frontend).
rem O navegador abre sozinho quando estiver pronto. Feche esta janela para parar.
cd /d "%~dp0"
node scripts\iniciar.mjs
pause
