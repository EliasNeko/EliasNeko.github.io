@echo off
title 启动网站 - 龙潜猫隐
cd /d "%~dp0"

set "NGROK_DOMAIN="

echo ============================================
echo    启动网站
echo ============================================
echo.

if exist "server\Server.class" goto run

echo 第一次启动，正在编译后端...
pushd "%~dp0server"
javac Server.java
if errorlevel 1 (
    echo.
    echo [失败] 编译没通过，看上面的提示。
    popd
    pause
    exit /b 1
)
popd

:run
echo 正在启动后端...
pushd "%~dp0server"
start "咖啡店后端" cmd /k java Server
popd
ping -n 4 127.0.0.1 >nul
start "" "http://127.0.0.1:8080/coffee-site/index.html"

if not defined NGROK_DOMAIN goto done

where ngrok >nul 2>&1
if errorlevel 1 (
    echo.
    echo [提示] 没找到 ngrok，外网通道跳过，本机照常用。
    goto done
)

echo.
echo 正在开外网通道：https://%NGROK_DOMAIN%
start "外网通道" cmd /k "ngrok http 8080 --domain=%NGROK_DOMAIN%"

:done
echo.
echo   本机首页：http://127.0.0.1:8080/coffee-site/index.html
echo   站长后台：http://127.0.0.1:8080/coffee-site/admin.html
echo.
echo 关掉「咖啡店后端」那个窗口，网站就停了。
pause
