@echo off
rem STYLX Improver — double-click to launch the real control panel.
rem Opens the dashboard in your browser and keeps the server running in this window.
rem Close this window to stop the server.
cd /d "%~dp0..\.."
start "" http://localhost:4317
node agents\improver\server.mjs
pause
