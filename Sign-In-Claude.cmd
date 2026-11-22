@echo off
title Easy Buddy - Sign in to Claude
setlocal
set "CLAUDE_EXE="
rem Versions are listed oldest to newest, so the last match is the newest Claude Code
for /f "delims=" %%F in ('dir /b /s "%LOCALAPPDATA%\Claude-Data\claude.exe" 2^>nul') do set "CLAUDE_EXE=%%F"
if not defined CLAUDE_EXE (
  echo Could not find Claude Code. Make sure the Claude desktop app is installed.
  pause
  exit /b 1
)
echo.
echo  Signing Claude Code in to your Claude account...
echo  A browser window will open: sign in and click Authorize.
echo.
"%CLAUDE_EXE%" auth login
echo.
echo  ---- Current status ----
"%CLAUDE_EXE%" auth status
echo.
echo  If you see "loggedIn": true above, you're done. You can close this window.
pause
