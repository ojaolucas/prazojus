# Script PowerShell para publicacao no GitHub
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PrazoJus - Publicacao no Git (GitHub)" -ForegroundColor Cyan
Write-Host "  Repositorio: https://github.com/ojaolucas/prazojus.git" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[AVISO] O Git ainda nao esta instalado no sistema." -ForegroundColor Yellow
    Write-Host "Iniciando instalacao via winget..." -ForegroundColor White
    winget install --id Git.Git -e --source winget
    Write-Host ""
    Write-Host "Apos a instalacao terminar, feche e reabra o terminal e execute:" -ForegroundColor Yellow
    Write-Host "  .\push-to-git.ps1" -ForegroundColor White
    exit 1
}

Write-Host "[1/5] Inicializando repositorio Git local..." -ForegroundColor Green
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

Write-Host "[2/5] Adicionando arquivos..." -ForegroundColor Green
git add .

Write-Host "[3/5] Criando commit..." -ForegroundColor Green
git commit -m "feat: MVP do Sistema de Prazos Judiciais (PrazoJus)"

Write-Host "[4/5] Configurando remote origin..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin https://github.com/ojaolucas/prazojus.git

Write-Host "[5/5] Enviando para o GitHub..." -ForegroundColor Green
Write-Host "(Se solicitado, autentique-se no popup do navegador)" -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Concluido com sucesso!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
