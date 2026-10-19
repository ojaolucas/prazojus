@echo off
echo ========================================================
echo   PrazoJus - Publicacao no Git (GitHub)
echo   Repositorio: https://github.com/ojaolucas/prazojus.git
echo ========================================================
echo.

where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [AVISO] O Git ainda nao esta instalado no seu computador.
    echo.
    echo Tentando iniciar o instalador do Git via winget...
    winget install --id Git.Git -e --source winget
    echo.
    echo Por favor, feche e reabra o terminal apos a instalacao e rode:
    echo   .\push-to-git.bat
    pause
    exit /b 1
)

echo [1/5] Inicializando repositorio local...
if not exist ".git" (
    git init
    git branch -M main
)

echo [2/5] Adicionando arquivos do projeto...
git add .

echo [3/5] Criando commit...
git commit -m "feat: MVP do Sistema de Prazos Judiciais (PrazoJus)"

echo [4/5] Configurando remote origin...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/ojaolucas/prazojus.git

echo [5/5] Enviando para o GitHub...
echo (Se solicitado, autorize no popup do navegador com sua conta ojaolucas)
git push -u origin main

echo.
echo ========================================================
echo   Sucesso! Projeto enviado ao GitHub.
echo ========================================================
pause
