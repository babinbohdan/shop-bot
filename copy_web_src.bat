@echo off
cd /d C:\shop_bot

echo Copying source files into web/ ...

:: App files
xcopy /E /Y /I "_web_src\app" "web\app" > nul
xcopy /E /Y /I "_web_src\components" "web\components" > nul
xcopy /E /Y /I "_web_src\lib" "web\lib" > nul

:: Config files
copy /Y "_web_src\next.config.ts" "web\next.config.ts" > nul
copy /Y "_web_src\tailwind.config.ts" "web\tailwind.config.ts" > nul
copy /Y "_web_src\.env.local" "web\.env.local" > nul

echo Done! Starting dev server...
cd web
start cmd /k "npm run dev"
