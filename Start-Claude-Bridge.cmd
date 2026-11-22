@echo off
title Easy Buddy - Local Claude Bridge
cd /d "%~dp0"
if not exist "dist\index.html" (
  echo Building Easy Buddy for the first time...
  call npm.cmd run build
)
set OPEN_BROWSER=1
node "%~dp0bridge\claude-bridge.mjs"
pause
