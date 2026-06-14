@echo off
echo === Building React Mini App ===
cd /d C:\shop_bot\mini_app
call npm run build
if errorlevel 1 (
    echo BUILD FAILED - check errors above
    pause
    exit /b 1
)

echo === Committing and pushing to GitHub ===
cd /d C:\shop_bot
git add -A
git commit -m "Feature: search, filters, sort, order history, similar products, cart badge"
git push

echo.
echo === Done! Railway will redeploy automatically in ~2 minutes ===
pause
