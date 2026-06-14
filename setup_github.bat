@echo off
title GITHUB SETUP
cd /d C:\shop_bot

git config --global user.email "babin.bohdan@chnu.edu.ua"
git config --global user.name "Bohdan Babin"

git init
git add .
git commit -m "Initial commit: Shop Bot + Mini App"

echo.
echo STEPS:
echo 1. Open https://github.com/new
echo 2. Name: shop-bot
echo 3. Private repo
echo 4. NO readme, NO gitignore
echo 5. Click "Create repository"
echo 6. Copy the URL (https://github.com/YOUR-USER/shop-bot.git)
echo.
set /p REPO_URL="Paste repo URL here: "

git branch -M main
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo DONE! Now go to https://railway.app
echo.
pause
