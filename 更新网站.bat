@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\Git\cmd"
title 更新网站 - 龙潜猫隐

echo ============================================
echo    更新网站
echo ============================================
echo.
echo 这次改动过的文件：
echo.
git status --short
echo.

set "msg="
set /p "msg=这次改了什么？（直接回车 = 日常更新）: "
if not defined msg set "msg=日常更新"

git add -A
git diff --cached --quiet
if errorlevel 1 goto commit
echo 没有检测到改动，什么都没发生。
goto done

:commit
git commit -m "%msg%"
echo.
echo 正在上传...
git push
if not errorlevel 1 goto ok

echo.
echo [失败] 连不上 GitHub。改动已经存在本地快照里，不会丢。
echo        30 秒后自动重试一次...
ping -n 31 127.0.0.1 >nul
git push
if not errorlevel 1 goto ok

echo.
echo [失败] 重试也没成功。检查网络，或者过会儿再双击一次。
echo        如果代理软件 micore 没开，先打开它——GitHub 直连连不上。
echo        本地快照已经保存，下次重试不会丢东西。
goto done

:ok
echo.
echo [OK] 已上传。大约 30 秒后生效：
echo      https://eliasneko.github.io/coffee-site/

:done
echo.
pause