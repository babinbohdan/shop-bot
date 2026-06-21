@echo off
echo Installing Next.js dependencies...
cd /d C:\shop_bot\web
npm install > ..\web_install_log.txt 2>&1
echo.
echo DONE >> ..\web_install_log.txt
echo Install complete! Check web_install_log.txt for details.
pause
