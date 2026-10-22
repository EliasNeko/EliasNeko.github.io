@echo off
title 更新网站 - 龙潜猫隐
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\Git\cmd"

echo ============================================
echo    更新网站  （只上传该上传的）
echo ============================================
echo.

if not exist ".gitignore" echo. > .gitignore
findstr /C:"server/users.jsonl" ".gitignore" >nul 2>&1
if errorlevel 1 echo server/users.jsonl>> ".gitignore"
findstr /C:"server/orders.jsonl" ".gitignore" >nul 2>&1
if errorlevel 1 echo server/orders.jsonl>> ".gitignore"
findstr /C:"server/admin.key" ".gitignore" >nul 2>&1
if errorlevel 1 echo server/admin.key>> ".gitignore"

echo 这次改动过的文件：
echo.
git status --short
echo.

git add -A

echo 准备上传的文件清单：
echo.
git diff --cached --name-only
echo.

git diff --cached --name-only | findstr /I /C:"users.jsonl" /C:"users.local" /C:"orders.jsonl" >nul
if not errorlevel 1 (
    echo [已停止] 待上传列表里出现了不该上传的数据文件。
    echo           已自动撤下，请人工检查 .gitignore。
    git reset --quiet
    echo.
    pause
    exit /b 1
)

git diff --cached --quiet
if errorlevel 1 goto commit
echo 没有检测到改动，什么都没发生。
goto done

:commit
set "msg="
set /p "msg=这次改了什么？（直接回车 = 日常更新）: "
if not defined msg set "msg=日常更新"

git commit -m "%msg%"
echo.
echo 正在上传...
git push
if not errorlevel 1 goto ok

set "PROXY="
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$s=(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings').ProxyServer; if($s){$s}"`) do set "PROXY=%%p"
if defined PROXY (
    echo.
    echo [提示] 第一次没推上去，改用系统代理 %PROXY% 再试...
    git -c http.proxy=http://%PROXY% push
    if not errorlevel 1 goto ok
)

echo.
echo [提示] 代理也不行，改用直连再试一次...
git -c "http.https://github.com.proxy=" push
if not errorlevel 1 goto ok

echo.
echo [失败] 连不上 GitHub。改动已经存在本地快照里，不会丢。
echo        30 秒后自动重试一次...
ping -n 31 127.0.0.1 >nul
git push
if not errorlevel 1 goto ok

set "PROXY="
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$s=(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings').ProxyServer; if($s){$s}"`) do set "PROXY=%%p"
if defined PROXY (
    echo.
    echo [提示] 第一次没推上去，改用系统代理 %PROXY% 再试...
    git -c http.proxy=http://%PROXY% push
    if not errorlevel 1 goto ok
)

echo.
echo [提示] 代理也不行，改用直连再试一次...
git -c "http.https://github.com.proxy=" push
if not errorlevel 1 goto ok

echo.
echo [失败] 重试也没成功。检查网络，或者过会儿再双击一次。
echo        如果代理软件 micore 没开，先打开它。
goto done

:ok
echo.
echo [OK] 已上传。大约 30 秒后生效：
echo      https://eliasneko.github.io/coffee-site/

:done
echo.
pause
