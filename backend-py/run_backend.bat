@echo off
setlocal

cd /d "%~dp0"
call "wvenv\Scripts\activate.bat"

rem --log-level here controls uvicorn's own access/error logs, not the
rem app's LOG_LEVEL env var (see app/logging_config.py) — the two are
rem independent knobs.
uvicorn app.main:app --reload --port 3001 --log-level info
