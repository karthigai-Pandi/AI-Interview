@echo off
cd /d "%~dp0backend"
if not exist .env copy .env.example .env
if not exist node_modules call npm install
npm run dev
