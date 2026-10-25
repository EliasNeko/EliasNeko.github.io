# 接 Supabase（免费、不用卡、不用开电脑）

## 为什么选它

会员系统需要一个"能被所有设备访问"的后端。四个条件一起看：

| 条件 | Oracle 免费云 | Render 免费 | **Supabase** |
|---|---|---|---|
| 不花钱 | ✅ | ✅ | ✅ |
| 不用信用卡 | ❌ 需验证卡 | ✅ | ✅ |
| 不用一直开着自己电脑 | ✅ | ✅ | ✅ |
| 数据不会丢 | ✅ | ❌ 磁盘是临时的 | ✅ |

只有 Supabase 四项全中。它提供数据库 + REST 接口，网页直接调用，不需要自己维护服务器。

## 步骤（约 5 分钟）

1. 打开 https://supabase.com ，用 **GitHub 账号登录**（不需要信用卡）
2. 点 **New project**，填项目名（例如 coffee-site），设置一个数据库密码（仅建库用，无需记住），区域选 **Singapore**
3. 等 1–2 分钟建好
4. 左侧 **SQL Editor** → New query → 粘贴 `supabase/migrations/001-init.sql` 全部内容 → **Run**
5. 左侧 **Project Settings → API**，复制两样：
   - **Project URL**（形如 `https://xxxx.supabase.co`）
   - **Publishable key**（`sb_publishable_` 开头，可以公开）

把这两个值填进 `coffee-site/config.js`：

```js
window.SUPABASE_URL = "https://xxxx.supabase.co";
window.SUPABASE_KEY = "sb_publishable_...";
```

保存后刷新页面，会员注册和登录就会走云端。

## 接上之后

- 注册和登录都由 Supabase 处理，密码只以哈希形式传输和保存
- 名单在 Supabase 后台 **Table Editor** 里查看，手机也可以
- Java 后端仍然保留，用于跑订单和练习，会员功能不依赖它
- 公开的 `users` 表只有用户名、盐、哈希；QQ / 邮箱存在 `profiles`，匿名读不到

## 数据表

| 表 | 内容 | 可见性 |
|---|---|---|
| `users` | 用户名、盐、哈希、注册时间 | 公开可读（登录需要盐） |
| `profiles` | QQ / 微信、邮箱、设备、时间 | 仅后台可见，匿名访问返回 401 |
