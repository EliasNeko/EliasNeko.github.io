/* ================= 后端配置 =================
   1) 用 Supabase（推荐，不用开电脑）：填下面两个值
   2) 用自己电脑上的 Java 服务：SUPABASE 留空，COFFEE_API 也留空（同源）
   3) 部署到别的域名：COFFEE_API 填那个地址，结尾不要带斜杠
   ============================================ */

window.SUPABASE_URL = "https://wjvwupcquwjoajdvinkx.supabase.co";
window.SUPABASE_KEY = "sb_publishable_Wy3IyDHb-0yFAuRHbxuLFw_obIXU3OI";

/* 如果 supabase.co 在某些网络被重置，可以在这里填反向代理地址（结尾不带斜杠）。
   代理要转发 /rest/v1/* 到上面的 SUPABASE_URL；留空就直连。 */
window.SUPABASE_PROXY = "";

window.COFFEE_API = "";
