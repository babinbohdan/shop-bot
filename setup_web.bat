@echo off
cd /d C:\shop_bot
echo === Creating Next.js 14 app ===
echo y | npx create-next-app@14 web --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-git > web_setup_log.txt 2>&1
echo Exit: %ERRORLEVEL% >> web_setup_log.txt
echo === Installing zustand ===
cd web
call npm install zustand >> ..\web_setup_log.txt 2>&1
echo DONE >> ..\web_setup_log.txt
