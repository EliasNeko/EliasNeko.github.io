# 小鱼网页项目 · Xiaoyu Website

一个从 HTML5 课堂作业长出来的个人网站，也是我大学创业项目的第一个作品。

## 线上地址

- 咖啡店：https://eliasneko.github.io/coffee-site/
- 知识库：https://eliasneko.github.io/knowledge-base/
- 云端代理：https://coffee-cloud.pages.dev

## 这个项目有什么

- **咖啡店**：菜单、购物车、故事页、会员、云端余额 / 签到 / 转账、咖啡投稿与审核、站长工具、头衔系统。
- **知识库**：学习目录、关键词词典、基础全书、数学 / 英语教材、语言课程、练习任务、教材书架搜索。
- **云端**：Supabase（账号、钱包、咖啡订单、头衔、封禁）+ Cloudflare Pages 反向代理。

## 目录

```text
coffee-site/        咖啡店页面与脚本
  js/               config / member / coffees
knowledge-base/     知识库页面、数学生成器、搜索工具
assets/             全站共用
  js/               chat / cloud-net / live / titles / update-popup
  css/              owner-badge / titles
  images/           校徽、教材封面
supabase/migrations 数据库建表与升级 SQL
docs/               保存流程、免费上线、Supabase 接入说明
cloudflare-proxy/   Supabase 反向代理
```

## 本地预览

在项目根目录运行：

```powershell
python -m http.server 8080
```

然后打开 http://127.0.0.1:8080/coffee-site/ 。

## 保存上线

双击 `save.bat`，或在命令行：

```powershell
git add -A
git commit -m "这次改了什么"
git push
```

保存前先看 `docs/SAVE-GUIDE.md`；账号和本地记录不要提交。

## 文档

- [保存流程](docs/SAVE-GUIDE.md)
- [免费上线说明](docs/FREE-HOSTING-GUIDE.md)
- [Supabase 接入](docs/SUPABASE-SETUP.md)
- [更新日志](CHANGELOG.txt)
