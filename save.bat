@echo off
title save - 龙潜猫隐
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\Git\cmd"

echo ============================================
echo    save：检查 - 提交 - 推送
echo ============================================
echo.

echo [1/4] 这次改了什么：
git status --short
echo.

echo [2/4] 检查敏感文件...
if not exist ".gitignore" echo. > .gitignore
findstr /C:"server/users.jsonl" ".gitignore" >nul 2>&1
if errorlevel 1 echo server/users.jsonl>> ".gitignore"
findstr /C:"server/admin.key" ".gitignore" >nul 2>&1
if errorlevel 1 echo server/admin.key>> ".gitignore"

git add -A
git diff --cached --name-only | findstr /I /C:"users.jsonl" /C:"admin.key" /C:"users.local" >nul
if not errorlevel 1 (
    echo [停止] 待上传列表里有不该上传的数据文件，已撤下。
    git reset --quiet
    pause
    exit /b 1
)

echo [3/4] 提交...
git diff --cached --quiet
if not errorlevel 1 (
    echo 没有改动。
    goto done
)
set "msg=save：日常同步"
set /p "msg=这次改了什么？（回车用默认）: "
if not defined msg set "msg=save：日常同步"
git commit -m "%msg%"

echo [4/4] 推送...
set "GIT_TERMINAL_PROMPT=0"
git push
if not errorlevel 1 goto ok

set "PROXY="
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$s=(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings').ProxyServer; if($s){$s}"`) do set "PROXY=%%p"
if defined PROXY (
    echo 改用系统代理 %PROXY% 再试...
    git -c http.proxy=http://%PROXY% push
    if not errorlevel 1 goto ok
)
git -c "http.https://github.com.proxy=" push
if not errorlevel 1 goto ok

echo [失败] 都不通。检查 VPN 或双击 更新网站.bat。
goto done

:ok
echo [OK] 已推送到 GitHub。约 30 秒后生效。

:done
echo.
pause