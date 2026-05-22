@echo off
setlocal

set "ROOT=%~dp0"
set "NODE=C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "SERVER=%ROOT%server\index.js"
set "ENV_FILE=%ROOT%server\.env"
set "ENV_EXAMPLE=%ROOT%server\.env.example"

if not exist "%NODE%" (
  echo Bundled Node runtime was not found:
  echo %NODE%
  pause
  exit /b 1
)

if not exist "%SERVER%" (
  echo Server file was not found:
  echo %SERVER%
  pause
  exit /b 1
)

if not exist "%ENV_FILE%" (
  copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul
  echo Created server\.env from server\.env.example
  echo Add your OPENAI_API_KEY in server\.env before using AI features.
  echo.
)

"%NODE%" "%SERVER%"

echo.
echo Server stopped.
pause
