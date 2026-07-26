@echo off
title Switch to Deploy Environment - Sentra IntiGizi
echo ==================================================
echo   Sentra IntiGizi - Beralih ke Lingkungan Deploy
echo ==================================================
echo.
set /p domain="Masukkan Domain API Kustom (Contoh: api-supplier.mydomain.com) atau tekan ENTER untuk default: "

echo.
if "%domain%"=="" (
    node "%~dp0switch-env.cjs" deploy
) else (
    node "%~dp0switch-env.cjs" deploy %domain%
)

echo.
pause
