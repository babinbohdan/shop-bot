@echo off
set SKILLS_DIR=%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\f130071f-af99-47fb-9282-daf85e98d28d\b971e3bc-bfbf-420b-81db-9fd703efe219\skills

echo Copying shop-bot-feature skill...
xcopy /E /I /Y "C:\shop_bot\shop-bot-feature" "%SKILLS_DIR%\shop-bot-feature"

echo.
echo Done! Skill installed. Restart Claude to see it.
pause
